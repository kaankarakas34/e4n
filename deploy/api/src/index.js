import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import crypto from 'crypto';
const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey123';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
});

// Test DB Connection
// Test DB Connection
pool.connect().then(async (client) => {
  console.log('✅ DB Connected Successfully to port', process.env.DB_PORT || 5435);

  // Auto-Migration for Subscription fields
  try {
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE'");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50)");
    await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reminder_trigger INTEGER");
    console.log('✅ Schema Migrations Applied');
  } catch (e) {
    console.error('Migration Warning:', e.message);
  } finally {
    client.release();
  }
}).catch(e => console.error('❌ DB Connection Error:', e));

app.use(cors());
app.use(express.json());

/* --- HELPER: SCORING ENGINE --- */
const calculateMemberScore = async (userId) => {
  // Scoring Weights
  const SCORES = {
    ATTENDANCE: 10,
    ABSENT: -10,
    LATE: 5,
    SUBSTITUTE: 10, // sending substitute counts as present generally or specific points
    REFERRAL_INTERNAL: 1,
    REFERRAL_EXTERNAL: 2,
    VISITOR: 5,
    ONE_TO_ONE: 1,
    EDUCATION_UNIT: 1 // per hour
  };

  const client = await pool.connect();
  try {
    // 1. Attendance Score - Last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [attRes, refRes, visRes, otoRes, eduRes] = await Promise.all([
      client.query(`
            SELECT status, count(*) as count 
            FROM attendance 
            WHERE user_id = $1 AND created_at > $2
            GROUP BY status
        `, [userId, sixMonthsAgo]),
      client.query(`
            SELECT type, count(*) as count 
            FROM referrals 
            WHERE giver_id = $1 AND created_at > $2
            GROUP BY type
        `, [userId, sixMonthsAgo]),
      client.query(`
            SELECT count(*) as count 
            FROM visitors 
            WHERE inviter_id = $1 AND visited_at > $2 AND status IN ('ATTENDED', 'JOINED')
        `, [userId, sixMonthsAgo]),
      client.query(`
            SELECT count(*) as count 
            FROM one_to_ones 
            WHERE requester_id = $1 AND meeting_date > $2
        `, [userId, sixMonthsAgo]),
      client.query(`
            SELECT sum(hours) as total_hours 
            FROM education 
            WHERE user_id = $1 AND completed_date > $2
        `, [userId, sixMonthsAgo])
    ]);

    let score = 0;

    // 1. Attendance Processing
    attRes.rows.forEach(r => {
      if (r.status === 'PRESENT') score += (r.count * SCORES.ATTENDANCE);
      else if (r.status === 'ABSENT') score += (r.count * SCORES.ABSENT);
      else if (r.status === 'LATE') score += (r.count * SCORES.LATE);
      else if (r.status === 'SUBSTITUTE') score += (r.count * SCORES.SUBSTITUTE);
    });

    // 2. Referrals Processing
    refRes.rows.forEach(r => {
      if (r.type === 'INTERNAL') score += (r.count * SCORES.REFERRAL_INTERNAL);
      else if (r.type === 'EXTERNAL') score += (r.count * SCORES.REFERRAL_EXTERNAL);
    });

    // 3. Visitors Processing
    score += (parseInt(visRes.rows[0].count) * SCORES.VISITOR);

    // 4. One-to-Ones Processing
    score += (parseInt(otoRes.rows[0].count) * SCORES.ONE_TO_ONE);

    // 5. Education Processing
    score += (Math.floor(parseFloat(eduRes.rows[0].total_hours || 0)) * SCORES.EDUCATION_UNIT);

    // Normalize Score (0-100)
    const finalScore = Math.min(Math.max(score, 0), 100);

    // Determine Color
    let color = 'GREY';
    if (finalScore >= 70) color = 'GREEN';
    else if (finalScore >= 50) color = 'YELLOW';
    else if (finalScore >= 30) color = 'RED';
    else color = 'GREY';

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

    return { score: finalScore, color };

  } catch (e) {
    console.error('Scoring error:', e);
  } finally {
    client.release();
  }
};

/* --- NEW ENDPOINTS: NOTIFICATIONS --- */
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- NEW ENDPOINTS: REPORTS --- */
app.get('/api/reports/traffic-lights', authenticateToken, async (req, res) => {
  // Return performance metrics for all members in user's chapter (or all if Admin)
  try {
    let query = `SELECT id, name, profession, performance_score as score, performance_color as color FROM users WHERE 1=1`;
    let params = [];

    // If not admin, restrict to own group members? 
    // Usually reports are visible to leadership or chapter members.
    // Let's restrict to 'active' users for now.
    // TODO: Filter by group if needed.
    query += ` ORDER BY performance_score DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/palms', authenticateToken, async (req, res) => {
  try {
    // Aggregate P A L M S counts per user
    const { rows } = await pool.query(`
            SELECT 
                u.id, u.name,
                COUNT(CASE WHEN a.status = 'PRESENT' THEN 1 END) as present,
                COUNT(CASE WHEN a.status = 'ABSENT' THEN 1 END) as absent,
                COUNT(CASE WHEN a.status = 'LATE' THEN 1 END) as late,
                COUNT(CASE WHEN a.status = 'MEDICAL' THEN 1 END) as medical,
                COUNT(CASE WHEN a.status = 'SUBSTITUTE' THEN 1 END) as substitute
            FROM users u
            LEFT JOIN attendance a ON u.id = a.user_id
            GROUP BY u.id, u.name
            ORDER BY u.name
        `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/stats', authenticateToken, async (req, res) => {
  try {
    // Mocking some aggregations for now using real table counts
    const memberCount = (await pool.query('SELECT count(*) FROM users')).rows[0].count;
    const groupCount = (await pool.query('SELECT count(*) FROM groups')).rows[0].count;
    const ptCount = (await pool.query('SELECT count(*) FROM power_teams')).rows[0].count;
    const eventCount = (await pool.query('SELECT count(*) FROM events')).rows[0].count;
    const visitorCount = (await pool.query('SELECT count(*) FROM visitors')).rows[0].count;
    const oneToOneCount = (await pool.query('SELECT count(*) FROM one_to_ones')).rows[0].count;

    // Revenue (TYFCB + Membership Fees mock)
    // Check if tyfcb_entries table exists and sum 'amount'
    let tyfcbTotal = 0;
    try {
      // We can check if table exists or just try catch
      const revRes = await pool.query('SELECT SUM(amount) as total FROM tyfcb_entries');
      tyfcbTotal = parseFloat(revRes.rows[0].total || 0);
    } catch { }

    res.json({
      totalRevenue: tyfcbTotal, // e.g. 5425000
      internalRevenue: tyfcbTotal * 0.7, // Mock breakdown
      externalRevenue: tyfcbTotal * 0.3,
      totalMembers: parseInt(memberCount),
      lostMembers: 0, // Need to track inactive
      totalGroups: parseInt(groupCount),
      totalPowerTeams: parseInt(ptCount),
      totalEvents: parseInt(eventCount),
      totalVisitors: parseInt(visitorCount),
      totalOneToOnes: parseInt(oneToOneCount),
      visitorConversionRate: 20 // Mock
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/charts', authenticateToken, async (req, res) => {
  // Mock chart data for now, ideally group by month from DB
  res.json({
    revenue: [
      { name: 'Oca', value: 4000 },
      { name: 'Şub', value: 3000 },
      { name: 'Mar', value: 2000 },
      { name: 'Nis', value: 2780 },
      { name: 'May', value: 1890 },
      { name: 'Haz', value: 2390 },
    ],
    growth: [
      { name: 'Oca', value: 10 },
      { name: 'Şub', value: 25 },
      { name: 'Mar', value: 35 },
      { name: 'Nis', value: 42 },
      { name: 'May', value: 48 },
      { name: 'Haz', value: 55 },
    ]
  });
});

// Middleware for Auth
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  console.log('Auth Token:', token); // DEBUG LOG

  // DEV: Allow mock tokens for demo purposes
  // DEV: Allow mock tokens for demo purposes
  // DEV: Allow mock tokens for demo purposes
  if (token === 'mock-user-token') {
    // Try to find member@demo.com FIRST (as requested by user), then user@demo.com
    pool.query("SELECT * FROM users WHERE email = 'member@demo.com'").then(res => {
      if (res.rows.length > 0) {
        req.user = res.rows[0];
        next();
      } else {
        // Fallback to user@demo.com
        pool.query("SELECT * FROM users WHERE email = 'user@demo.com'").then(res2 => {
          if (res2.rows.length > 0) {
            req.user = res2.rows[0];
          } else {
            req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'member@demo.com', role: 'MEMBER' };
          }
          next();
        }).catch(() => next());
      }
    }).catch(() => {
      req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'member@demo.com', role: 'MEMBER' };
      next();
    });
    return;
  }

  // Handling for President Demo Token
  if (token === 'mock-president-token') {
    pool.query("SELECT * FROM users WHERE email = 'grupbaskani@demo.com'").then(res => {
      if (res.rows.length > 0) req.user = res.rows[0];
      else req.user = { id: '00-president', email: 'grupbaskani@demo.com', role: 'PRESIDENT' };
      next();
    }).catch(() => next());
    return;
  }

  if (token === 'mock-admin-token') {
    req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'admin@demo.com', role: 'ADMIN' };
    return next();
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/* --- AUTH ENDPOINTS --- */

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, profession, city, phone, kvkkConsent, marketingConsent, explicitConsent } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, profession, city, phone, kvkk_consent, marketing_consent, explicit_consent, consent_date, account_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'PENDING') RETURNING id, email, name, role`,
      [email, hashedPassword, name, profession, city, phone, kvkkConsent || false, marketingConsent || false, explicitConsent || false]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    console.log('User found:', rows.length > 0 ? 'Yes' : 'No');
    if (rows.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

    // Check for active group
    const { rows: groups } = await pool.query(
      `SELECT group_id FROM group_members WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [user.id]
    );
    const chapterId = groups.length > 0 ? groups[0].group_id : null;

    // Check Subscription Status
    let accountStatus = user.account_status || 'ACTIVE';
    if (user.subscription_end_date && new Date(user.subscription_end_date) < new Date()) {
      accountStatus = 'PASSIVE';
      // Optionally update DB to reflect this if it wasn't already
      // await pool.query("UPDATE users SET account_status = 'PASSIVE' WHERE id = $1", [user.id]);
    }

    // Determine effective role or access based on status?
    // For now, allow login but send status to frontend.
    // user.account_status = accountStatus;

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, status: accountStatus }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, status: accountStatus }, chapterId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* --- CORE ENDPOINTS --- */

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    // Handle mock user
    if (req.user.id === '00000000-0000-0000-0000-000000000000') {
      return res.json({
        id: req.user.id,
        name: 'Demo User',
        email: req.user.email,
        role: req.user.role,
        profession: 'Demo Meslek',
        performance_score: 85,
        performance_color: 'GREEN'
      });
    }

    const { rows } = await pool.query('SELECT id, name, email, role, profession, performance_score, performance_color FROM users WHERE id = $1', [req.user.id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  // Validate UUID format
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(id)) {
    // Return dummy data for mock-user-id to satisfy frontend demo mode
    if (id === 'mock-user-id') {
      return res.json({
        id: '00000000-0000-0000-0000-000000000000',
        full_name: 'Demo User',
        profession: 'Demo',
        email: 'user@demo.com',
        performance_score: 85,
        performance_color: 'GREEN'
      });
    }
    return res.status(400).json({ error: 'Invalid User ID format' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name as full_name, u.profession, u.email, u.phone, u.city, u.performance_score, u.performance_color,
             g.name as company -- using group name as company placeholder or join real company table if exists
      FROM users u
      LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.status = 'ACTIVE'
      LEFT JOIN groups g ON gm.group_id = g.id
      WHERE u.id = $1
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* --- TRAFFIC LIGHT DATA ENDPOINTS --- */

// 1. One-to-Ones
app.get('/api/one-to-ones', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, 
              u.name as partner_name, 
              u2.name as requester_name,
              CASE 
                WHEN o.requester_id = $1 THEN 'OUTGOING'
                ELSE 'INCOMING'
              END as direction
       FROM one_to_ones o 
       LEFT JOIN users u ON o.partner_id = u.id 
       LEFT JOIN users u2 ON o.requester_id = u2.id
       WHERE o.requester_id = $1 OR o.partner_id = $1 
       ORDER BY o.meeting_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/one-to-ones', authenticateToken, async (req, res) => {
  const { partnerId, meetingDate, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO one_to_ones (requester_id, partner_id, meeting_date, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.user.id, partnerId, meetingDate, notes]
    );
    // Recalculate Score
    await calculateMemberScore(req.user.id);

    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/one-to-ones/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE one_to_ones 
       SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND (requester_id = $3 OR partner_id = $3)
       RETURNING *`,
      [status, id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });

    // Also update score if needed
    await calculateMemberScore(req.user.id);

    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Visitors
app.get('/api/visitors', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM visitors WHERE inviter_id = $1 ORDER BY visited_at DESC', [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/visitors', authenticateToken, async (req, res) => {
  const { name, profession, phone, email, visitedAt, status } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO visitors (inviter_id, name, profession, phone, email, visited_at, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, name, profession, phone, email, visitedAt, status || 'ATTENDED']
    );
    // Recalculate Score
    await calculateMemberScore(req.user.id);

    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Education / CEU
app.get('/api/education', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM education WHERE user_id = $1 ORDER BY completed_date DESC', [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/education', authenticateToken, async (req, res) => {
  const { title, hours, completedDate, type, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO education (user_id, title, hours, completed_date, type, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, title, hours, completedDate, type, notes]
    );
    // Recalculate Score
    await calculateMemberScore(req.user.id);

    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Calendar endpoint - returns all scheduled items (meetings, visitors, education)
app.get('/api/calendar', authenticateToken, async (req, res) => {
  try {
    let userId = req.query.userId || req.user.id;
    if (userId === 'mock-user-id') userId = req.user.id;

    console.log('GET /api/calendar for userId:', userId);

    // Validate UUID to prevent 500 error if mock ID is still passed and not resolved
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(userId)) {
      console.log('Invalid UUID for calendar:', userId);
      return res.json([]);
    }

    // Get one-to-ones (both requester and partner)
    const oneToOnes = await pool.query(
      `SELECT o.id, meeting_date as start_at, 'one_to_one' as type, 
              CONCAT('Birebir: ', CASE WHEN o.requester_id = $1 THEN u.name ELSE u2.name END) as title, 
              'Confirmed' as location
       FROM one_to_ones o
       LEFT JOIN users u ON o.partner_id = u.id
       LEFT JOIN users u2 ON o.requester_id = u2.id
       WHERE o.requester_id = $1 OR o.partner_id = $1`,
      [userId]
    );

    // Get visitors
    const visitors = await pool.query(
      `SELECT id, visited_at as start_at, 'visitor' as type,
              CONCAT('Ziyaretçi: ', name) as title, profession as location
       FROM visitors
       WHERE inviter_id = $1`,
      [userId]
    );

    // Get education
    const education = await pool.query(
      `SELECT id, completed_date as start_at, 'education' as type,
              title, type as location
       FROM education
       WHERE user_id = $1`,
      [userId]
    );

    // Combine all calendar items
    const calendar = [
      ...oneToOnes.rows,
      ...visitors.rows,
      ...education.rows
    ].sort((a, b) => new Date(b.start_at) - new Date(a.start_at));

    res.json(calendar);
  } catch (e) {
    console.error('Calendar error:', e);
    res.status(500).json({ error: e.message });
  }
});

// 4. Attendance
app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, e.title as event_title, e.start_at 
       FROM attendance a JOIN events e ON a.event_id = e.id 
       WHERE a.user_id = $1 ORDER BY e.start_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Event Registration with Equal Opportunity Check (FE Badge)
app.post('/api/events/:id/register', authenticateToken, async (req, res) => {
  const eventId = req.params.id;
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Get Event Details
      const eventRes = await client.query('SELECT * FROM events WHERE id = $1', [eventId]);
      if (eventRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Event not found' });
      }
      const event = eventRes.rows[0];

      // 2. Check if already registered
      const attCheck = await client.query('SELECT * FROM attendance WHERE event_id = $1 AND user_id = $2', [eventId, req.user.id]);
      if (attCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Already registered' });
      }

      // 3. Equal Opportunity Check
      if (event.has_equal_opportunity_badge) {
        // Get user's profession
        const userRes = await client.query('SELECT profession FROM users WHERE id = $1', [req.user.id]);
        const userProfession = userRes.rows[0].profession;

        if (userProfession) {
          // Check if any other attendee has the same profession
          const conflictCheck = await client.query(`
                    SELECT 1 
                    FROM attendance a
                    JOIN users u ON a.user_id = u.id
                    WHERE a.event_id = $1 AND u.profession = $2
                `, [eventId, userProfession]);

          if (conflictCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({
              error: 'Equal Opportunity Restriction: Another member with your profession is already registered for this event.',
              code: 'FE_RESTRICTION'
            });
          }
        }
      }

      // 4. Register (Insert Attendance)
      await client.query(`
            INSERT INTO attendance (event_id, user_id, status)
            VALUES ($1, $2, 'PRESENT') -- 'PRESENT' as placeholder for registered/will attend
        `, [eventId, req.user.id]);

      await client.query('COMMIT');

      // Recalculate Score
      calculateMemberScore(req.user.id).catch(console.error);

      res.json({ success: true, message: 'Successfully registered' });

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 5. Referrals (Updated)
app.get('/api/referrals', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, u.name as receiver_name, u.profession 
       FROM referrals r JOIN users u ON r.receiver_id = u.id 
       WHERE r.giver_id = $1 OR r.receiver_id = $1 
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/referrals', authenticateToken, async (req, res) => {
  const { receiverId, type, temperature, description, amount } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO referrals (giver_id, receiver_id, type, temperature, status, description, amount)
       VALUES ($1, $2, $3, $4, 'PENDING', $5, $6) RETURNING *`,
      [req.user.id, receiverId, type, temperature, description, amount]
    );
    // Recalculate Score
    await calculateMemberScore(req.user.id);

    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Health & General
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/api/users', async (req, res) => {
  const { name, profession, city } = req.query;
  try {
    let query = 'SELECT id, name, profession, city, email, phone FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (name) {
      query += ` AND name ILIKE $${paramCount}`;
      params.push(`%${name}%`);
      paramCount++;
    }
    if (profession) {
      query += ` AND profession ILIKE $${paramCount}`;
      params.push(`%${profession}%`);
      paramCount++;
    }
    if (city) {
      query += ` AND city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }

    query += ' ORDER BY name ASC LIMIT 50';
    const { rows } = await pool.query(query, params);

    // Add full_name alias for frontend compatibility if needed, though frontend uses 'name' mostly
    res.json(rows.map(r => ({ ...r, full_name: r.name })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// User Lookup
app.get('/api/users/by-email', async (req, res) => {
  const { email } = req.query;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/friends', authenticateToken, async (req, res) => {
  try {
    // Logic: Users who are in the same groups as the current user
    const { rows } = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.profession, u.city, u.email, u.phone, u.performance_score, u.performance_color
      FROM users u
      JOIN group_members gm_target ON u.id = gm_target.user_id
      JOIN group_members gm_me ON gm_target.group_id = gm_me.group_id
      WHERE gm_me.user_id = $1 AND u.id != $1 AND gm_target.status = 'ACTIVE' AND gm_me.status = 'ACTIVE'
      UNION
      SELECT DISTINCT u.id, u.name, u.profession, u.city, u.email, u.phone, u.performance_score, u.performance_color
      FROM users u
      JOIN power_team_members ptm_target ON u.id = ptm_target.user_id
      JOIN power_team_members ptm_me ON ptm_target.power_team_id = ptm_me.power_team_id
      WHERE ptm_me.user_id = $1 AND u.id != $1 AND ptm_target.status = 'ACTIVE' AND ptm_me.status = 'ACTIVE'
    `, [req.user.id]);

    res.json(rows.map(r => ({ ...r, full_name: r.name })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// User's Groups & Power Teams
app.get('/api/user/groups', async (req, res) => {
  const { userId } = req.query;
  try {
    // Handle mock IDs gracefully or valid UUIDs
    // If it looks like a mock ID (not standard UUID length/format), return empty or handle
    if (!userId || userId.length < 30) return res.json([]);

    const { rows } = await pool.query(`
        SELECT g.* 
        FROM groups g
        JOIN group_members gm ON g.id = gm.group_id
        WHERE gm.user_id = $1 AND gm.status = 'ACTIVE'
      `, [userId]);
    res.json(rows);
  } catch (e) {
    // If it's a UUID syntax error (e.g. mock ID passed), just return empty
    if (e.code === '22P02') return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/user/power-teams', async (req, res) => {
  const { userId } = req.query;
  try {
    if (!userId || userId.length < 30) return res.json([]);

    const { rows } = await pool.query(`
        SELECT pt.* 
        FROM power_teams pt
        JOIN power_team_members ptm ON pt.id = ptm.power_team_id
        WHERE ptm.user_id = $1 AND ptm.status = 'ACTIVE'
      `, [userId]);
    res.json(rows);
  } catch (e) {
    if (e.code === '22P02') return res.json([]);
    res.status(500).json({ error: e.message });
  }
});

// Groups & Members
app.get('/api/groups', async (req, res) => {
  try {
    // Optimized Group List: JOIN instead of dependent subquery
    const { rows } = await pool.query(`
        SELECT g.*, count(gm.id)::int as member_count 
        FROM groups g 
        LEFT JOIN group_members gm ON g.id = gm.group_id
        GROUP BY g.id
        ORDER BY g.name ASC
      `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


app.get('/api/groups/:id/members', async (req, res) => {
  try {
    // Return all users that are members of this group
    const { rows } = await pool.query(
      `SELECT u.id, u.name as full_name, u.profession, u.email, u.role, u.performance_score, u.performance_color, gm.status, gm.joined_at as created_at
       FROM group_members gm 
       JOIN users u ON gm.user_id = u.id 
       WHERE gm.group_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/groups/:id/referrals', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, g.name as from_member_name, r2.name as to_member_name
       FROM referrals r
       JOIN users g ON r.giver_id = g.id
       JOIN users r2 ON r.receiver_id = r2.id
       JOIN group_members gm ON g.id = gm.user_id
       WHERE gm.group_id = $1 AND gm.status = 'ACTIVE'
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/groups/:id/events', async (req, res) => {
  try {
    const { rows } = await pool.query(`
        SELECT e.*, 
            (SELECT count(*)::int FROM attendance a WHERE a.event_id = e.id AND a.status = 'PRESENT') as attendees_count,
            (SELECT count(*)::int FROM group_members gm WHERE gm.group_id = e.group_id AND gm.status = 'ACTIVE') as total_members
        FROM events e 
        WHERE e.group_id = $1 
        ORDER BY e.start_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Events: default to upcoming + recent past (2 weeks)
app.get('/api/events', async (req, res) => {
  try {
    let query = 'SELECT * FROM events WHERE 1=1';
    let params = [];

    // Optional query param ?all=true to fetch history
    if (req.query.all !== 'true') {
      // Default: Start date > 2 weeks ago
      query += ' AND start_at > NOW() - INTERVAL \'14 days\'';
    }

    query += ' ORDER BY start_at ASC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/members', async (req, res) => {
  try {
    const { rows } = await pool.query(`
            SELECT u.*, g.name as group_name
            FROM users u
            LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.status = 'ACTIVE'
            LEFT JOIN groups g ON gm.group_id = g.id
            ORDER BY u.created_at DESC
        `);
    res.json(rows.map(r => ({ ...r, full_name: r.name })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// Group Activities (One-to-Ones for Group Manager)
app.get('/api/groups/:id/activities', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, u1.name as requester_name, u2.name as partner_name, u1.profession as requester_profession
       FROM one_to_ones o
       JOIN users u1 ON o.requester_id = u1.id
       JOIN users u2 ON o.partner_id = u2.id
       JOIN group_members gm ON u1.id = gm.user_id
       WHERE gm.group_id = $1 AND gm.status = 'ACTIVE'
       ORDER BY o.meeting_date DESC LIMIT 20`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Power Teams
app.get('/api/power-teams', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM power_teams ORDER BY name ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/power-teams/:id/members', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name as full_name, u.profession, u.email, u.role, u.performance_score, u.performance_color, ptm.status, ptm.joined_at as created_at
         FROM power_team_members ptm 
         JOIN users u ON ptm.user_id = u.id 
         WHERE ptm.power_team_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/power-teams/:id/referrals', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, g.name as from_member_name, r2.name as to_member_name
       FROM referrals r
       JOIN users g ON r.giver_id = g.id
       JOIN users r2 ON r.receiver_id = r2.id
       JOIN power_team_members ptm ON g.id = ptm.user_id
       WHERE ptm.power_team_id = $1 AND ptm.status = 'ACTIVE'
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/power-teams/:id/synergy', async (req, res) => {
  try {
    const { rows } = await pool.query(`
        SELECT u1.name as from, u2.name as to, count(*) as count
        FROM referrals r
        JOIN users u1 ON r.giver_id = u1.id
        JOIN users u2 ON r.receiver_id = u2.id
        JOIN power_team_members ptm1 ON u1.id = ptm1.user_id
        JOIN power_team_members ptm2 ON u2.id = ptm2.user_id
        WHERE ptm1.power_team_id = $1 AND ptm2.power_team_id = $1
          AND r.created_at > (NOW() - INTERVAL '6 months')
        GROUP BY u1.name, u2.name
        ORDER BY count DESC
     `, [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/groups/:id/visitors', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, u.name as inviter_name 
       FROM visitors v 
       JOIN users u ON v.inviter_id = u.id 
       WHERE v.group_id = $1 
       ORDER BY v.visited_at DESC`,
      [req.params.id]
    );
    // If group_id not set on visitor, maybe check inviter's group? Default setup assumes group_id on visitor
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/events/:id/attendance', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.name as member_name 
       FROM attendance a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.event_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Join Group Request
app.post('/api/groups/:id/join', authenticateToken, async (req, res) => {
  try {
    // Enforce Payment Check
    const userCheck = await pool.query('SELECT account_status FROM users WHERE id = $1', [req.user.id]);
    const status = userCheck.rows[0]?.account_status || 'PENDING';

    if (status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Üyelik ödemesi tamamlanmadığı için gruplara katılım sağlayamazsınız. Lütfen ödeme yapınız.',
        code: 'PAYMENT_REQUIRED'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO group_members (group_id, user_id, status) VALUES ($1, $2, 'REQUESTED') 
       ON CONFLICT (group_id, user_id) DO UPDATE SET status = 'REQUESTED' 
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get User's Pending Group Requests
app.get('/api/user/group-requests', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.id FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1 AND gm.status = 'REQUESTED'
    `, [req.user.id]);
    res.json(rows.map(r => r.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Group Member Status (Approve/Reject)
app.put('/api/groups/:id/members/:userId', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE group_members SET status = $1 WHERE group_id = $2 AND user_id = $3 RETURNING *`,
      [status, req.params.id, req.params.userId]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Join Power Team Request
app.post('/api/power-teams/:id/join', authenticateToken, async (req, res) => {
  try {
    // Enforce Payment Check
    const userCheck = await pool.query('SELECT account_status FROM users WHERE id = $1', [req.user.id]);
    const status = userCheck.rows[0]?.account_status || 'PENDING';

    if (status !== 'ACTIVE') {
      return res.status(403).json({
        error: 'Üyelik ödemesi tamamlanmadığı için güç takımlarına katılım sağlayamazsınız. Lütfen ödeme yapınız.',
        code: 'PAYMENT_REQUIRED'
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO power_team_members (power_team_id, user_id, status) VALUES ($1, $2, 'REQUESTED') 
       ON CONFLICT (power_team_id, user_id) DO UPDATE SET status = 'REQUESTED' 
       RETURNING *`,
      [req.params.id, req.user.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get User's Pending Power Team Requests
app.get('/api/user/power-team-requests', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT pt.id FROM power_teams pt
      JOIN power_team_members ptm ON pt.id = ptm.power_team_id
      WHERE ptm.user_id = $1 AND ptm.status = 'REQUESTED'
    `, [req.user.id]);
    res.json(rows.map(r => r.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Power Team Member Status
app.put('/api/power-teams/:id/members/:userId', authenticateToken, async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE power_team_members SET status = $1 WHERE power_team_id = $2 AND user_id = $3 RETURNING *`,
      [status, req.params.id, req.params.userId]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Remove Group Member (Reject/Kick)
app.delete('/api/groups/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
      [req.params.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Remove Power Team Member (Reject/Kick)
app.delete('/api/power-teams/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM power_team_members WHERE power_team_id = $1 AND user_id = $2`,
      [req.params.id, req.params.userId]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get User's Groups
app.get('/api/user/groups', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1 AND gm.status = 'ACTIVE'
    `, [req.user.id]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- SHUFFLE & ROLE MANAGEMENT ---

// Save Shuffle Distribution
app.post('/api/shuffle/save', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);

  const { assignments } = req.body; // { groupId: [memberId1, memberId2...], ... }
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Reset LEADERSHIP roles (Keep ADMIN, MEMBER, etc. if needed, but per request reset leaders to MEMBER)
    // Roles to reset: PRESIDENT, VICE_PRESIDENT, SECRETARY_TREASURER, EDUCATION_COORDINATOR, VISITOR_HOST
    // IMPORTANT: Exclude ADMIN from reset
    await client.query(`
      UPDATE users 
      SET role = 'MEMBER' 
      WHERE role IN ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER', 'EDUCATION_COORDINATOR', 'VISITOR_HOST')
    `);

    // 2. Archive ALL existing active group memberships
    // We assume shuffle applies to everyone effectively, or we could only target users in the assignment list.
    // For a full shuffle, archiving all ACTIVE is safer to ensure no duplicates.
    await client.query(`
      UPDATE group_members 
      SET status = 'INACTIVE' 
      WHERE status = 'ACTIVE'
    `);

    // 3. Insert new group assignments
    const insertQuery = `
      INSERT INTO group_members (group_id, user_id, status, joined_at) 
      VALUES ($1, $2, 'ACTIVE', NOW())
    `;

    for (const [groupId, memberIds] of Object.entries(assignments)) {
      if (!Array.isArray(memberIds)) continue;
      for (const memberId of memberIds) {
        await client.query(insertQuery, [groupId, memberId]);
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Shuffle applied successfully.' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Shuffle save error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Move Member to Group
app.post('/api/admin/move-member', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { userId, groupId } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Deactivate current active group
    await client.query(`
      UPDATE group_members 
      SET status = 'INACTIVE' 
      WHERE user_id = $1 AND status = 'ACTIVE'
    `, [userId]);

    // Insert new active group
    await client.query(`
      INSERT INTO group_members (group_id, user_id, status)
      VALUES ($1, $2, 'ACTIVE')
    `, [groupId, userId]);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Helper: Send Notification (Mock + DB)
const sendNotification = async (userId, title, message) => {
  console.log(`[EMAIL-MOCK] To: ${userId} | Subject: ${title}`);
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, type, content, is_read) VALUES ($1, 'SYSTEM', $2, false)`,
      [userId, `${title}: ${message}`]
    );
  } catch (err) {
    console.error('Notification insert failed', err);
  }
};

// Daily Cron: Subscription Reminders (Every day at 09:00)
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily subscription check...');
  try {
    const { rows } = await pool.query(`
            SELECT id, name, email, subscription_end_date, last_reminder_trigger 
            FROM users 
            WHERE account_status = 'ACTIVE' AND subscription_end_date IS NOT NULL
        `);

    const now = new Date();
    const triggers = [30, 15, 10, 5, 3, 1];

    for (const user of rows) {
      const end = new Date(user.subscription_end_date);
      const diffTime = end - now;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) continue;

      if (triggers.includes(daysLeft) && user.last_reminder_trigger !== daysLeft) {
        await sendNotification(
          user.id,
          'Ödeme Hatırlatması',
          `Sayın ${user.name}, üyeliğinizin bitmesine ${daysLeft} gün kaldı. Lütfen ödemenizi yapınız.`
        );
        await pool.query('UPDATE users SET last_reminder_trigger = $1 WHERE id = $2', [daysLeft, user.id]);
      }
    }
  } catch (e) {
    console.error('Daily check error:', e);
  }
});

// Assign Role
app.post('/api/admin/assign-role', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { userId, role, groupTitle } = req.body;

  try {
    // If groupTitle is provided, update it too. If null explicitly passed, clear it? 
    // Usually undefined means don't touch, null means clear.
    // Let's assume passed groupTitle overwrites.
    const fields = ['role = $1'];
    const values = [role, userId];

    if (groupTitle !== undefined) {
      fields.push(`group_title = $${values.length + 1}`);
      values.splice(1, 0, groupTitle); // Insert before userId, so order matches fields
    }

    // Logic for dynamic query is tricky with splice.
    // Simpler: Just update both if groupTitle present
    if (groupTitle !== undefined) {
      await pool.query('UPDATE users SET role = $1, group_title = $2 WHERE id = $3', [role, groupTitle, userId]);
    } else {
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
    }

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* --- MEMBERSHIP / SUBSCRIPTION ENDPOINTS --- */

// Get Memberships
app.get('/api/memberships', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    const { rows } = await pool.query(`
      SELECT id, name, email, role, phone, profession, 
             subscription_end_date, subscription_plan, account_status as status
      FROM users 
      ORDER BY subscription_end_date ASC NULLS LAST
    `);

    // Auto-update status if expired (computed on read, or we could update DB)
    // For now, let's return what's in DB, but frontend can show "EXPIRED".
    // Or we can be proactive:
    const now = new Date();
    const validatedRows = rows.map(r => {
      let status = r.status;
      if (r.subscription_end_date && new Date(r.subscription_end_date) < now) {
        status = 'AD_EXPIRED'; // virtual status, or we can say 'PASSIVE'
      }
      return { ...r, status: status || 'ACTIVE', end_date: r.subscription_end_date, plan: r.subscription_plan };
    });

    res.json(validatedRows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Extend/Update Membership
app.post('/api/memberships/extend', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { userId, months, endDate, planName } = req.body;

  try {
    const { rows } = await pool.query('SELECT subscription_end_date FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    let newEnd;
    let newPlan = planName;

    if (endDate) {
      newEnd = new Date(endDate);
      if (!newPlan) newPlan = 'MANUAL';
    } else if (months && [4, 8, 12].includes(months)) {
      const currentEnd = rows[0].subscription_end_date ? new Date(rows[0].subscription_end_date) : new Date();
      const now = new Date();
      const effectiveStart = (currentEnd > now) ? currentEnd : now;
      newEnd = new Date(effectiveStart);
      newEnd.setMonth(newEnd.getMonth() + months);
      if (!newPlan) newPlan = `${months}_MONTHS`;
    } else {
      return res.status(400).json({ error: 'Invalid duration or missing endDate' });
    }

    await pool.query(`
      UPDATE users 
      SET subscription_end_date = $1, 
          subscription_plan = $2,
          account_status = 'ACTIVE',
          last_reminder_trigger = NULL
      WHERE id = $3
    `, [newEnd, newPlan, userId]);

    res.json({ success: true, new_end_date: newEnd, plan: newPlan });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* --- LMS Endpoints (Keep existing logic mostly) --- */
app.get('/api/lms/courses', async (req, res) => {
  try { const { rows } = await pool.query('SELECT * FROM courses WHERE status=$1', ['ACTIVE']); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }) }
});

/* --- ADMIN REPORTS ENDPOINTS --- */

// Dashboard Stats
app.get('/api/admin/stats/dashboard', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    const totalGroups = (await pool.query("SELECT COUNT(*) FROM groups WHERE status = 'ACTIVE'")).rows[0].count;
    const totalPowerTeams = (await pool.query("SELECT COUNT(*) FROM power_teams WHERE status = 'ACTIVE'")).rows[0].count;
    const totalMembers = (await pool.query("SELECT COUNT(*) FROM users WHERE role != 'ADMIN'")).rows[0].count;

    // Revenue
    const revenueRes = await pool.query("SELECT SUM(amount) as total, SUM(CASE WHEN type='INTERNAL' THEN amount ELSE 0 END) as internal, SUM(CASE WHEN type='EXTERNAL' THEN amount ELSE 0 END) as external FROM referrals WHERE status='SUCCESSFUL'");
    const totalRevenue = revenueRes.rows[0].total || 0;
    const internalRevenue = revenueRes.rows[0].internal || 0;
    const externalRevenue = revenueRes.rows[0].external || 0;

    // Activities
    const totalOneToOnes = (await pool.query("SELECT COUNT(*) FROM one_to_ones WHERE status = 'COMPLETED'")).rows[0].count;
    const totalVisitors = (await pool.query("SELECT COUNT(*) FROM visitors")).rows[0].count;
    const totalEvents = (await pool.query("SELECT COUNT(*) FROM events")).rows[0].count;

    // Visitor Conversion
    const convertedVisitors = (await pool.query("SELECT COUNT(*) FROM visitors WHERE status = 'JOINED'")).rows[0].count;
    const visitorConversionRate = parseInt(totalVisitors) > 0 ? (parseInt(convertedVisitors) / parseInt(totalVisitors)) * 100 : 0;

    // Lost Members (Churn in last 30 days - Simplified as just inactive for now or removed)
    // We don't have a status='LEFT' column yet explicitly, tracking via subscription or group_members status='INACTIVE'
    // Assuming 'INACTIVE' in group_members represents churn from a group
    const lostMembers = (await pool.query("SELECT COUNT(DISTINCT user_id) FROM group_members WHERE status = 'INACTIVE'")).rows[0].count;

    res.json({
      totalGroups: parseInt(totalGroups),
      totalPowerTeams: parseInt(totalPowerTeams),
      totalMembers: parseInt(totalMembers),
      totalRevenue: parseFloat(totalRevenue),
      internalRevenue: parseFloat(internalRevenue),
      externalRevenue: parseFloat(externalRevenue),
      totalOneToOnes: parseInt(totalOneToOnes),
      totalVisitors: parseInt(totalVisitors),
      visitorConversionRate: parseFloat(visitorConversionRate.toFixed(1)),
      totalEvents: parseInt(totalEvents),
      lostMembers: parseInt(lostMembers)
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Charts Data (Monthly Trends)
app.get('/api/admin/stats/charts', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    // Revenue Trend (Last 6 months)
    const revenueTrend = await pool.query(`
            SELECT TO_CHAR(updated_at, 'Mon') as name, SUM(amount) as value 
            FROM referrals 
            WHERE status='SUCCESSFUL' AND updated_at > NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(updated_at, 'Mon'), DATE_TRUNC('month', updated_at) 
            ORDER BY DATE_TRUNC('month', updated_at)
        `);

    // Member Growth (Approximation based on created_at)
    const memberGrowth = await pool.query(`
            SELECT TO_CHAR(created_at, 'Mon') as name, COUNT(*) as value
            FROM users
            WHERE role != 'ADMIN' AND created_at > NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at)
        `);

    // Visitor Trend
    const visitorTrend = await pool.query(`
            SELECT TO_CHAR(visited_at, 'Mon') as name, COUNT(*) as value
            FROM visitors
            WHERE visited_at > NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(visited_at, 'Mon'), DATE_TRUNC('month', visited_at)
            ORDER BY DATE_TRUNC('month', visited_at)
        `);

    res.json({
      revenue: revenueTrend.rows,
      growth: memberGrowth.rows,
      visitors: visitorTrend.rows
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Group Performance Stats
app.get('/api/admin/stats/groups', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    const query = `
            SELECT 
                g.id, g.name,
                COUNT(DISTINCT gm.user_id) as member_count,
                COALESCE(SUM(r.amount), 0) as revenue,
                COUNT(DISTINCT v.id) as visitor_count,
                COUNT(DISTINCT o.id) as one_to_one_count
            FROM groups g
            LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status='ACTIVE'
            LEFT JOIN referrals r ON r.giver_id = gm.user_id AND r.status='SUCCESSFUL'
            LEFT JOIN visitors v ON v.group_id = g.id
            LEFT JOIN users u ON u.id = gm.user_id
            LEFT JOIN one_to_ones o ON (o.requester_id = u.id OR o.partner_id = u.id)
            WHERE g.status = 'ACTIVE'
            GROUP BY g.id, g.name
            ORDER BY revenue DESC
        `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Substitutes Endpoint
app.get('/api/groups/:id/substitutes', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
            SELECT 
                a.id, 
                a.created_at, 
                a.substitute_name, 
                e.start_at as meeting_date,
                u.name as user_name
            FROM attendance a
            JOIN events e ON a.event_id = e.id
            JOIN users u ON a.user_id = u.id
            WHERE e.group_id = $1 AND a.status = 'SUBSTITUTE'
            ORDER BY e.start_at DESC
        `, [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// City / Geo Distribution
app.get('/api/admin/stats/geo', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    const { rows } = await pool.query(`
            SELECT city as name, COUNT(*) as value 
            FROM users 
            WHERE role != 'ADMIN' AND city IS NOT NULL 
            GROUP BY city 
            ORDER BY value DESC 
            LIMIT 10
        `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// --- SUBSCRIPTION & PAYMENT HELPERS ---

// Helper to calculate end date based on fixed 4-month periods
const calculateFixedTermEndDate = (startDate, monthsToAdd) => {
  const currentYear = startDate.getFullYear();
  // Fixed Periods:
  // P1: Jan(0) - Apr(3) -> Ends Apr 30
  // P2: May(4) - Aug(7) -> Ends Aug 31
  // P3: Sep(8) - Dec(11) -> Ends Dec 31

  // Find current period end
  let currentMonth = startDate.getMonth();
  let termEndYear = currentYear;
  let termEndMonth;

  if (currentMonth <= 3) { termEndMonth = 3; } // Ends April
  else if (currentMonth <= 7) { termEndMonth = 7; } // Ends August
  else { termEndMonth = 11; } // Ends December

  // Calculate how many terms correspond to the plan
  // 4 Months = 1 Term
  // 8 Months = 2 Terms
  // 12 Months = 3 Terms

  // Logic: Base End Date is the End of the Current Term.
  // Then add (termsToAdd - 1) * 4 months?
  // Let's iterate terms.

  let targetDate = new Date(termEndYear, termEndMonth + 1, 0); // Last day of term month

  // For additional terms (if plan > 4 months)
  // 8 Months means "Current Term + 1 more"
  // 12 Months means "Current Term + 2 more"
  const extraTerms = Math.max(0, (monthsToAdd / 4) - 1);

  if (extraTerms > 0) {
    // Add extra terms (4 months each)
    // Since we aligned to end of a month, adding months is safe usually for day 0? 
    // Better to add to the first day of next month then go to end?
    // Simple loop:
    for (let i = 0; i < extraTerms; i++) {
      // Move to next period
      // Current is Apr 30. Next period ends Aug 31.
      // Month 3 -> 7 -> 11 -> 3 (next year)
      if (termEndMonth === 3) { termEndMonth = 7; }
      else if (termEndMonth === 7) { termEndMonth = 11; }
      else {
        termEndMonth = 3;
        termEndYear++;
      }
    }
    targetDate = new Date(termEndYear, termEndMonth + 1, 0);
  }

  // Set time to end of day to be generous/safe
  targetDate.setHours(23, 59, 59, 999);
  return targetDate;
};


/* --- PAYMENT ENDPOINTS (PAYTR) --- */
app.post('/api/payment/get-token', authenticateToken, async (req, res) => {
  const merchant_id = process.env.PAYTR_MERCHANT_ID;
  const merchant_key = process.env.PAYTR_MERCHANT_KEY;
  const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

  // Ensure table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_transactions (
      merchant_oid VARCHAR(255) PRIMARY KEY,
      user_id UUID REFERENCES users(id),
      plan_id VARCHAR(50),
      amount DECIMAL(10,2),
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  if (!merchant_id) {
    console.warn('PAYTR credentials missing, using mock token for frontend demo');
    return res.json({ token: 'mock_token_' + Date.now() });
  }

  const { amount = 1000, currency = 'TL', installment = '0', user_address, user_phone, user_name, billing_info, plan } = req.body;

  // Create unique Order ID
  const merchant_oid = "PO" + Date.now() + Math.random().toString(36).substring(7);

  // SAVE TRANSACTION INTENT
  try {
    await pool.query(
      `INSERT INTO payment_transactions (merchant_oid, user_id, plan_id, amount, status) VALUES ($1, $2, $3, $4, 'PENDING')`,
      [merchant_oid, req.user.id, plan || '12_MONTHS', amount]
    );
  } catch (e) {
    console.error('Failed to save transaction', e);
    return res.status(500).json({ error: 'Database error initiating payment' });
  }

  // Create basket item name
  const basketItemName = billing_info ? `Üyelik - ${billing_info.type === 'CORPORATE' ? billing_info.companyName : 'Bireysel'}` : 'Yıllık Üyelik';

  const user_basket = Buffer.from(JSON.stringify([[basketItemName, amount.toString(), 1]])).toString('base64');
  const user_ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const payment_amount = amount * 100;
  const debug_on = 1;
  const test_mode = 1;
  const merchant_ok_url = 'http://localhost:5173/payment/success';
  const merchant_fail_url = 'http://localhost:5173/payment/fail';
  const timeout_limit = 30;

  const hashSTR = `${merchant_id}${user_ip}${merchant_oid}${req.user.email}${payment_amount}${user_basket}${installment}${installment}${currency}${test_mode}`;
  const paytr_token = hashSTR + merchant_salt;
  const token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

  const formData = new URLSearchParams();
  formData.append('merchant_id', merchant_id);
  formData.append('merchant_key', merchant_key);
  formData.append('merchant_salt', merchant_salt);
  formData.append('email', req.user.email);
  formData.append('payment_amount', payment_amount);
  formData.append('merchant_oid', merchant_oid);
  formData.append('user_name', user_name || req.user.name || 'Member');
  formData.append('user_address', user_address || 'Istanbul, Turkey');
  formData.append('user_phone', user_phone || '05555555555');
  formData.append('merchant_ok_url', merchant_ok_url);
  formData.append('merchant_fail_url', merchant_fail_url);
  formData.append('user_basket', user_basket);
  formData.append('user_ip', user_ip);
  formData.append('timeout_limit', timeout_limit);
  formData.append('debug_on', debug_on);
  formData.append('test_mode', test_mode);
  formData.append('lang', 'tr');
  formData.append('no_installment', installment);
  formData.append('max_installment', '0');
  formData.append('currency', currency);
  formData.append('paytr_token', token);

  try {
    const response = await fetch('https://www.paytr.com/odeme/api/get-token', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();

    if (data.status === 'success') {
      res.json({ token: data.token });
    } else {
      console.error('PayTR Error:', data);
      res.status(400).json({ error: data.reason });
    }
  } catch (e) {
    console.error('PayTR Request Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/payment/callback', async (req, res) => {
  const callback = req.body;
  const merchant_salt = process.env.PAYTR_MERCHANT_SALT;
  const merchant_key = process.env.PAYTR_MERCHANT_KEY;

  if (!merchant_salt || !merchant_key) return res.status(500).send('Config Error');

  const paytr_token = callback.merchant_oid + merchant_salt + callback.status + callback.total_amount;
  const token = crypto.createHmac('sha256', merchant_key).update(paytr_token).digest('base64');

  if (token != callback.hash) {
    return res.status(400).send('PAYTR notification failed: bad hash');
  }

  if (callback.status == 'success') {
    console.log('Payment Successful for OID:', callback.merchant_oid);

    // 1. Get Transaction Details
    const transRes = await pool.query('SELECT * FROM payment_transactions WHERE merchant_oid = $1', [callback.merchant_oid]);

    if (transRes.rows.length === 0) {
      console.error('Transaction not found for OID:', callback.merchant_oid);
      return res.send('OK');
    }

    const transaction = transRes.rows[0];
    const userId = transaction.user_id;
    const planId = transaction.plan_id; // '4_MONTHS', '8_MONTHS', '12_MONTHS'

    // 2. Calculate New End Date
    let months = 12;
    if (planId === '4_MONTHS') months = 4;
    if (planId === '8_MONTHS') months = 8;

    // IMPORTANT: Fixed Term Logic
    // If user pays today (e.g. March 15), and current term is Jan-Apr. 
    // They effectively pay for Jan-Apr. So end date is Apr 30.
    const newEndDate = calculateFixedTermEndDate(new Date(), months); // Use NOW as the reference payment date

    // 3. Update User
    await pool.query(`
        UPDATE users 
        SET subscription_end_date = $1, 
            subscription_plan = $2,
            account_status = 'ACTIVE',
            last_reminder_trigger = NULL
        WHERE id = $3
    `, [newEndDate, planId, userId]);

    // 4. Update Transaction Status
    await pool.query('UPDATE payment_transactions SET status = $1 WHERE merchant_oid = $2', ['SUCCESS', callback.merchant_oid]);

    console.log(`Updated user ${userId} subscription to ${newEndDate}`);

  } else {
    console.log('Payment Failed for OID:', callback.merchant_oid);
    await pool.query('UPDATE payment_transactions SET status = $1 WHERE merchant_oid = $2', ['FAILED', callback.merchant_oid]);
  }

  res.send('OK');
});

// --- SUPPORT TICKET SYSTEM ---

// Update Schema for Tickets
pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, ANSWERED, CLOSED
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID REFERENCES tickets(id),
        sender_id UUID REFERENCES users(id),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
    );
`).catch(err => console.error('Ticket tables creation error:', err));


// Get Tickets
// User: Gets only their tickets
// Admin: Gets ALL tickets
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    let query = `
        SELECT t.*, u.name as user_name, u.email as user_email,
               (SELECT message FROM ticket_messages WHERE ticket_id = t.id ORDER BY created_at DESC LIMIT 1) as last_message
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (req.user.role !== 'ADMIN') {
      query += ` AND t.user_id = $1`;
      params.push(req.user.id);
    }

    query += ` ORDER BY t.updated_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create Ticket
app.post('/api/tickets', authenticateToken, async (req, res) => {
  const { subject, message } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create Ticket
    const ticketRes = await client.query(
      `INSERT INTO tickets (user_id, subject, status) VALUES ($1, $2, 'OPEN') RETURNING *`,
      [req.user.id, subject]
    );
    const ticketId = ticketRes.rows[0].id;

    // Create First Message
    await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)`,
      [ticketId, req.user.id, message]
    );

    await client.query('COMMIT');
    res.status(201).json(ticketRes.rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Get Ticket Details & Messages
app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify access
    const ticketProp = await pool.query('SELECT user_id FROM tickets WHERE id = $1', [id]);
    if (ticketProp.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role !== 'ADMIN' && ticketProp.rows[0].user_id !== req.user.id) {
      return res.sendStatus(403);
    }

    const ticket = await pool.query(`
            SELECT t.*, u.name as user_name 
            FROM tickets t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.id = $1`,
      [id]
    );

    const messages = await pool.query(`
            SELECT tm.*, u.name as sender_name, u.role as sender_role
            FROM ticket_messages tm
            JOIN users u ON tm.sender_id = u.id
            WHERE tm.ticket_id = $1
            ORDER BY tm.created_at ASC`,
      [id]
    );

    res.json({ ticket: ticket.rows[0], messages: messages.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reply to Ticket
app.post('/api/tickets/:id/messages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  try {
    // Verify access
    const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    if (req.user.role !== 'ADMIN' && ticketRes.rows[0].user_id !== req.user.id) {
      return res.sendStatus(403);
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)`,
        [id, req.user.id, message]
      );

      // Update status (If Admin replies -> ANSWERED, If User replies -> OPEN)
      const newStatus = req.user.role === 'ADMIN' ? 'ANSWERED' : 'OPEN';
      await client.query(
        `UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2`,
        [newStatus, id]
      );

      await client.query('COMMIT');
      res.status(201).json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Status (Close/Reopen)
app.put('/api/tickets/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { status } = req.body;
  try {
    await pool.query('UPDATE tickets SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
