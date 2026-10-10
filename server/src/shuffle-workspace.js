import { createHash } from 'node:crypto';
import { getCanonicalPeriod, parseCanonicalPeriod, evaluateShuffleEligibility } from './canonical-period.js';
import { simulateDistribution } from './shuffle-simulation.js';

const isUuid = v => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);

export async function readShuffleWorkspace(client, { lock = false, asOf = null } = {}) {
  const groups = (await client.query('SELECT id,name,status FROM groups ORDER BY lower(name),id LIMIT 5001' + (lock ? ' FOR UPDATE' : ''))).rows;
  const rawMembers = (await client.query(`
    SELECT u.id, u.name AS full_name, u.profession, u.role, u.account_status,
      to_jsonb(u)->>'subscription_plan' AS subscription_plan,
      to_jsonb(u)->>'subscription_end_date' AS subscription_end_date,
      COALESCE(
        (
          SELECT (h.after_state->>'group_id')::uuid
          FROM group_membership_history h
          WHERE h.user_id = u.id 
            AND h.after_state->>'status' = 'ACTIVE'
            AND (h.after_state->>'group_id') IS NOT NULL
            AND (h.after_state->>'group_id')::uuid NOT IN (
              SELECT gm.group_id FROM group_members gm WHERE gm.user_id = u.id AND gm.status = 'ACTIVE'
            )
          ORDER BY h.recorded_at DESC, h.id DESC
          LIMIT 1
        ),
        (
          SELECT gm_prev.group_id
          FROM group_members gm_prev
          WHERE gm_prev.user_id = u.id AND gm_prev.status = 'INACTIVE'
          ORDER BY gm_prev.joined_at DESC
          LIMIT 1
        )
      ) AS previous_group_id,
      COALESCE(
        (
          SELECT count(*)::int
          FROM group_membership_history h
          WHERE h.user_id = u.id AND h.operation = 'DELETE'
            AND h.operation_context->>'action' = 'MEMBER_REMOVAL'
        ), 0
      ) AS removal_count,
      (
        SELECT max(h.recorded_at)
        FROM group_membership_history h
        WHERE h.user_id = u.id AND h.operation = 'DELETE'
          AND h.operation_context->>'action' = 'MEMBER_REMOVAL'
      ) AS last_removed_at
    FROM users u
    ORDER BY lower(u.name), u.id
    LIMIT 10001
  ` + (lock ? ' FOR UPDATE OF u' : ''))).rows;

  const memberships = (await client.query(`
    SELECT gm.group_id, gm.user_id, gm.role, gm.joined_at
    FROM group_members gm
    JOIN users u ON u.id = gm.user_id
    JOIN groups g ON g.id = gm.group_id
    WHERE gm.status = 'ACTIVE'
    ORDER BY gm.group_id, gm.user_id
    LIMIT 20001
  ` + (lock ? ' FOR UPDATE OF gm' : ''))).rows;

  if (groups.length > 5000 || rawMembers.length > 10000 || memberships.length > 20000) {
    throw Object.assign(Error('Workspace exceeds supported size'), { code: 'WORKSPACE_SIZE', status: 503 });
  }

  const period = getCanonicalPeriod(asOf || new Date());

  const members = rawMembers.map(m => {
    const eligibility = evaluateShuffleEligibility(m, { cutoffDate: period.cutoffDate, now: asOf || new Date() });
    return {
      id: m.id,
      full_name: m.full_name,
      profession: m.profession,
      role: m.role,
      account_status: m.account_status,
      previous_group_id: m.previous_group_id || null,
      is_eligible: eligibility.isEligible,
      eligibility_category: eligibility.category,
      ineligibility_reasons: eligibility.reasons,
      ineligibility_details: eligibility.details,
      removal_ban: eligibility.removalBan,
    };
  });

  const data = { groups, members, memberships };
  return {
    ...data,
    period,
    historyAvailable: false,
    revision: createHash('sha256').update(JSON.stringify(data)).digest('hex'),
  };
}

export function installShuffleWorkspace(app, { pool, authenticateToken }) {
  app.get('/api/admin/shuffle-workspace', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (Object.keys(req.query).length) return res.status(400).json({ error: 'Invalid workspace query' });
    if (!isUuid(req.user.id)) return res.sendStatus(401);
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const actor = (await client.query('SELECT role,now() AS as_of FROM users WHERE id=$1', [req.user.id])).rows[0];
      if (!actor) { await client.query('ROLLBACK'); return res.sendStatus(401); }
      if (actor.role !== 'ADMIN') { await client.query('ROLLBACK'); return res.sendStatus(403); }
      const data = await readShuffleWorkspace(client, { asOf: actor.as_of });
      await client.query('COMMIT');
      res.json({ version: 1, ownerId: req.user.id, asOf: actor.as_of, ...data });
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('Shuffle workspace failed:', error.code || 'UNKNOWN');
      res.status(error.status || 500).json({ error: 'Shuffle workspace unavailable' });
    } finally {
      client?.release();
    }
  });

  app.post('/api/admin/shuffle-preview', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    if (!isUuid(req.user.id)) return res.sendStatus(401);
    if (Object.keys(req.query).length) return res.sendStatus(400);

    const { expectedRevision, respectLocks, lockedMembers, targetPeriodKey } = req.body || {};
    if (expectedRevision !== undefined && (typeof expectedRevision !== 'string' || !/^[a-f0-9]{64}$/.test(expectedRevision))) {
      return res.status(400).json({ error: 'Geçersiz dağılım sürümü formatı.' });
    }
    if (lockedMembers !== undefined && (!Array.isArray(lockedMembers) || !lockedMembers.every(isUuid))) {
      return res.status(400).json({ error: 'Geçersiz kilitli üye listesi.' });
    }
    if (targetPeriodKey !== undefined && (typeof targetPeriodKey !== 'string' || !/^\d{4}-T[1-3]$/.test(targetPeriodKey))) {
      return res.status(400).json({ error: 'Geçersiz dönem formatı (YYYY-T[1-3]).' });
    }

    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const actor = (await client.query('SELECT role,now() AS as_of FROM users WHERE id=$1', [req.user.id])).rows[0];
      if (!actor) { await client.query('ROLLBACK'); return res.sendStatus(401); }
      if (actor.role !== 'ADMIN') { await client.query('ROLLBACK'); return res.sendStatus(403); }

      const workspace = await readShuffleWorkspace(client, { asOf: actor.as_of });
      if (expectedRevision && workspace.revision !== expectedRevision) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: 'Grup veya üye kayıtları değişti. Güncel dağılımı yükleyin.', code: 'SHUFFLE_STALE' });
      }

      const period = targetPeriodKey ? parseCanonicalPeriod(targetPeriodKey) || workspace.period : workspace.period;

      // Group existing assignments for lock resolution
      const currentGroups = {};
      for (const g of workspace.groups) currentGroups[g.id] = [];
      currentGroups.unassigned = [];
      const assignedIds = new Set();
      for (const m of workspace.memberships) {
        if (currentGroups[m.group_id]) {
          currentGroups[m.group_id].push(m.user_id);
          assignedIds.add(m.user_id);
        }
      }
      for (const m of workspace.members) {
        if (m.account_status === 'ACTIVE' && m.role !== 'ADMIN' && !assignedIds.has(m.id)) {
          currentGroups.unassigned.push(m.id);
        }
      }

      // Filter candidates: only eligible members (or explicitly locked members)
      const candidateMembers = workspace.members.filter(m => m.is_eligible || (Array.isArray(lockedMembers) && lockedMembers.includes(m.id)));

      const simulation = simulateDistribution(candidateMembers, workspace.groups, {
        currentDistribution: currentGroups,
        lockedMembers: lockedMembers || [],
        respectLocks: respectLocks !== false,
        minimizeOverlap: true,
        maxCapacity: 35,
      });

      const previewRevision = createHash('sha256')
        .update(JSON.stringify([workspace.revision, simulation.assignments, period.periodKey]))
        .digest('hex');

      await client.query('COMMIT');
      res.json({
        version: 1,
        ownerId: req.user.id,
        asOf: actor.as_of,
        period,
        expectedRevision: workspace.revision,
        previewRevision,
        assignments: simulation.assignments,
        unassigned: simulation.unassigned,
        unassignedReport: simulation.unassignedReport,
        stats: simulation.stats,
        candidatesSummary: {
          total: workspace.members.length,
          eligible: candidateMembers.length,
          ineligible: workspace.members.filter(m => !m.is_eligible && m.role !== 'ADMIN').length,
          excluded: workspace.members.filter(m => m.role === 'ADMIN').length,
        },
      });
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('Shuffle preview failed:', error.code || 'UNKNOWN');
      res.status(error.status || 500).json({ error: 'Shuffle önizlemesi oluşturulamadı.' });
    } finally {
      client?.release();
    }
  });
}
