import pool from '../config/db.js';

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

function formatPeriodKey(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

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

  const [attRes, refRes, visRes, otoRes, eduRes] = await Promise.all([
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

  // 5. Education Events (Ağırlık 0 ise 0 puanlı kayıtlar isteğe bağlı denetim için)
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
