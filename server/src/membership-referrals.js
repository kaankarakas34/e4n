import jwt from 'jsonwebtoken';
import { requireCurrentAdmin } from './group-capacity.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v.trim());

const referralError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

/**
 * Resolves a potential referrer from query/body params: ref, referralCode, referredBy, or token.
 * If none provided, returns null (registration without referral is completely valid).
 * If invalid / forged / not found, throws 400 INVALID_REFERRAL_CODE.
 */
export async function resolveReferrer(client, { ref, referralCode, referredBy, token }) {
  let candidate = (referredBy || ref || referralCode || '').trim();

  if (!candidate && token && typeof token === 'string') {
    try {
      const decoded = jwt.decode(token);
      if (decoded && typeof decoded === 'object') {
        if (decoded.inviter_id && isUuid(decoded.inviter_id)) {
          candidate = decoded.inviter_id;
        } else if (decoded.inviteEmail && typeof decoded.inviteEmail === 'string') {
          // Admin invitation token with inviteEmail is a general invite, not an individual referral sponsor
        }
      }
    } catch {
      // Ignore token decode error; token might not be jwt
    }
  }

  if (!candidate) return null;

  if (!isUuid(candidate)) {
    throw referralError('Geçersiz referans kodu veya kimliği.', 400);
  }

  const { rows } = await client.query(
    'SELECT id, name, email, company, account_status FROM users WHERE id = $1',
    [candidate]
  );

  if (!rows.length) {
    throw referralError('Referans veren üye bulunamadı veya hesap aktif değil.', 400);
  }

  return rows[0];
}

/**
 * Records membership referral in system_settings within a transaction.
 */
export async function recordMembershipReferral(client, {
  userId,
  userEmail,
  referrer,
  source = 'REGISTRATION',
  referralCode = null
}) {
  if (!referrer) return null;

  if (userId === referrer.id || (userEmail && userEmail.toLowerCase() === referrer.email.toLowerCase())) {
    throw referralError('Kullanıcı kendi kendine referans olamaz.', 400);
  }

  const key = `membership_referral:${userId}`;
  const existing = await client.query('SELECT value FROM system_settings WHERE key = $1 FOR UPDATE', [key]);

  if (existing.rows.length) {
    // Already recorded; idempotent replay
    try {
      return JSON.parse(existing.rows[0].value);
    } catch {
      return null;
    }
  }

  const payload = {
    userId,
    referrerId: referrer.id,
    referrerName: referrer.name,
    referrerEmail: referrer.email,
    referrerCompany: referrer.company || null,
    source,
    referralCode: referralCode || null,
    createdAt: new Date().toISOString(),
    history: []
  };

  await client.query(
    'INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO NOTHING',
    [key, JSON.stringify(payload)]
  );

  return payload;
}

/**
 * Retrieves membership referral info for a user.
 * Checks system_settings first, then falls back to verifiable legacy visitor conversion.
 */
export async function getMembershipReferral(client, userId) {
  if (!isUuid(userId)) return null;

  const key = `membership_referral:${userId}`;
  const { rows } = await client.query('SELECT value FROM system_settings WHERE key = $1', [key]);

  if (rows.length && rows[0].value) {
    try {
      return JSON.parse(rows[0].value);
    } catch {
      // Fallback
    }
  }

  // Check verifiable legacy visitor conversion: visitor with status 'JOINED' and matching email
  const legacy = await client.query(`
    SELECT v.inviter_id, u.name AS referrer_name, u.email AS referrer_email, u.company AS referrer_company, v.created_at
    FROM visitors v
    JOIN users u ON u.id = v.inviter_id
    JOIN users target ON lower(target.email) = lower(v.email)
    WHERE target.id = $1 AND v.status = 'JOINED'
    ORDER BY v.visited_at DESC
    LIMIT 1
  `, [userId]);

  if (legacy.rows.length) {
    const row = legacy.rows[0];
    return {
      userId,
      referrerId: row.inviter_id,
      referrerName: row.referrer_name,
      referrerEmail: row.referrer_email,
      referrerCompany: row.referrer_company || null,
      source: 'VISITOR_CONVERSION',
      referralCode: null,
      createdAt: row.created_at,
      history: []
    };
  }

  return null;
}

/**
 * Retrieves members referred by a given user.
 */
export async function getReferredMembers(client, referrerId) {
  if (!isUuid(referrerId)) return [];

  // 1. Members recorded via system_settings
  const settingsRows = (await client.query("SELECT value FROM system_settings WHERE key LIKE 'membership_referral:%'")).rows;
  const referredUserIds = new Set();
  const directMap = new Map();

  for (const r of settingsRows) {
    try {
      const data = JSON.parse(r.value);
      if (data && data.referrerId === referrerId && data.userId && data.userId !== referrerId) {
        referredUserIds.add(data.userId);
        directMap.set(data.userId, data);
      }
    } catch {}
  }

  // 2. Legacy visitor converted members
  const legacyRows = (await client.query(`
    SELECT target.id AS user_id, v.created_at
    FROM visitors v
    JOIN users target ON lower(target.email) = lower(v.email)
    WHERE v.inviter_id = $1 AND v.status = 'JOINED' AND target.id <> $1
  `, [referrerId])).rows;

  for (const leg of legacyRows) {
    if (!referredUserIds.has(leg.user_id)) {
      referredUserIds.add(leg.user_id);
      directMap.set(leg.user_id, {
        userId: leg.user_id,
        referrerId,
        source: 'VISITOR_CONVERSION',
        createdAt: leg.created_at
      });
    }
  }

  if (referredUserIds.size === 0) return [];

  const userIdsArray = Array.from(referredUserIds);
  const usersResult = await client.query(
    'SELECT id, name, email, role, account_status, company, city, profession, created_at FROM users WHERE id = ANY($1)',
    [userIdsArray]
  );

  return usersResult.rows.map(u => ({
    ...u,
    referral_source: directMap.get(u.id)?.source || 'REGISTRATION',
    referred_at: directMap.get(u.id)?.createdAt || u.created_at
  }));
}

/**
 * Admin adjustment of a user's membership referral with audit history snapshot.
 */
export async function setMembershipReferralByAdmin(client, { userId, newReferrerId, reason, adminId }) {
  if (!isUuid(userId)) throw referralError('Geçersiz üye kimliği.', 400);
  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    throw referralError('Gerekçe en az 3 karakter olmalı ve boş bırakılamaz.', 400);
  }

  if (newReferrerId !== null && !isUuid(newReferrerId)) {
    throw referralError('Geçersiz yeni referans veren kimliği.', 400);
  }

  if (newReferrerId && userId === newReferrerId) {
    throw referralError('Kullanıcı kendi kendine referans olamaz.', 400);
  }

  let newReferrer = null;
  if (newReferrerId) {
    const refRes = await client.query('SELECT id, name, email, company FROM users WHERE id = $1', [newReferrerId]);
    if (!refRes.rows.length) {
      throw referralError('Yeni referans veren üye bulunamadı.', 404);
    }
    newReferrer = refRes.rows[0];
  }

  const key = `membership_referral:${userId}`;
  const existing = await client.query('SELECT value FROM system_settings WHERE key = $1 FOR UPDATE', [key]);

  let currentRecord = null;
  if (existing.rows.length && existing.rows[0].value) {
    try {
      currentRecord = JSON.parse(existing.rows[0].value);
    } catch {}
  }

  if (!currentRecord) {
    // Check legacy
    currentRecord = await getMembershipReferral(client, userId);
  }

  const oldReferrerId = currentRecord ? currentRecord.referrerId : null;
  const oldReferrerName = currentRecord ? currentRecord.referrerName : null;
  const historyList = (currentRecord && Array.isArray(currentRecord.history)) ? [...currentRecord.history] : [];

  historyList.push({
    oldReferrerId,
    oldReferrerName,
    newReferrerId: newReferrer ? newReferrer.id : null,
    newReferrerName: newReferrer ? newReferrer.name : null,
    changedBy: adminId,
    reason: reason.trim(),
    changedAt: new Date().toISOString()
  });

  const updatedRecord = {
    userId,
    referrerId: newReferrer ? newReferrer.id : null,
    referrerName: newReferrer ? newReferrer.name : null,
    referrerEmail: newReferrer ? newReferrer.email : null,
    referrerCompany: newReferrer ? newReferrer.company : null,
    source: 'ADMIN_ADJUSTMENT',
    referralCode: currentRecord ? currentRecord.referralCode : null,
    createdAt: currentRecord ? currentRecord.createdAt : new Date().toISOString(),
    history: historyList
  };

  await client.query(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ($1, $2, now())
    ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()
  `, [key, JSON.stringify(updatedRecord)]);

  return updatedRecord;
}

/**
 * Express Route Installer for Membership Referrals
 */
export function installMembershipReferrals(app, { pool }) {
  // 1. Preview referral validity (public)
  app.get('/api/auth/referral-preview', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const { ref, referralCode, referredBy, token } = req.query;
    try {
      const referrer = await resolveReferrer(pool, { ref, referralCode, referredBy, token });
      if (!referrer) {
        return res.json({ valid: false, message: 'Referans belirtilmedi.' });
      }
      return res.json({
        valid: true,
        referrer: {
          id: referrer.id,
          name: referrer.name,
          company: referrer.company || null
        }
      });
    } catch (e) {
      return res.status(e.status || 400).json({ valid: false, error: e.message });
    }
  });

  // 2. Member's own referral status & referred members
  app.get('/api/user/membership-referral', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    }
    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'web_browser_fixture_only');
    } catch {
      return res.status(403).json({ error: 'Geçersiz oturum.' });
    }

    try {
      const referral = await getMembershipReferral(pool, payload.id);
      const referredMembers = await getReferredMembers(pool, payload.id);
      return res.json({
        referredBy: referral ? {
          id: referral.referrerId,
          name: referral.referrerName,
          company: referral.referrerCompany,
          source: referral.source,
          createdAt: referral.createdAt
        } : null,
        referredMembers
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

  // 3. Admin view of a member's referrals & audit history
  app.get('/api/admin/members/:id/referrals', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    }
    const token = authHeader.split(' ')[1];
    let client;
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'web_browser_fixture_only');
      client = await pool.connect();
      await requireCurrentAdmin(client, user.id);

      const userId = req.params.id;
      if (!isUuid(userId)) {
        return res.status(400).json({ error: 'Geçersiz üye kimliği.' });
      }

      const referral = await getMembershipReferral(client, userId);
      const referredMembers = await getReferredMembers(client, userId);

      return res.json({
        userId,
        referredBy: referral || null,
        history: referral?.history || [],
        referredMembers
      });
    } catch (e) {
      return res.status(e.status || 500).json({ error: e.message });
    } finally {
      client?.release();
    }
  });

  // 4. Admin set/adjust membership referrer
  app.post('/api/admin/members/:id/set-referrer', async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli.' });
    }
    const token = authHeader.split(' ')[1];
    let client;
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'web_browser_fixture_only');
      client = await pool.connect();
      await requireCurrentAdmin(client, user.id);

      const userId = req.params.id;
      const { referrerId, reason } = req.body || {};

      await client.query('BEGIN');
      const updated = await setMembershipReferralByAdmin(client, {
        userId,
        newReferrerId: referrerId || null,
        reason,
        adminId: user.id
      });
      await client.query('COMMIT');

      return res.json({ success: true, referral: updated });
    } catch (e) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return res.status(e.status || 500).json({ error: e.message });
    } finally {
      client?.release();
    }
  });
}
