import { randomUUID } from 'node:crypto';
import pool from '../config/db.js';
import { setMembershipOperationContext } from '../membership-operation-context.js';

export const SCORE_RULES = {
  version: '2026.1',
  lookbackMonths: 6,
  weights: {
    ATTENDANCE: {
      PRESENT: 10,
      ABSENT: -10,
      LATE: 5,
      SUBSTITUTE: 10,
      REGISTERED: 0, // Kural: REGISTERED puan kaynağı değildir
      MEDICAL: 0,
    },
    REFERRAL: {
      INTERNAL: 10,
      EXTERNAL: 5,
      SUCCESSFUL_BUSINESS: 5, // Ciro girişi bonusu
    },
    VISITOR: {
      ATTENDED: 10,
      JOINED: 10,
      INVITED: 0,
    },
    ONE_TO_ONE: {
      COMPLETED: 10,
      PENDING: 0,
      REJECTED: 0,
    },
    EDUCATION_UNIT: 0,
  },
};

export function formatPeriodKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function isValidPeriodKey(period) {
  return typeof period === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

// Retrieve stored score adjustments from system_settings
export const getStoredAdjustments = async (client = null) => {
  const db = client || pool;
  try {
    const res = await db.query("SELECT value FROM system_settings WHERE key = 'score_adjustments'");
    if (res.rowCount && res.rows[0].value) {
      return JSON.parse(res.rows[0].value);
    }
  } catch (err) {
    console.error('Error fetching score_adjustments:', err);
  }
  return [];
};

export const buildScoreEvents = async (userId, options = {}, client = null) => {
  const db = client || pool;
  const lookbackMonths = options.lookbackMonths ?? null;
  const periodFilter = options.period ?? null;
  const sourceKindFilter = options.sourceKind ?? null;

  let cutoffDate = null;
  if (lookbackMonths && Number.isInteger(lookbackMonths) && lookbackMonths > 0) {
    cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - lookbackMonths);
  }

  const [attRes, refRes, visRes, otoRes, eduRes, adjustments] = await Promise.all([
    db.query(`
      SELECT 
        a.id, 
        a.user_id, 
        a.status, 
        COALESCE(e.start_at, a.created_at) AS occurred_at,
        e.title AS event_title
      FROM attendance a
      LEFT JOIN events e ON a.event_id = e.id
      WHERE a.user_id = $1 
        AND a.status IN ('PRESENT', 'ABSENT', 'LATE', 'SUBSTITUTE')
      ORDER BY occurred_at DESC
    `, [userId]),
    db.query(`
      SELECT 
        id, 
        giver_id, 
        type, 
        status, 
        amount, 
        description, 
        created_at AS occurred_at
      FROM referrals
      WHERE giver_id = $1
      ORDER BY created_at DESC
    `, [userId]),
    db.query(`
      SELECT 
        id, 
        inviter_id, 
        name, 
        status, 
        COALESCE(visited_at, created_at) AS occurred_at
      FROM visitors
      WHERE inviter_id = $1 
        AND status IN ('ATTENDED', 'JOINED')
      ORDER BY occurred_at DESC
    `, [userId]),
    db.query(`
      SELECT 
        id, 
        requester_id, 
        partner_id, 
        meeting_date AS occurred_at, 
        status
      FROM one_to_ones
      WHERE requester_id = $1 
        AND status = 'COMPLETED'
      ORDER BY meeting_date DESC
    `, [userId]),
    db.query(`
      SELECT 
        id, 
        user_id, 
        title, 
        hours, 
        completed_date AS occurred_at
      FROM education
      WHERE user_id = $1
      ORDER BY completed_date DESC
    `, [userId]),
    getStoredAdjustments(db),
  ]);

  const rawEvents = [];

  // 1. Attendance Events
  for (const row of attRes.rows) {
    const points = SCORE_RULES.weights.ATTENDANCE[row.status] ?? 0;
    if (points === 0) continue;
    const occurredAt = new Date(row.occurred_at);
    const periodKey = formatPeriodKey(occurredAt);
    rawEvents.push({
      id: `att-${row.id}`,
      userId,
      sourceKind: 'ATTENDANCE',
      sourceId: row.id,
      periodKey,
      points,
      ruleVersion: SCORE_RULES.version,
      occurredAt: occurredAt.toISOString(),
      idempotencyKey: `ATTENDANCE:${row.id}`,
      correctionOfId: null,
      description: `Toplantı Katılımı (${row.status}${row.event_title ? ` - ${row.event_title}` : ''})`,
    });
  }

  // 2. Referrals Events
  for (const row of refRes.rows) {
    const occurredAt = new Date(row.occurred_at);
    const periodKey = formatPeriodKey(occurredAt);

    // Base Referral Points
    let basePoints = 0;
    if (row.type === 'INTERNAL') basePoints = SCORE_RULES.weights.REFERRAL.INTERNAL;
    else if (row.type === 'EXTERNAL') basePoints = SCORE_RULES.weights.REFERRAL.EXTERNAL;

    if (basePoints > 0) {
      rawEvents.push({
        id: `ref-base-${row.id}`,
        userId,
        sourceKind: 'REFERRAL',
        sourceId: row.id,
        periodKey,
        points: basePoints,
        ruleVersion: SCORE_RULES.version,
        occurredAt: occurredAt.toISOString(),
        idempotencyKey: `REFERRAL:${row.id}`,
        correctionOfId: null,
        description: `${row.type === 'INTERNAL' ? 'İç Referans' : 'Dış Referans'} (+${basePoints})`,
      });
    }

    // Extra Points for Successful Business (Ciro Katkısı)
    if (row.status === 'SUCCESSFUL') {
      const bonusPoints = SCORE_RULES.weights.REFERRAL.SUCCESSFUL_BUSINESS;
      rawEvents.push({
        id: `ref-success-${row.id}`,
        userId,
        sourceKind: 'REFERRAL',
        sourceId: row.id,
        periodKey,
        points: bonusPoints,
        ruleVersion: SCORE_RULES.version,
        occurredAt: occurredAt.toISOString(),
        idempotencyKey: `REFERRAL:${row.id}:SUCCESSFUL`,
        correctionOfId: null,
        description: `Başarılı Referans Ciro Katkısı (+${bonusPoints})`,
      });
    }
  }

  // 3. Visitors Events
  for (const row of visRes.rows) {
    const occurredAt = new Date(row.occurred_at);
    const periodKey = formatPeriodKey(occurredAt);
    const points = SCORE_RULES.weights.VISITOR[row.status] ?? 0;
    if (points > 0) {
      rawEvents.push({
        id: `vis-${row.id}`,
        userId,
        sourceKind: 'VISITOR',
        sourceId: row.id,
        periodKey,
        points,
        ruleVersion: SCORE_RULES.version,
        occurredAt: occurredAt.toISOString(),
        idempotencyKey: `VISITOR:${row.id}`,
        correctionOfId: null,
        description: `Ziyaretçi Katılımı (${row.name || 'Misafir'})`,
      });
    }
  }

  // 4. One-to-Ones Events
  for (const row of otoRes.rows) {
    const occurredAt = new Date(row.occurred_at);
    const periodKey = formatPeriodKey(occurredAt);
    const points = SCORE_RULES.weights.ONE_TO_ONE.COMPLETED;
    rawEvents.push({
      id: `oto-${row.id}`,
      userId,
      sourceKind: 'ONE_TO_ONE',
      sourceId: row.id,
      periodKey,
      points,
      ruleVersion: SCORE_RULES.version,
      occurredAt: occurredAt.toISOString(),
      idempotencyKey: `ONE_TO_ONE:${row.id}`,
      correctionOfId: null,
      description: 'Birebir Görüşme (1-to-1)',
    });
  }

  // 5. Education Events
  for (const row of eduRes.rows) {
    const points = Math.floor(parseFloat(row.hours || 0)) * SCORE_RULES.weights.EDUCATION_UNIT;
    if (points > 0) {
      const occurredAt = new Date(row.occurred_at);
      const periodKey = formatPeriodKey(occurredAt);
      rawEvents.push({
        id: `edu-${row.id}`,
        userId,
        sourceKind: 'EDUCATION',
        sourceId: row.id,
        periodKey,
        points,
        ruleVersion: SCORE_RULES.version,
        occurredAt: occurredAt.toISOString(),
        idempotencyKey: `EDUCATION:${row.id}`,
        correctionOfId: null,
        description: `Eğitim Katılımı (${row.title || 'Eğitim'})`,
      });
    }
  }

  // 6. Score Adjustment Events (Gerekçeli İdari Düzeltmeler)
  for (const adj of adjustments) {
    if (adj.userId === userId) {
      const occurredAt = new Date(adj.appliedAt);
      rawEvents.push({
        id: `adj-${adj.id}`,
        userId,
        sourceKind: 'ADJUSTMENT',
        sourceId: adj.id,
        periodKey: adj.periodKey,
        points: adj.points,
        ruleVersion: SCORE_RULES.version,
        occurredAt: occurredAt.toISOString(),
        idempotencyKey: adj.idempotencyKey || `ADJUSTMENT:${adj.id}`,
        correctionOfId: adj.correctionOfId || null,
        description: `İdari Puan Düzeltmesi (${adj.reason}): ${adj.points > 0 ? '+' : ''}${adj.points}`,
      });
    }
  }

  // Deduplication by idempotencyKey
  const seenKeys = new Set();
  const dedupedEvents = [];
  for (const evt of rawEvents) {
    if (!seenKeys.has(evt.idempotencyKey)) {
      seenKeys.add(evt.idempotencyKey);
      dedupedEvents.push(evt);
    }
  }

  // Filter by cutoffDate if specified
  let filtered = dedupedEvents;
  if (cutoffDate) {
    filtered = filtered.filter(e => new Date(e.occurredAt) > cutoffDate);
  }
  // Filter by periodKey if specified
  if (periodFilter) {
    filtered = filtered.filter(e => e.periodKey === periodFilter);
  }
  // Filter by sourceKind if specified
  if (sourceKindFilter) {
    filtered = filtered.filter(e => e.sourceKind === sourceKindFilter);
  }

  filtered.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  return filtered;
};

export const calculateMemberScore = async (userId, transactionClient = null) => {
  const client = transactionClient || await pool.connect();
  try {
    const events = await buildScoreEvents(userId, { lookbackMonths: SCORE_RULES.lookbackMonths }, client);
    const rawScore = events.reduce((sum, e) => sum + e.points, 0);
    const finalScore = Math.min(Math.max(rawScore, 0), 100);

    let color = 'GREY';
    if (finalScore >= 70) color = 'GREEN';
    else if (finalScore >= 50) color = 'YELLOW';
    else if (finalScore >= 30) color = 'RED';

    // Update User
    await client.query(`
      UPDATE users 
      SET performance_score = $1, performance_color = $2, updated_at = NOW() 
      WHERE id = $3
    `, [finalScore, color, userId]);

    // Record History
    await client.query(`
      INSERT INTO user_score_history (user_id, score, color) VALUES ($1, $2, $3)
    `, [userId, finalScore, color]);

    return { score: finalScore, color, rawScore, eventsCount: events.length, ruleVersion: SCORE_RULES.version };
  } catch (e) {
    if (transactionClient) throw e;
    console.error('Scoring error:', e);
  } finally {
    if (!transactionClient) client.release();
  }
};

export const getScoreLedger = async (userId, options = {}, client = null) => {
  const db = client || pool;
  const events = await buildScoreEvents(userId, options, db);

  const periods = {};
  const bySource = {
    ATTENDANCE: 0,
    REFERRAL: 0,
    VISITOR: 0,
    ONE_TO_ONE: 0,
    EDUCATION: 0,
    ADJUSTMENT: 0,
  };

  let totalScoreRaw = 0;
  for (const evt of events) {
    totalScoreRaw += evt.points;
    bySource[evt.sourceKind] = (bySource[evt.sourceKind] || 0) + evt.points;

    if (!periods[evt.periodKey]) {
      periods[evt.periodKey] = {
        period: evt.periodKey,
        score: 0,
        eventCount: 0,
        positivePoints: 0,
        negativePoints: 0,
      };
    }
    periods[evt.periodKey].score += evt.points;
    periods[evt.periodKey].eventCount += 1;
    if (evt.points > 0) periods[evt.periodKey].positivePoints += evt.points;
    else periods[evt.periodKey].negativePoints += evt.points;
  }

  const finalScore = Math.min(Math.max(totalScoreRaw, 0), 100);
  let color = 'GREY';
  if (finalScore >= 70) color = 'GREEN';
  else if (finalScore >= 50) color = 'YELLOW';
  else if (finalScore >= 30) color = 'RED';

  return {
    userId,
    totalScore: finalScore,
    rawScore: totalScoreRaw,
    color,
    ruleVersion: SCORE_RULES.version,
    lookbackMonths: options.lookbackMonths ?? null,
    period: options.period ?? null,
    eventsCount: events.length,
    events,
    periods,
    bySource,
  };
};

export const reconcileUserScore = async (userId, client = null) => {
  const db = client || pool;
  const userRes = await db.query('SELECT id, performance_score, performance_color FROM users WHERE id = $1', [userId]);
  if (!userRes.rowCount) throw new Error('User not found');
  const user = userRes.rows[0];

  const activeEvents = await buildScoreEvents(userId, { lookbackMonths: SCORE_RULES.lookbackMonths }, db);
  const rawLedgerScore = activeEvents.reduce((sum, e) => sum + e.points, 0);
  const ledgerScore = Math.min(Math.max(rawLedgerScore, 0), 100);

  let ledgerColor = 'GREY';
  if (ledgerScore >= 70) ledgerColor = 'GREEN';
  else if (ledgerScore >= 50) ledgerColor = 'YELLOW';
  else if (ledgerScore >= 30) ledgerColor = 'RED';

  const liveScore = user.performance_score ?? null;
  const isReconciled = liveScore === null ? ledgerScore === 0 : liveScore === ledgerScore;
  const drift = (liveScore ?? 0) - ledgerScore;
  const unreconciledLegacyScore = (activeEvents.length === 0 && liveScore !== null && liveScore > 0) ? liveScore : 0;

  return {
    userId,
    liveScore,
    liveColor: user.performance_color,
    ledgerScore,
    ledgerColor,
    reconciled: isReconciled,
    drift,
    unreconciledLegacyScore,
    activeEventsCount: activeEvents.length,
    ruleVersion: SCORE_RULES.version,
    lookbackMonths: SCORE_RULES.lookbackMonths,
  };
};

/* --- P22: FINALIZATION & ADJUSTMENTS --- */

// 1. Period Finalization (Ay Kapanışı / Dondurma)
export const finalizePeriod = async (periodKey, adminUserId, client = null) => {
  if (!isValidPeriodKey(periodKey)) {
    throw new Error('Geçersiz dönem anahtarı (YYYY-MM formatı bekleniyor)');
  }
  const db = client || pool;
  const settingKey = `period_finalized:${periodKey}`;

  // Idempotency: Check if period is already finalized
  const existing = await db.query('SELECT value FROM system_settings WHERE key = $1', [settingKey]);
  if (existing.rowCount && existing.rows[0].value) {
    const data = JSON.parse(existing.rows[0].value);
    return {
      isAlreadyFinalized: true,
      ...data,
    };
  }

  // Calculate scores for all members in this period
  const membersRes = await db.query(`
    SELECT u.id, u.name, u.profession, gm.group_id, g.name AS group_name
    FROM users u
    LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.status = 'ACTIVE'
    LEFT JOIN groups g ON gm.group_id = g.id
    WHERE u.account_status = 'ACTIVE'
    ORDER BY u.name ASC
  `);

  const finalizedMembers = [];
  let totalScoreSum = 0;
  const colorDist = { GREEN: 0, YELLOW: 0, RED: 0, GREY: 0 };

  for (const m of membersRes.rows) {
    const ledger = await getScoreLedger(m.id, { period: periodKey }, db);
    const score = ledger.totalScore;
    const color = ledger.color;

    colorDist[color] = (colorDist[color] || 0) + 1;
    totalScoreSum += score;

    finalizedMembers.push({
      userId: m.id,
      name: m.name,
      profession: m.profession,
      groupId: m.group_id || null,
      groupName: m.group_name || null,
      score,
      color,
      sources: ledger.bySource,
      eventsCount: ledger.eventsCount,
    });

    // Record finalized snapshot into user_score_history
    await db.query(`
      INSERT INTO user_score_history (user_id, score, color, created_at)
      VALUES ($1, $2, $3, NOW())
    `, [m.id, score, color]);
  }

  const memberCount = finalizedMembers.length;
  const averageScore = memberCount > 0 ? Number((totalScoreSum / memberCount).toFixed(1)) : 0;

  const finalizationData = {
    periodKey,
    finalizedAt: new Date().toISOString(),
    finalizedBy: adminUserId,
    ruleVersion: SCORE_RULES.version,
    memberCount,
    isFinalized: true,
    summary: {
      averageScore,
      colorDistribution: colorDist,
    },
    members: finalizedMembers,
  };

  // Store in system_settings
  await db.query(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
  `, [settingKey, JSON.stringify(finalizationData)]);

  return {
    isAlreadyFinalized: false,
    ...finalizationData,
  };
};

// 2. Apply Reasoned Score Adjustment (Gerekçeli Puan Düzeltme)
export const applyScoreAdjustment = async ({ userId, periodKey, points, reason, adminUserId }, client = null) => {
  if (!isValidPeriodKey(periodKey)) {
    throw new Error('Geçersiz dönem anahtarı (YYYY-MM formatı bekleniyor)');
  }
  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    throw new Error('Düzeltme gerekçesi en az 3 karakter olmalıdır');
  }
  const pts = parseInt(points, 10);
  if (!Number.isInteger(pts) || pts === 0) {
    throw new Error('Geçerli bir puan düzeltmesi girilmelidir (0 hariç)');
  }

  const db = client || pool;
  const userCheck = await db.query('SELECT id, name FROM users WHERE id = $1', [userId]);
  if (!userCheck.rowCount) throw new Error('Üye bulunamadı');

  const adjustments = await getStoredAdjustments(db);
  const adjId = randomUUID();
  const newAdjustment = {
    id: adjId,
    userId,
    periodKey,
    points: pts,
    reason: reason.trim(),
    appliedBy: adminUserId,
    appliedAt: new Date().toISOString(),
    idempotencyKey: `ADJUSTMENT:${adjId}`,
  };

  adjustments.push(newAdjustment);

  await db.query(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ('score_adjustments', $1, NOW())
    ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
  `, [JSON.stringify(adjustments)]);

  // Recalculate member's live score
  const updatedScore = await calculateMemberScore(userId, db);

  return {
    adjustment: newAdjustment,
    updatedScore,
  };
};

// 3. Monthly Scores Table / Leaderboard (Aylık Puan Tablosu)
export const getMonthlyScores = async ({ periodKey = null, groupId = null } = {}, client = null) => {
  const db = client || pool;
  const targetPeriod = periodKey || formatPeriodKey(new Date());

  if (!isValidPeriodKey(targetPeriod)) {
    throw new Error('Geçersiz dönem anahtarı (YYYY-MM formatı bekleniyor)');
  }

  const settingKey = `period_finalized:${targetPeriod}`;
  const finalCheck = await db.query('SELECT value FROM system_settings WHERE key = $1', [settingKey]);

  let members = [];
  let isFinalized = false;
  let finalizedAt = null;

  if (finalCheck.rowCount && finalCheck.rows[0].value) {
    const data = JSON.parse(finalCheck.rows[0].value);
    isFinalized = true;
    finalizedAt = data.finalizedAt;
    members = data.members;
    if (groupId) {
      members = members.filter(m => m.groupId === groupId);
    }
  } else {
    // Dynamic calculation for unfinalized period
    let sql = `
      SELECT u.id, u.name, u.profession, gm.group_id, g.name AS group_name
      FROM users u
      LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.status = 'ACTIVE'
      LEFT JOIN groups g ON gm.group_id = g.id
      WHERE u.account_status = 'ACTIVE'
    `;
    const params = [];
    if (groupId) {
      params.push(groupId);
      sql += ` AND gm.group_id = $${params.length}`;
    }
    sql += ' ORDER BY u.name ASC';

    const usersRes = await db.query(sql, params);
    for (const u of usersRes.rows) {
      const ledger = await getScoreLedger(u.id, { period: targetPeriod }, db);
      members.push({
        userId: u.id,
        name: u.name,
        profession: u.profession,
        groupId: u.group_id || null,
        groupName: u.group_name || null,
        period: targetPeriod,
        score: ledger.totalScore,
        color: ledger.color,
        ruleVersion: SCORE_RULES.version,
        sources: ledger.bySource,
        eventsCount: ledger.eventsCount,
        isFinalized: false,
      });
    }
  }

  // Sort by score DESC, then name ASC
  members.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const totalMembers = members.length;
  const totalScoreSum = members.reduce((sum, m) => sum + m.score, 0);
  const averageScore = totalMembers > 0 ? Number((totalScoreSum / totalMembers).toFixed(1)) : 0;
  const colorDistribution = { GREEN: 0, YELLOW: 0, RED: 0, GREY: 0 };
  for (const m of members) colorDistribution[m.color] = (colorDistribution[m.color] || 0) + 1;

  return {
    period: targetPeriod,
    isFinalized,
    finalizedAt,
    ruleVersion: SCORE_RULES.version,
    memberCount: totalMembers,
    summary: {
      averageScore,
      colorDistribution,
    },
    members,
  };
};

// 4. Member Scorecard (Üye Karnesi)
export const getMemberScorecard = async (userId, options = {}, client = null) => {
  const db = client || pool;
  const userRes = await db.query('SELECT id, name, profession, performance_score, performance_color, created_at FROM users WHERE id = $1', [userId]);
  if (!userRes.rowCount) throw new Error('Üye bulunamadı');
  const user = userRes.rows[0];

  const lookbackPeriods = options.lookbackPeriods || 6;
  const currentDate = new Date();
  const periodsData = [];

  for (let i = 0; i < lookbackPeriods; i++) {
    const d = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth() - i, 1));
    const pKey = formatPeriodKey(d);
    const ledger = await getScoreLedger(userId, { period: pKey }, db);

    // Check if period was finalized
    const finalRes = await db.query("SELECT value FROM system_settings WHERE key = $1", [`period_finalized:${pKey}`]);
    const isFinal = finalRes.rowCount > 0;

    periodsData.push({
      period: pKey,
      score: ledger.totalScore,
      color: ledger.color,
      eventsCount: ledger.eventsCount,
      sources: ledger.bySource,
      isFinalized: isFinal,
    });
  }

  const allActiveLedger = await getScoreLedger(userId, { lookbackMonths: SCORE_RULES.lookbackMonths }, db);

  return {
    userId: user.id,
    name: user.name,
    profession: user.profession,
    currentScore: user.performance_score,
    currentColor: user.performance_color,
    ruleVersion: SCORE_RULES.version,
    sourcesSummary: allActiveLedger.bySource,
    recentEvents: allActiveLedger.events.slice(0, 10),
    periodsTrend: periodsData,
  };
};

export const calculateChampions = async (periodType, startDate, endDate) => {
  const client = await pool.connect();
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Most Referrals
    const refRes = await client.query(`
      SELECT giver_id as user_id, COUNT(*) as value
      FROM referrals
      WHERE created_at BETWEEN $1 AND $2 AND status = 'SUCCESSFUL'
      GROUP BY giver_id
      ORDER BY value DESC
      LIMIT 1
    `, [startDate, endDate]);

    if (refRes.rows.length > 0) {
      await client.query(
        "INSERT INTO champions (period_type, period_date, metric_type, user_id, value) VALUES ($1, $2, 'REFERRAL_COUNT', $3, $4)",
        [periodType, today, refRes.rows[0].user_id, refRes.rows[0].value]
      );
    }

    // 2. Most Visitors
    const visRes = await client.query(`
      SELECT inviter_id as user_id, COUNT(*) as value
      FROM visitors
      WHERE visited_at BETWEEN $1 AND $2
      GROUP BY inviter_id
      ORDER BY value DESC
      LIMIT 1
    `, [startDate, endDate]);

    if (visRes.rows.length > 0) {
      await client.query(
        "INSERT INTO champions (period_type, period_date, metric_type, user_id, value) VALUES ($1, $2, 'VISITOR_COUNT', $3, $4)",
        [periodType, today, visRes.rows[0].user_id, visRes.rows[0].value]
      );
    }

    // 3. Highest Revenue
    const revRes = await client.query(`
      SELECT giver_id as user_id, SUM(amount) as value
      FROM referrals
      WHERE created_at BETWEEN $1 AND $2 AND status = 'SUCCESSFUL'
      GROUP BY giver_id
      ORDER BY value DESC
      LIMIT 1
    `, [startDate, endDate]);

    if (revRes.rows.length > 0) {
      await client.query(
        "INSERT INTO champions (period_type, period_date, metric_type, user_id, value) VALUES ($1, $2, 'REVENUE', $3, $4)",
        [periodType, today, revRes.rows[0].user_id, revRes.rows[0].value]
      );
    }

    console.log(`✅ Champions calculated for ${periodType}`);
  } catch (e) {
    console.error(`Error calculating champions for ${periodType}:`, e);
  } finally {
    client.release();
  }
};

// 4. Evaluate Low-Score Removals (Puan Düşüklüğü Çıkarma Önizleme/Değerlendirme)
export const evaluateLowScoreRemovals = async ({ periodKey, threshold = 50, groupId = null }, client = null) => {
  const db = client || pool;
  if (!isValidPeriodKey(periodKey)) {
    throw new Error('Geçersiz dönem anahtarı (YYYY-MM formatı bekleniyor)');
  }
  const thresh = parseInt(threshold, 10);
  if (!Number.isInteger(thresh) || thresh <= 0) {
    throw new Error('Geçerli bir puan eşiği girilmelidir');
  }

  // 1. Check if period is finalized
  const settingKey = `period_finalized:${periodKey}`;
  const finalCheck = await db.query('SELECT value FROM system_settings WHERE key = $1', [settingKey]);
  if (!finalCheck.rowCount || !finalCheck.rows[0].value) {
    const err = new Error('Yalnızca kesinleştirilmiş dönem puanları üzerinden çıkarma değerlendirmesi yapılabilir');
    err.code = 'PERIOD_NOT_FINALIZED';
    err.status = 400;
    throw err;
  }

  const finalData = JSON.parse(finalCheck.rows[0].value);
  const finalizedMembers = finalData.members || [];

  // Check past removals for this period
  const removalSettingKey = `low_score_removals:${periodKey}`;
  const remCheck = await db.query('SELECT value FROM system_settings WHERE key = $1', [removalSettingKey]);
  const pastRemovals = remCheck.rowCount && remCheck.rows[0].value ? JSON.parse(remCheck.rows[0].value) : { executions: [], removedUserIds: [] };
  const alreadyRemovedInPeriod = new Set(pastRemovals.removedUserIds || []);

  // Filter candidates: score < threshold and has groupId
  let candidates = finalizedMembers.filter(m => m.score < thresh && m.groupId);
  if (groupId) {
    candidates = candidates.filter(m => m.groupId === groupId);
  }

  // Check live membership status and president role
  const evaluatedCandidates = [];
  for (const c of candidates) {
    const memRes = await db.query(`
      SELECT gm.status, gm.role AS member_role, u.role AS user_role, to_jsonb(u)->>'group_title' AS group_title, g.name AS current_group_name
      FROM group_members gm
      JOIN users u ON u.id = gm.user_id
      JOIN groups g ON g.id = gm.group_id
      WHERE gm.group_id = $1 AND gm.user_id = $2
    `, [c.groupId, c.userId]);

    const isCurrentlyMember = memRes.rowCount > 0 && memRes.rows[0].status === 'ACTIVE';
    const isPresident = memRes.rowCount > 0 && (
      memRes.rows[0].member_role === 'PRESIDENT' ||
      memRes.rows[0].user_role === 'PRESIDENT' ||
      memRes.rows[0].group_title === 'PRESIDENT'
    );
    const alreadyProcessed = alreadyRemovedInPeriod.has(c.userId);

    let status = 'ELIGIBLE';
    if (alreadyProcessed) {
      status = 'ALREADY_REMOVED_FOR_PERIOD';
    } else if (!isCurrentlyMember) {
      status = 'ALREADY_INACTIVE';
    } else if (isPresident) {
      status = 'EXEMPT_PRESIDENT';
    }

    evaluatedCandidates.push({
      userId: c.userId,
      name: c.name,
      profession: c.profession,
      groupId: c.groupId,
      groupName: c.groupName || (memRes.rows[0]?.current_group_name ?? null),
      score: c.score,
      threshold: thresh,
      period: periodKey,
      status,
      eligibleForRemoval: status === 'ELIGIBLE',
      isPresident,
      alreadyRemoved: alreadyProcessed || !isCurrentlyMember,
    });
  }

  const eligibleCount = evaluatedCandidates.filter(c => c.eligibleForRemoval).length;
  const exemptCount = evaluatedCandidates.filter(c => c.status === 'EXEMPT_PRESIDENT').length;
  const alreadyInactiveCount = evaluatedCandidates.filter(c => c.status === 'ALREADY_INACTIVE' || c.status === 'ALREADY_REMOVED_FOR_PERIOD').length;

  return {
    periodKey,
    threshold: thresh,
    groupId: groupId || null,
    isFinalized: true,
    finalizedAt: finalData.finalizedAt,
    summary: {
      totalCandidates: evaluatedCandidates.length,
      eligibleCount,
      exemptCount,
      alreadyInactiveCount,
    },
    candidates: evaluatedCandidates,
  };
};

// 5. Apply Low-Score Removals (Puan Düşüklüğü Otomatik / İncelemeli Çıkarma Yürütme)
export const applyLowScoreRemovals = async ({
  periodKey,
  threshold = 50,
  groupId = null,
  exemptUserIds = [],
  reasonNote = '',
  adminUserId,
}, client = null) => {
  const db = client || pool;
  if (!isValidPeriodKey(periodKey)) {
    throw new Error('Geçersiz dönem anahtarı (YYYY-MM formatı bekleniyor)');
  }
  const thresh = parseInt(threshold, 10);
  if (!Number.isInteger(thresh) || thresh <= 0) {
    throw new Error('Geçerli bir puan eşiği girilmelidir');
  }

  // 1. Evaluate first
  const evaluation = await evaluateLowScoreRemovals({ periodKey, threshold: thresh, groupId }, db);
  const exemptSet = new Set((exemptUserIds || []).map(String));

  const removalSettingKey = `low_score_removals:${periodKey}`;
  const remCheck = await db.query('SELECT value FROM system_settings WHERE key = $1', [removalSettingKey]);
  const pastRecord = remCheck.rowCount && remCheck.rows[0].value ? JSON.parse(remCheck.rows[0].value) : { executions: [], removedUserIds: [] };
  const removedUserIdsSet = new Set(pastRecord.removedUserIds || []);

  const results = [];
  let removedCount = 0;
  let skippedCount = 0;

  const ownClient = !client;
  const conn = client || await pool.connect();

  try {
    if (ownClient) await conn.query('BEGIN');

    for (const cand of evaluation.candidates) {
      if (exemptSet.has(cand.userId)) {
        results.push({
          userId: cand.userId,
          name: cand.name,
          groupId: cand.groupId,
          score: cand.score,
          action: 'SKIPPED_EXEMPT',
          reason: 'Yönetici tarafından muaf tutuldu',
        });
        skippedCount++;
        continue;
      }

      if (!cand.eligibleForRemoval) {
        results.push({
          userId: cand.userId,
          name: cand.name,
          groupId: cand.groupId,
          score: cand.score,
          action: `SKIPPED_${cand.status}`,
          reason: cand.status === 'EXEMPT_PRESIDENT' ? 'Grup başkanı muafiyeti' : 'Üye zaten grupta aktif değil',
        });
        skippedCount++;
        continue;
      }

      // Execute removal
      // 1. Set operation context for trigger
      await setMembershipOperationContext(conn, adminUserId, 'MEMBER_REMOVAL');

      // 2. Delete member row from group_members
      const delRes = await conn.query(
        'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING user_id',
        [cand.groupId, cand.userId]
      );

      if (delRes.rowCount > 0) {
        // 3. User account status remains ACTIVE (R12 rule)
        await conn.query(
          "UPDATE users SET updated_at = NOW() WHERE id = $1 AND account_status = 'ACTIVE'",
          [cand.userId]
        );

        // 4. Create notification with payload
        const note = reasonNote && reasonNote.trim()
          ? reasonNote.trim()
          : `${periodKey} dönemi puan düşüklüğü (Puan: ${cand.score} < ${thresh})`;

        const payload = JSON.stringify({
          category: 'LOW_SCORE',
          categoryLabel: 'Puan Düşüklüğü',
          note,
          groupId: cand.groupId,
          groupName: cand.groupName,
          periodKey,
          score: cand.score,
          threshold: thresh,
        });

        const notifMsg = `${cand.groupName} grubundan çıkarıldınız. Neden: Puan Düşüklüğü. Açıklama: ${note} ::: ${payload}`;
        await conn.query(
          "INSERT INTO notifications(user_id,type,title,message,action_url) VALUES($1,'REMOVAL','Gruptan Çıkarılma',$2,'/membership-history')",
          [cand.userId, notifMsg]
        );

        removedUserIdsSet.add(cand.userId);
        removedCount++;

        results.push({
          userId: cand.userId,
          name: cand.name,
          groupId: cand.groupId,
          groupName: cand.groupName,
          score: cand.score,
          action: 'REMOVED',
          reasonCategory: 'LOW_SCORE',
          reasonNote: note,
        });
      } else {
        results.push({
          userId: cand.userId,
          name: cand.name,
          groupId: cand.groupId,
          score: cand.score,
          action: 'SKIPPED_NOT_FOUND',
          reason: 'Grup üyelik kaydı bulunamadı',
        });
        skippedCount++;
      }
    }

    // Save removal record in system_settings
    const executionRecord = {
      executedAt: new Date().toISOString(),
      executedBy: adminUserId,
      threshold: thresh,
      groupId: groupId || null,
      removedCount,
      skippedCount,
      results,
    };

    pastRecord.executions.push(executionRecord);
    pastRecord.removedUserIds = Array.from(removedUserIdsSet);

    await conn.query(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
    `, [removalSettingKey, JSON.stringify(pastRecord)]);

    if (ownClient) await conn.query('COMMIT');

    return {
      success: true,
      periodKey,
      threshold: thresh,
      totalEvaluated: evaluation.candidates.length,
      removedCount,
      skippedCount,
      results,
      executedAt: executionRecord.executedAt,
    };
  } catch (err) {
    if (ownClient) await conn.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    if (ownClient) conn.release();
  }
};

