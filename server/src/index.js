// CRITICAL DEBUGGING: Catch process crashes
process.on('uncaughtException', (err) => {
  console.error('CRITICAL PROCESS CRASH:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import multer from 'multer';
import { runMigrations } from './config/migrate.js';
import adminRoutes from './routes/admin.js';
// import paymentRoutes from './routes/payment.js';
const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.JWT_SECRET || '310acce7e62c4e9f16ce17a04d6cbdaf5a859926f896a8e85e1dcfa095378333b';

// Static uploads path serving & multer setup (Uses OS tmp directory on Vercel)
const uploadDir = process.env.VERCEL 
  ? path.join(os.tmpdir(), 'uploads') 
  : path.resolve('uploads');

try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.error('Failed to create upload directory:', err);
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Connection Configuration for Database (Local Docker or Supabase)
import pool from './config/db.js';

// Debug Logging for Connection (Safe)
try {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (connectionString) {
    // Basic parse to log HOST and PORT only
    const match = connectionString.match(/@([^:]+):(\d+)\//);
    if (match) {
      console.log(`🔌 Attempting DB Connection to HOST: ${match[1]}, PORT: ${match[2]}`);
    } else {
      console.log('🔌 DATABASE_URL format not recognized (standard logging).');
    }
  } else {
    console.error('❌ DATABASE_URL environment variable is MISSING!');
  }
} catch (e) { console.error('Error logging config:', e); }

// --- SIMPLE HEALTH CHECK ---
app.get('/api/health-check', async (req, res) => {
  const result = {
    status: 'checking',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? 'true' : 'false',
    }
  };

  try {
    const client = await pool.connect();
    try {
      const resQuery = await client.query('SELECT NOW() as time');
      result.status = 'ok';
      result.dbAttempt = 'success';
      result.time = resQuery.rows[0].time;
    } finally {
      client.release();
    }
  } catch (e) {
    result.status = 'error';
    result.dbAttempt = 'failed';
    result.error = e.message;
  }

  res.status(200).json(result);
});

// Helper to get active transporter dynamically
// Helper to get active transporter dynamically
const sendEmail = async (to, subject, html, attachments = []) => {
  let transporter;
  let sender;

  try {
    const { rows } = await pool.query("SELECT * FROM email_configurations WHERE is_active = TRUE LIMIT 1");

    if (rows.length > 0) {
      const config = rows[0];
      console.log(`[Email] Using DB Config: Host=${config.smtp_host} Port=${config.smtp_port} User=${config.smtp_user}`);
      transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port,
        secure: config.smtp_port === 465,
        auth: {
          user: config.smtp_user,
          pass: config.smtp_pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      sender = `"${config.sender_name || 'Event4Network'}" <${config.sender_email}>`;
    } else {
      // Fallback to Env Vars
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      sender = `"Event4Network System" <${process.env.SMTP_USER || 'no-reply@event4network.com'}>`;
    }

    await transporter.sendMail({
      from: sender,
      to,
      subject,
      html,
      attachments
    });
    console.log(`📧 Email sent to ${to}`);
    return { success: true };
  } catch (e) {
    console.error('Email Send Error:', e);
    return { success: false, error: e.message || e };
  }
};

// Database routing and middleware setup

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/admin', adminRoutes);
// app.use('/api/payment', paymentRoutes);

// --- CHAMPION CALCULATION LOGIC ---
const calculateChampions = async (periodType, startDate, endDate) => {
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

// --- CRON JOBS ---
// Auto-complete past events every 10 minutes
cron.schedule('*/10 * * * *', async () => {
  console.log('Running cron to auto-complete past events...');
  try {
    const res = await pool.query(`
      UPDATE events 
      SET status = 'COMPLETED' 
      WHERE status = 'PUBLISHED' 
        AND COALESCE(end_at, start_at) < NOW()
    `);
    if (res.rowCount > 0) {
      console.log(`Auto-completed ${res.rowCount} past events via cron.`);
    }
  } catch (e) {
    console.error('Error in auto-complete past events cron job:', e);
  }
});

// Helper for event email reminders
const runEventReminders = async () => {
  console.log('Running event email reminders check...');
  
  // 3_days reminder
  const res3 = await pool.query(`
    SELECT a.user_id, a.event_id, u.email, u.name as user_name, e.title as event_title, e.start_at, e.online_link, e.location, e.is_online
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN events e ON a.event_id = e.id
    LEFT JOIN event_reminders_sent r ON r.event_id = e.id AND r.user_id = u.id AND r.reminder_type = '3_days'
    WHERE e.status = 'PUBLISHED'
      AND e.start_at BETWEEN NOW() + INTERVAL '2 days' AND NOW() + INTERVAL '3 days'
      AND r.id IS NULL
  `);
  
  // 1_day reminder
  const res1 = await pool.query(`
    SELECT a.user_id, a.event_id, u.email, u.name as user_name, e.title as event_title, e.start_at, e.online_link, e.location, e.is_online
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN events e ON a.event_id = e.id
    LEFT JOIN event_reminders_sent r ON r.event_id = e.id AND r.user_id = u.id AND r.reminder_type = '1_day'
    WHERE e.status = 'PUBLISHED'
      AND e.start_at BETWEEN NOW() + INTERVAL '12 hours' AND NOW() + INTERVAL '28 hours'
      AND r.id IS NULL
  `);

  // today reminder
  const resToday = await pool.query(`
    SELECT a.user_id, a.event_id, u.email, u.name as user_name, e.title as event_title, e.start_at, e.online_link, e.location, e.is_online
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN events e ON a.event_id = e.id
    LEFT JOIN event_reminders_sent r ON r.event_id = e.id AND r.user_id = u.id AND r.reminder_type = 'today'
    WHERE e.status = 'PUBLISHED'
      AND e.start_at BETWEEN NOW() + INTERVAL '2 hours' AND NOW() + INTERVAL '12 hours'
      AND DATE(e.start_at) = DATE(NOW())
      AND r.id IS NULL
  `);

  // 1_hour reminder
  const res1h = await pool.query(`
    SELECT a.user_id, a.event_id, u.email, u.name as user_name, e.title as event_title, e.start_at, e.online_link, e.location, e.is_online
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN events e ON a.event_id = e.id
    LEFT JOIN event_reminders_sent r ON r.event_id = e.id AND r.user_id = u.id AND r.reminder_type = '1_hour'
    WHERE e.status = 'PUBLISHED'
      AND e.start_at BETWEEN NOW() AND NOW() + INTERVAL '70 minutes'
      AND r.id IS NULL
  `);

  const sendReminder = async (row, type, typeLabel) => {
    try {
      const formattedDate = new Date(row.start_at).toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = new Date(row.start_at).toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      let locationHtml = `<strong>Konum:</strong> ${row.location || ''}`;
      if (row.is_online) {
        locationHtml = `<strong>Konum:</strong> Online Toplantı<br/><strong>Toplantı Bağlantısı:</strong> <a href="${row.online_link || ''}" style="color: #ef4444; font-weight: bold;">${row.online_link || 'Toplantı linki katılım mailinde iletilecektir.'}</a>`;
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #ef4444; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Etkinlik Hatırlatması (${typeLabel})</h2>
          <p>Merhaba <strong>${row.user_name}</strong>,</p>
          <p>Katılacağınız <strong>"${row.event_title}"</strong> etkinliğine kısa bir süre kaldı! Etkinlik bilgileri aşağıda yer almaktadır:</p>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 5px 0;">📅 <strong>Tarih:</strong> ${formattedDate}</p>
            <p style="margin: 5px 0;">🕒 <strong>Saat:</strong> ${formattedTime}</p>
            <p style="margin: 5px 0;">📍 ${locationHtml}</p>
          </div>
          
          <p>Etkinlik saatinde katılımınızı rica eder, iyi çalışmalar dileriz.</p>
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">Event4Network tarafından otomatik olarak gönderilmiştir.</p>
        </div>
      `;

      await sendEmail(row.email, `Hatırlatma: ${row.event_title} (${typeLabel})`, htmlContent);
      
      await pool.query(`
        INSERT INTO event_reminders_sent (event_id, user_id, reminder_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (event_id, user_id, reminder_type) DO NOTHING
      `, [row.event_id, row.user_id, type]);

    } catch (err) {
      console.error(`Error sending email to ${row.email} for event ${row.event_id}:`, err);
    }
  };

  let count = 0;
  // Send 3_days reminders
  for (const row of res3.rows) {
    await sendReminder(row, '3_days', '3 Gün Kaldı');
    count++;
  }
  // Send 1_day reminders
  for (const row of res1.rows) {
    await sendReminder(row, '1_day', '1 Gün Kaldı');
    count++;
  }
  // Send today reminders
  for (const row of resToday.rows) {
    await sendReminder(row, 'today', 'Bugün');
    count++;
  }
  // Send 1_hour reminders
  for (const row of res1h.rows) {
    await sendReminder(row, '1_hour', '1 Saat Kaldı');
    count++;
  }

  return { processed_count: count };
};

// Expose GET /api/cron/reminders for Vercel Cron
app.get('/api/cron/reminders', async (req, res) => {
  const isVercelCron = req.headers['x-vercel-cron'] === '1';
  const isCronAuth = req.headers['authorization'] === `Bearer ${process.env.CRON_SECRET}`;

  if (!isVercelCron && !isCronAuth && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized cron trigger' });
  }

  try {
    const result = await runEventReminders();
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error running event reminders cron:', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Run local node-cron only if not running on Vercel
if (!process.env.VERCEL) {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Running local cron for event email reminders...');
    try {
      await runEventReminders();
    } catch (e) {
      console.error('Error in local event email reminders cron job:', e);
    }
  });
}

// Weekly: Sunday 23:59
cron.schedule('59 23 * * 0', async () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  await calculateChampions('WEEK', start.toISOString(), end.toISOString());
});

// Monthly: Last day of month 23:59
cron.schedule('59 23 28-31 * *', async () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Determine if tomorrow is 1st of next month
  if (tomorrow.getDate() === 1) {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    await calculateChampions('MONTH', start.toISOString(), today.toISOString());
  }
});

// Term: End of April, August, December
cron.schedule('59 23 30 4,8 *', async () => { // Apr 30, Aug 30 (Use 30 for safety)
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);
  await calculateChampions('TERM', start.toISOString(), today.toISOString());
});
cron.schedule('59 23 31 8,12 *', async () => {
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 3);
  start.setDate(1);
  await calculateChampions('TERM', start.toISOString(), today.toISOString());
});
// Yearly: Dec 31
cron.schedule('59 23 31 12 *', async () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1);
  await calculateChampions('YEAR', start.toISOString(), today.toISOString());
});


/* --- HELPER: SCORING ENGINE --- */
const calculateMemberScore = async (userId) => {
  // Scoring Weights
  const SCORES = {
    ATTENDANCE: 10,
    ABSENT: -10,
    LATE: 5,
    SUBSTITUTE: 10,
    REFERRAL_INTERNAL: 10,
    REFERRAL_EXTERNAL: 5,
    VISITOR: 10,
    ONE_TO_ONE: 10,
    EDUCATION_UNIT: 0,
    SUCCESSFUL_BUSINESS: 5 // Ciro girişi
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
            SELECT type, status, count(*) as count 
            FROM referrals 
            WHERE giver_id = $1 AND created_at > $2
            GROUP BY type, status
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
      // Base points for referral type
      if (r.type === 'INTERNAL') score += (r.count * SCORES.REFERRAL_INTERNAL);
      else if (r.type === 'EXTERNAL') score += (r.count * SCORES.REFERRAL_EXTERNAL);

      // Extra points for Successful Business (Ciro)
      if (r.status === 'SUCCESSFUL') {
        score += (r.count * SCORES.SUCCESSFUL_BUSINESS);
      }
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

app.get('/api/reports/attendance-stats', authenticateToken, async (req, res) => {
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

    // Revenue (Realized Revenue + Membership Fees mock)
    // Check if revenue_entries table exists and sum 'amount'
    let totalRevenue = 0;
    try {
      // We can check if table exists or just try catch
      const revRes = await pool.query('SELECT SUM(amount) as total FROM revenue_entries'); // Updated table name assumption or keep consistent if table exists
      totalRevenue = parseFloat(revRes.rows[0].total || 0);
    } catch { }

    res.json({
      totalRevenue: totalRevenue, // e.g. 5425000
      internalRevenue: totalRevenue * 0.7, // Mock breakdown
      externalRevenue: totalRevenue * 0.3,
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

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/* --- AUTH ENDPOINTS --- */

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, city, profession, kvkkConsent, marketingConsent, explicitConsent, token } = req.body;

    // Validate invite token if public registration is closed
    if (!token) {
      return res.status(403).json({ error: 'Üyelik sadece davetiye ile mümkündür.' });
    }

    try {
      jwt.verify(token, SECRET_KEY);
    } catch (e) {
      return res.status(403).json({ error: 'Geçersiz veya süresi dolmuş davetiye.' });
    }

    // Check existing
    const existing = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Bu e-posta adresi zaten kayıtlı.' });

    // Handle Profession
    if (profession) {
      const profRes = await pool.query('SELECT id FROM professions WHERE LOWER(name) = LOWER($1)', [profession]);
      if (profRes.rows.length === 0) {
        await pool.query(
          "INSERT INTO professions (name, category, status) VALUES ($1, 'Genel', 'PENDING') ON CONFLICT DO NOTHING",
          [profession]
        );
      }
    }

    // Hash Password
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, name, profession, phone, company, kvkk_consent, marketing_consent, explicit_consent, consent_date, account_status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), 'PENDING') RETURNING id, email, name, role`,
      [email, passwordHash, name, profession, phone, req.body.company || '', kvkkConsent || false, marketingConsent || false, explicitConsent || false]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: e.message });
  }
});

/* --- PUBLIC ENDPOINTS --- */
app.get('/api/public/members/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    
    const { rows } = await pool.query(
      `SELECT id, name, company 
       FROM users 
       WHERE account_status = 'ACTIVE' 
       AND (name ILIKE $1 OR company ILIKE $1)
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/public/members/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, company 
       FROM users 
       WHERE id = $1 AND account_status = 'ACTIVE'`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/auth/create-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()",
      [token]
    );

    if (rows.length === 0) return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş token.' });

    const user = rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, account_status = 'ACTIVE' WHERE id = $2",
      [hashedPassword, user.id]
    );

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update User (Admin) - Triggers Welcome Email if activating
// Update Own Profile (User)
app.put('/api/users/me', authenticateToken, async (req, res) => {
  const id = req.user.id;
  const { name, phone, city, profession, company, tax_number, tax_office, billing_address } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check current data
      const currentRes = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      if (currentRes.rows.length === 0) throw new Error('User not found');
      const currentUser = currentRes.rows[0];

      const updates = [];
      const values = [];
      let idx = 1;

      // Allow always updating personal info
      if (name) { updates.push(`name = $${idx++}`); values.push(name); }
      if (phone) { updates.push(`phone = $${idx++}`); values.push(phone); }
      if (city) { updates.push(`city = $${idx++}`); values.push(city); }
      if (profession) { updates.push(`profession = $${idx++}`); values.push(profession); }

      // Company Info Restricted: Can only set if currently empty
      const isCompanyInfoEmpty = !currentUser.company && !currentUser.tax_number;

      if (isCompanyInfoEmpty) {
        if (company) { updates.push(`company = $${idx++}`); values.push(company); }
        if (tax_number) { updates.push(`tax_number = $${idx++}`); values.push(tax_number); }
        if (tax_office) { updates.push(`tax_office = $${idx++}`); values.push(tax_office); }
        if (billing_address) { updates.push(`billing_address = $${idx++}`); values.push(billing_address); }
      } else {
        // If trying to change restricted fields, ignore them or throw error?
        // User request: "sadece admin değiştirebilir". We will just ignore them if passed.
      }

      if (updates.length > 0) {
        await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, [...values, id]);
      }

      await client.query('COMMIT');
      const finalRes = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      res.json(finalRes.rows[0]);
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

// Update User (Admin)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);

  const { id } = req.params;
  const { status, role, email, name, phone, city, profession, company, tax_number, tax_office, billing_address } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const currentRes = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      if (currentRes.rows.length === 0) throw new Error('User not found');
      const currentUser = currentRes.rows[0];

      const updates = [];
      const values = [];
      let idx = 1;

      // Map request body fields to flexible variables
      const bodyStatus = status || req.body.account_status;

      if (bodyStatus) { updates.push(`account_status = $${idx++}`); values.push(bodyStatus); }
      if (role) { updates.push(`role = $${idx++}`); values.push(role); }
      if (email !== undefined) { updates.push(`email = $${idx++}`); values.push(email); }
      if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
      if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone); }
      if (city !== undefined) { updates.push(`city = $${idx++}`); values.push(city); }
      if (profession !== undefined) { updates.push(`profession = $${idx++}`); values.push(profession); }
      if (company !== undefined) { updates.push(`company = $${idx++}`); values.push(company); }
      if (tax_number !== undefined) { updates.push(`tax_number = $${idx++}`); values.push(tax_number); }
      if (tax_office !== undefined) { updates.push(`tax_office = $${idx++}`); values.push(tax_office); }
      if (billing_address !== undefined) { updates.push(`billing_address = $${idx++}`); values.push(billing_address); }

      if (updates.length > 0) {
        await client.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, [...values, id]);
      }

      // Check if activating and sending welcome email
      // Condition: Status becoming ACTIVE, and user might not have password or we just always send welcome on first activation?
      // Let's assume if they don't have a password set (password_hash is null) OR we explicitly want to send invite.
      // For now: If status changed to ACTIVE and password_hash is NULL.
      console.log(`[USER UPDATE] ID: ${id} | NewStatus: ${status} | CurrentStatus: ${currentUser.account_status} | HasHash: ${!!currentUser.password_hash}`);

      // Relaxed condition: If status is being set to ACTIVE (explicitly) and user has no password.
      // This allows re-triggering the email if the first attempt failed (and DB was updated) 
      // by sending the status update again.
      // Logic Split:
      // 1. If user HAS password (new flow) -> Send simple Welcome Email
      // 2. If user NO password (legacy) -> Send Create Password Email

      if (status === 'ACTIVE' && currentUser.account_status !== 'ACTIVE') {
        if (currentUser.password_hash) {
          // User has password -> Send simple Welcome
          const emailResult = await sendEmail(
            currentUser.email,
            'Üyeliğiniz Onaylandı - Aramıza Hoş Geldiniz',
            `
                      <h2>Aramıza Hoş Geldiniz!</h2>
                      <p>Sayın ${currentUser.name},</p>
                      <p>Event 4 Network ailesine yaptığınız üyelik başvurusu onaylanmıştır.</p>
                      <p>Sistemimize giriş yaparak profilinizi oluşturabilir ve etkinliklere katılabilirsiniz.</p>
                      <br>
                      <a href="${req.headers.origin || 'https://event4network.com'}/auth/login" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Giriş Yap</a>
                      <br><br>
                      <p>Saygılarımızla,<br>Event 4 Network Ekibi</p>
                    `
          );
          console.log(`Simple Welcome email sent to ${currentUser.email}: ${emailResult?.success ? 'SUCCESS' : 'FAILED'}`);

        } else {
          // User NO password -> Send Create Password Link
          const token = crypto.randomBytes(32).toString('hex');
          const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          console.log('Generating Welcome Token for:', currentUser.email);

          await client.query('UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3', [token, expires, id]);

          // Send Email
          const resetLink = `${req.headers.origin || 'http://localhost:5173'}/create-password?token=${token}`;

          const emailResult = await sendEmail(
            currentUser.email,
            'Üyeliğiniz Onaylandı - Şifrenizi Oluşturun',
            `
                      <h2>Aramıza Hoş Geldiniz!</h2>
                      <p>Sayın ${currentUser.name},</p>
                      <p>Event 4 Network ailesine katılımınız onaylanmıştır.</p>
                      <p>Hesabınıza erişmek ve şifrenizi oluşturmak için lütfen aşağıdaki bağlantıya tıklayın:</p>
                      <a href="${resetLink}" style="padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Şifremi Oluştur</a>
                      <p>Bu bağlantı 24 saat geçerlidir.</p>
                      <br>
                      <p>Saygılarımızla,<br>Event 4 Network Ekibi</p>
                    `
          );

          if (emailResult && emailResult.success) {
            console.log(`Create Password email sent to ${currentUser.email}`);
          } else {
            console.error(`Failed to send create password email to ${currentUser.email}:`, emailResult?.error);
          }
        }
      }
      // Allow re-sending create password if active but no password (manual retry)
      else if (status === 'ACTIVE' && !currentUser.password_hash) {
        // ... (Reuse existing logic or copy block if needed, but for now simple structure is safer)
        // To avoid code duplication, I will keep the re-try logic separate or merged above.
        // Merging above:
      }

      await client.query('COMMIT');

      const finalRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      res.json(finalRes.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ...

// Professions
// Professions
app.get('/api/professions', async (req, res) => {
  const { q } = req.query;
  try {
    let query = 'SELECT id, name, category FROM professions';
    let params = [];
    if (q) {
      query += ' WHERE name ILIKE $1';
      params.push(`%${q}%`);
    }
    query += ' ORDER BY name ASC LIMIT 50';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/professions', async (req, res) => {
  try {
    const { name, category } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO professions (name, category) VALUES ($1, $2) RETURNING *",
      [name, category]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/professions/:id', async (req, res) => {
  try {
    const { name, category } = req.body;
    const { rows } = await pool.query(
      "UPDATE professions SET name = $1, category = $2 WHERE id = $3 RETURNING *",
      [name, category, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/professions/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM professions WHERE id = $1", [req.params.id]);
    res.sendStatus(204);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    console.log('User found:', rows.length > 0 ? 'Yes' : 'No');
    if (rows.length === 0) return res.status(400).json({ error: 'User not found' });

    const user = rows[0];
    if (!user.password_hash) {
      return res.status(400).json({ error: 'Bu hesap için henüz şifre oluşturulmamış. Lütfen şifremi unuttum bağlantısını kullanınız.' });
    }
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
    const { rows } = await pool.query('SELECT id, name, email, role, profession, performance_score, performance_color, subscription_end_date, subscription_plan FROM users WHERE id = $1', [req.user.id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  // Validate UUID format
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;


  try {
    try {
      // Try fetching with all new fields
      /*
        QUERY IMPROVEMENT: Added subqueries for real-time stats (Performance Scorecard)
        - metric_referrals: Count of referrals given
        - metric_revenue: Sum of amount from referrals given
        - metric_visitors: Count of visitors invited
        - metric_one_to_ones: Count of 1-to-1s (requester or partner)
      */
      const { rows } = await pool.query(`
        SELECT u.id, u.name, u.name as full_name, u.profession, u.email, u.phone, u.city, u.performance_score, u.performance_color,
               u.company, u.tax_number, u.tax_office, u.billing_address, u.account_status,
               g.name as group_name,
               (SELECT COUNT(*)::int FROM referrals WHERE giver_id = u.id) as metric_referrals,
               (SELECT COALESCE(SUM(amount), 0)::float FROM referrals WHERE giver_id = u.id AND status = 'SUCCESSFUL') as metric_revenue,
                (SELECT COUNT(*)::int FROM visitors WHERE inviter_id = u.id) as metric_visitors,
                (SELECT COUNT(*)::int FROM one_to_ones WHERE requester_id = u.id OR receiver_id = u.id) as metric_one_to_ones,
                (
                  SELECT COALESCE(json_agg(t), '[]'::json) FROM (
                    SELECT ot.meeting_date, 
                           CASE 
                             WHEN ot.requester_id = u.id THEN (SELECT name FROM users WHERE id = ot.receiver_id)
                             ELSE (SELECT name FROM users WHERE id = ot.requester_id)
                           END as partner_name,
                           ot.status
                    FROM one_to_ones ot
                    WHERE ot.requester_id = u.id OR ot.receiver_id = u.id
                    ORDER BY ot.meeting_date DESC
                    LIMIT 3
                  ) t
                ) as last_meetings
        FROM users u
        LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.status = 'ACTIVE'
        LEFT JOIN groups g ON gm.group_id = g.id
        WHERE u.id = $1
      `, [id]);

      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json(rows[0]);
    } catch (fieldError) {
      console.error('⚠️ New fields query failed (migrations might be pending), falling back to basic query:', fieldError.message);

      // Fallback: Basic query (Old schema)
      const { rows } = await pool.query(`
        SELECT u.id, u.name, u.name as full_name, u.profession, u.email, u.phone, u.city, u.performance_score, u.performance_color,
               g.name as group_name
        FROM users u
        LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.status = 'ACTIVE'
        LEFT JOIN groups g ON gm.group_id = g.id
        WHERE u.id = $1
      `, [id]);

      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json(rows[0]);
    }
  } catch (e) {
    console.error('❌ GET /api/users/:id Critical Error:', e);
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
      `INSERT INTO one_to_ones(requester_id, partner_id, meeting_date, notes) VALUES($1, $2, $3, $4) RETURNING * `,
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
       WHERE id = $2 AND(requester_id = $3 OR partner_id = $3)
       RETURNING * `,
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

// Convert Visitor to Member
app.post('/api/visitors/:id/convert', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Get Visitor Details
    const vRes = await client.query('SELECT * FROM visitors WHERE id = $1', [id]);
    if (vRes.rows.length === 0) return res.status(404).json({ error: 'Ziyaretçi bulunamadı' });
    const v = vRes.rows[0];

    // 2. Update Visitor Status
    await client.query("UPDATE visitors SET status = 'CONVERTED' WHERE id = $1", [id]);

    // 3. Create User if not exists
    const userCheck = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [v.email]);
    if (userCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, phone, company, profession, account_status, role) 
         VALUES ($1, $2, $3, $4, $5, 'PENDING', 'MEMBER')`,
        [v.name, v.email, v.phone, v.company, v.profession]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.post('/api/visitors', authenticateToken, async (req, res) => {
  const { name, profession, phone, email, visitedAt, status } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO visitors(inviter_id, name, profession, phone, email, visited_at, status) 
       VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING * `,
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
      `INSERT INTO education(user_id, title, hours, completed_date, type, notes) 
       VALUES($1, $2, $3, $4, $5, $6) RETURNING * `,
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
       WHERE (o.requester_id = $1 OR o.partner_id = $1) AND o.status IN ('ACCEPTED', 'COMPLETED')`,
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

    // Get General Events (Public or User's Group Events)
    const events = await pool.query(
      `SELECT e.id, e.start_at, 'meeting' as type, e.title, e.location 
       FROM events e
       LEFT JOIN group_members gm ON e.group_id = gm.group_id AND gm.user_id = $1
       WHERE e.status IN ('PUBLISHED', 'COMPLETED') 
       AND (e.is_public = true OR gm.user_id IS NOT NULL)`,
      [userId]
    );

    // Combine all calendar items
    const calendar = [
      ...oneToOnes.rows,
      ...visitors.rows,
      ...education.rows,
      ...events.rows
    ].sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

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

app.get('/api/users/:id/attendance', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, e.title as event_title, e.start_at 
       FROM attendance a JOIN events e ON a.event_id = e.id 
       WHERE a.user_id = $1 ORDER BY e.start_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/events/attendance', authenticateToken, async (req, res) => {
  const { group_id, meeting_date, topic, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create Event
    const eventRes = await client.query(`
      INSERT INTO events (group_id, title, start_at, type, status, description, created_by)
      VALUES ($1, $2, $3, 'meeting', 'PUBLISHED', 'Haftalık Toplantı', $4)
      RETURNING id
    `, [group_id, topic || 'Haftalık Toplantı', meeting_date, req.user.id]);
    const eventId = eventRes.rows[0].id;

    // 2. Insert Attendance
    if (items && Array.isArray(items)) {
      for (const item of items) {
        // item: { user_id, status }
        await client.query(`
          INSERT INTO attendance (event_id, user_id, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (event_id, user_id) DO UPDATE SET status = $3
        `, [eventId, item.user_id, item.status]);
      }
    }

    await client.query('COMMIT');

    // 3. Recalculate Scores (Async)
    if (items && Array.isArray(items)) {
      Promise.all(items.map(i => calculateMemberScore(i.user_id))).catch(console.error);
    }

    res.json({ success: true, eventId });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Submit Attendance Error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
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
            INSERT INTO attendance(event_id, user_id, status)
            VALUES($1, $2, 'PRESENT')-- 'PRESENT' as placeholder for registered / will attend
      `, [eventId, req.user.id]);

      // 5. Generate Ticket if enabled
      if (event.generate_tickets) {
        const ticketNumber = `E4N-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        
        let paymentStatus = 'FREE';
        if (event.price > 0) {
            paymentStatus = req.body.payment_status || 'PENDING';
        }

        await client.query(`
            INSERT INTO event_tickets(event_id, user_id, ticket_number, payment_status)
            VALUES($1, $2, $3, $4)
        `, [eventId, req.user.id, ticketNumber, paymentStatus]);

        console.log(`🎫 Ticket Generated: ${ticketNumber} for User ${req.user.id} - Event ${eventId}`);
      }

      await client.query('COMMIT');

      // Recalculate Score
      calculateMemberScore(req.user.id).catch(console.error);

      res.json({ 
        success: true, 
        message: 'Successfully registered',
        ticket_needed: event.generate_tickets,
        price: event.price
      });

    } catch (e) {
      if (client) await client.query('ROLLBACK');
      throw e;
    } finally {
      if (client) client.release();
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
      `INSERT INTO referrals(giver_id, receiver_id, type, temperature, status, description, amount)
    VALUES($1, $2, $3, $4, 'PENDING', $5, $6) RETURNING * `,
      [req.user.id, receiverId, type, temperature, description, amount]
    );
    // Recalculate Score
    await calculateMemberScore(req.user.id);

    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/referrals/:id', authenticateToken, async (req, res) => {
  const { status, amount, notes } = req.body;
  const { id } = req.params;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Check current referral
      const checkRes = await client.query('SELECT * FROM referrals WHERE id = $1', [id]);
      if (checkRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Referral not found' });
      }
      const referral = checkRes.rows[0];

      // 2. Validate Ciro Rule
      // "Elden ciro girilmediği sürece iş yönlendirmesi onaylanmamış olur"
      // If status is becoming 'SUCCESSFUL' (or checks related to approval), amount must be present.
      let newAmount = amount !== undefined ? amount : referral.amount;

      if (status === 'SUCCESSFUL') {
        if (!newAmount || parseFloat(newAmount) <= 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'İş yönlendirmesini onaylamak için ciro (tutar) girişi zorunludur.' });
        }
      }

      // 3. Update
      const { rows } = await client.query(`
        UPDATE referrals 
        SET status = COALESCE($1, status), 
            amount = COALESCE($2, amount),
            notes = COALESCE($3, notes),
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [status, amount, notes, id]);

      await client.query('COMMIT');

      // 4. Recalculate Scores
      // Score affects the GIVER (who gave the referral)
      if (rows[0].giver_id) {
        await calculateMemberScore(rows[0].giver_id);
      }

      res.json(rows[0]);
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

// Health & General
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ----------------------------------------------------------------------
// NEW ENDPOINTS TO FIX 404 ERRORS
// ----------------------------------------------------------------------

// 1. Education by User ID
app.get('/api/users/:id/education', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM education WHERE user_id = $1 ORDER BY completed_date DESC', [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Visitors by User ID (Query Param or Route)
app.get('/api/user/visitors', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.query.userId || req.user.id;
    const { rows } = await pool.query('SELECT * FROM visitors WHERE inviter_id = $1 ORDER BY visited_at DESC', [targetUserId]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/events/:id/attendance', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.*, u.name as user_name, u.profession
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.event_id = $1
      ORDER BY u.name ASC
    `, [req.params.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Friend Requests
app.get('/api/user/friends/requests', authenticateToken, async (req, res) => {
  try {
    const { type } = req.query; // 'incoming' or 'outgoing'
    let query = '';
    let params = [];

    if (type === 'incoming') {
      query = `
                SELECT fr.*, u.name as sender_name, u.profession as sender_profession 
                FROM friend_requests fr
                JOIN users u ON fr.sender_id = u.id
                WHERE fr.receiver_id = $1 AND fr.status = 'PENDING'
            `;
      params = [req.user.id];
    } else {
      query = `
                SELECT fr.*, u.name as receiver_name, u.profession as receiver_profession 
                FROM friend_requests fr
                JOIN users u ON fr.receiver_id = u.id
                WHERE fr.sender_id = $1
            `;
      params = [req.user.id];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/friends/request', authenticateToken, async (req, res) => {
  const { targetId } = req.body;
  try {
    // Check if already exists
    const existing = await pool.query('SELECT * FROM friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)', [req.user.id, targetId]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Request already exists' });

    await pool.query('INSERT INTO friend_requests (sender_id, receiver_id) VALUES ($1, $2)', [req.user.id, targetId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/friends/request/:id/accept', authenticateToken, async (req, res) => { // Sender ID passed usually or Request ID? API.ts passes SenderID?
  // api.ts: request(`/user/friends/request/${senderId}/accept`)
  // So :id here is the SENDER_ID (The person who sent the request to ME)
  const senderId = req.params.id;
  const myId = req.user.id;
  try {
    await pool.query("UPDATE friend_requests SET status = 'ACCEPTED' WHERE sender_id = $1 AND receiver_id = $2 AND status = 'PENDING'", [senderId, myId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/friends/request/:id/reject', authenticateToken, async (req, res) => {
  const senderId = req.params.id;
  const myId = req.user.id;
  try {
    await pool.query("UPDATE friend_requests SET status = 'REJECTED' WHERE sender_id = $1 AND receiver_id = $2", [senderId, myId]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


app.get('/api/users', authenticateToken, async (req, res) => {
  const { name, profession, city } = req.query;
  try {
    let query = 'SELECT id, name, profession, city, email, phone FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (name) {
      query += ` AND name ILIKE $${paramCount} `;
      params.push(`%${name}%`);
      paramCount++;
    }
    if (profession) {
      query += ` AND profession ILIKE $${paramCount} `;
      params.push(`%${profession}%`);
      paramCount++;
    }
    if (city) {
      query += ` AND city ILIKE $${paramCount} `;
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
app.get('/api/user/groups', authenticateToken, async (req, res) => {
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

app.get('/api/user/power-teams', authenticateToken, async (req, res) => {
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
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
        SELECT g.*, 
          (SELECT count(*)::int FROM group_members gm WHERE gm.group_id = g.id) as member_count
        FROM groups g
        ORDER BY g.name ASC
      `);
    // Ensure meeting_dates is an array if it comes as a string or is null
    const processedRows = rows.map(row => ({
      ...row,
      meeting_dates: Array.isArray(row.meeting_dates) ? row.meeting_dates :
        (typeof row.meeting_dates === 'string' ? JSON.parse(row.meeting_dates) : [])
    }));
    res.json(processedRows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get Single Group by ID
app.get('/api/groups/:id', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.*, 
             (SELECT count(*)::int FROM group_members gm WHERE gm.group_id = g.id) as member_count
             FROM groups g
             WHERE g.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Grup bulunamadı' });
    const group = rows[0];
    group.meeting_dates = Array.isArray(group.meeting_dates) ? group.meeting_dates :
      (typeof group.meeting_dates === 'string' ? JSON.parse(group.meeting_dates) : []);
    res.json(group);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


app.get('/api/groups/:id/members', authenticateToken, async (req, res) => {
  try {
    // Return all users that are members of this group
    const { rows } = await pool.query(
      `SELECT u.id, u.name as full_name, u.profession, u.email, u.role, u.performance_score, u.performance_color, gm.status, gm.joined_at as created_at,
       (SELECT count(*)::int 
        FROM attendance a 
        JOIN events e ON a.event_id = e.id 
        WHERE a.user_id = u.id AND e.group_id = $1 AND a.status = 'ABSENT') as absence_count
       FROM group_members gm 
       JOIN users u ON gm.user_id = u.id 
       WHERE gm.group_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/groups/:id/referrals', authenticateToken, async (req, res) => {
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



app.get('/api/groups/:id/events', authenticateToken, async (req, res) => {
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
  const { type, group_id, limit, mode } = req.query;
  try {
    // Automatically transition past published events to COMPLETED
    await pool.query(`
      UPDATE events 
      SET status = 'COMPLETED' 
      WHERE status = 'PUBLISHED' 
        AND COALESCE(end_at, start_at) < NOW()
    `);

    let query = `
      SELECT e.*, g.name as group_name 
      FROM events e 
      LEFT JOIN groups g ON e.group_id = g.id 
      WHERE 1=1 
    `;
    const params = [];
    let paramCount = 1;

    if (type) {
      query += ` AND e.type = $${paramCount} `;
      params.push(type);
      paramCount++;
    }
    if (group_id) {
      query += ` AND e.group_id = $${paramCount} `;
      params.push(group_id);
      paramCount++;
    }

    if (mode === 'admin') {
      // Admin sees everything
      query += ' ORDER BY e.start_at DESC';
    } else {
      // Public view
      query += " AND status = 'PUBLISHED' AND (end_at > NOW() OR start_at > NOW() - INTERVAL '14 days')";
      query += ' ORDER BY pinned DESC NULLS LAST, start_at ASC';
    }

    if (limit) {
      query += ` LIMIT $${paramCount}`;
      params.push(limit);
    }

    const { rows } = await pool.query(query, params);
    
    // Auth check for online_link visibility
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let reqUser = null;
    if (token) {
      try {
        reqUser = jwt.verify(token, SECRET_KEY);
      } catch (err) { /* ignore */ }
    }
    const isAdmin = reqUser && reqUser.role === 'ADMIN';

    const sanitizedRows = rows.map(r => {
      const copy = { ...r };
      if (!isAdmin) {
        delete copy.online_link;
      }
      return copy;
    });

    res.json(sanitizedRows);
  } catch (e) {
    console.error('SERVER ERROR in GET /api/events:', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Get Single Event (Fix 404)
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(`
      SELECT e.*, g.name as group_name 
      FROM events e 
      LEFT JOIN groups g ON e.group_id = g.id 
      WHERE e.id = $1
    `, [id]);

    if (rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    const event = rows[0];

    // Auth check for online_link visibility
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let reqUser = null;
    if (token) {
      try {
        reqUser = jwt.verify(token, SECRET_KEY);
      } catch (err) { /* ignore */ }
    }
    const isAdmin = reqUser && reqUser.role === 'ADMIN';

    if (!isAdmin) {
      delete event.online_link;
    }

    // Participants list
    const attRes = await pool.query(`
      SELECT u.id, u.name, u.avatar, u.profession, a.status 
      FROM attendance a
      JOIN users u ON a.user_id = u.id 
      WHERE a.event_id = $1
    `, [id]);

    event.attendees = attRes.rows;
    res.json(event);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create Event
app.post('/api/events', authenticateToken, async (req, res) => {
  const { title, description, location, start_at, end_at, is_public, type, group_id, has_equal_opportunity_badge, city, is_online, status, pinned, max_attendees, generate_tickets, price, currency, online_link } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO events(title, description, location, start_at, end_at, created_by, is_public, type, group_id, has_equal_opportunity_badge, city, is_online, status, pinned, max_attendees, generate_tickets, price, currency, online_link)
       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING * `,
      [title, description, location, start_at, end_at, req.user.id, is_public, type, group_id, has_equal_opportunity_badge, city, is_online, status || 'PUBLISHED', pinned || false, max_attendees || 50, generate_tickets || false, price || 0, currency || 'TRY', online_link || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Event
app.put('/api/events/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, location, start_at, end_at, is_public, type, group_id, has_equal_opportunity_badge, status, city, is_online, pinned, max_attendees, generate_tickets, price, currency, online_link } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++} `); values.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++} `); values.push(description); }
    if (location !== undefined) { fields.push(`location = $${idx++} `); values.push(location); }
    if (start_at !== undefined) { fields.push(`start_at = $${idx++} `); values.push(start_at); }
    if (end_at !== undefined) { fields.push(`end_at = $${idx++} `); values.push(end_at); }
    if (is_public !== undefined) { fields.push(`is_public = $${idx++} `); values.push(is_public); }
    if (type !== undefined) { fields.push(`type = $${idx++} `); values.push(type); }
    if (group_id !== undefined) { fields.push(`group_id = $${idx++} `); values.push(group_id || null); }
    if (has_equal_opportunity_badge !== undefined) { fields.push(`has_equal_opportunity_badge = $${idx++} `); values.push(has_equal_opportunity_badge); }
    if (city !== undefined) { fields.push(`city = $${idx++} `); values.push(city); }
    if (is_online !== undefined) { fields.push(`is_online = $${idx++} `); values.push(is_online); }
    if (status !== undefined) { fields.push(`status = $${idx++} `); values.push(status); }
    if (pinned !== undefined) { fields.push(`pinned = $${idx++} `); values.push(pinned); }
    if (max_attendees !== undefined) { fields.push(`max_attendees = $${idx++} `); values.push(max_attendees); }
    if (generate_tickets !== undefined) { fields.push(`generate_tickets = $${idx++} `); values.push(generate_tickets); }
    if (price !== undefined) { fields.push(`price = $${idx++} `); values.push(price); }
    if (currency !== undefined) { fields.push(`currency = $${idx++} `); values.push(currency); }
    if (online_link !== undefined) { fields.push(`online_link = $${idx++} `); values.push(online_link); }

    if (fields.length === 0) return res.json({ message: 'No changes' });

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING * `,
      values
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Event
app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Run Migrations manually (Admin only)
app.post('/api/admin/run-migrations', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied: Admins only.' });
  }
  try {
    await runMigrations();
    res.json({ success: true, message: 'Database migrations executed successfully.' });
  } catch (e) {
    console.error('Error running manual migration:', e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.get('/api/admin/members', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
            SELECT 
              u.id, 
              u.name, 
              u.email, 
              u.phone, 
              u.city, 
              u.profession, 
              u.role, 
              u.created_at,
              COALESCE(u.performance_score, 0) as performance_score, 
              COALESCE(u.performance_color, 'GREY') as performance_color,
              COALESCE(u.account_status, 'PENDING') as status, 
              g.name as group_name, 
              'ACTIVE' as profession_status, 
              NULL as profession_id, 
              NULL as profession_category
            FROM users u
            LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.status = 'ACTIVE'
            LEFT JOIN groups g ON gm.group_id = g.id
            ORDER BY u.created_at DESC
        `);
    res.json(rows.map(r => ({ ...r, full_name: r.name })));
  } catch (e) {
    console.error('Admin Members Error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/members/:id', authenticateToken, async (req, res) => {
  console.log(`[DELETE MEMBER REQUEST] ID: ${req.params.id} | Initiated by: ${req.user?.email} (${req.user?.role})`);

  if (req.user.role !== 'ADMIN') {
    console.log('[DELETE MEMBER] Access Denied: User is not ADMIN');
    return res.sendStatus(403);
  }

  const { id } = req.params;

  // Protect key users CHECK
  try {
    const checkRes = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      console.log(`[DELETE MEMBER] User ${id} not found in DB`);
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (e) {
    console.error('[DELETE MEMBER] DB Error during check:', e);
    return res.status(500).json({ error: e.message });
  }

  // Safe delete helper logic inline
  const safeDelete = async (client, table, query, params) => {
    try {
      await client.query('SAVEPOINT sp_' + table);
      await client.query(query, params);
      await client.query('RELEASE SAVEPOINT sp_' + table);
    } catch (e) {
      await client.query('ROLLBACK TO SAVEPOINT sp_' + table);
      // ignore table missing or other non-critical errors if intended
      console.warn(`SafeDelete Warning for ${table}:`, e.message);
    }
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete Dependencies (Most critical ones first)
    await safeDelete(client, 'group_members', 'DELETE FROM group_members WHERE user_id = $1', [id]);
    await safeDelete(client, 'generated_leads', 'DELETE FROM generated_leads WHERE user_id = $1', [id]);

    // Power Teams
    await safeDelete(client, 'power_team_members', 'DELETE FROM power_team_members WHERE user_id = $1', [id]);

    // Attendance
    await safeDelete(client, 'attendance', 'DELETE FROM attendance WHERE user_id = $1', [id]);

    // Visitors (invited by user)
    await safeDelete(client, 'visitors', 'DELETE FROM visitors WHERE inviter_id = $1', [id]);

    // Education
    await safeDelete(client, 'education', 'DELETE FROM education WHERE user_id = $1', [id]);

    // Champions
    await safeDelete(client, 'champions', 'DELETE FROM champions WHERE user_id = $1', [id]);

    // Notifications
    await safeDelete(client, 'notifications', 'DELETE FROM notifications WHERE user_id = $1', [id]);

    // Support & Messages
    await safeDelete(client, 'ticket_messages', 'DELETE FROM ticket_messages WHERE sender_id = $1', [id]);
    await safeDelete(client, 'tickets', 'DELETE FROM tickets WHERE user_id = $1', [id]);
    await safeDelete(client, 'messages', 'DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [id]);

    // Scoring & Revenue
    await safeDelete(client, 'user_score_history', 'DELETE FROM user_score_history WHERE user_id = $1', [id]);
    await safeDelete(client, 'revenue_entries', 'DELETE FROM revenue_entries WHERE user_id = $1', [id]);

    // Referrals (Giver or Receiver)
    await safeDelete(client, 'referrals', 'DELETE FROM referrals WHERE giver_id = $1 OR receiver_id = $1', [id]);

    // One-to-Ones
    await safeDelete(client, 'one_to_ones', 'DELETE FROM one_to_ones WHERE requester_id = $1 OR partner_id = $1', [id]);

    // Friend Requests
    await safeDelete(client, 'friend_requests', 'DELETE FROM friend_requests WHERE sender_id = $1 OR receiver_id = $1', [id]);

    // Update Events created by user to NULL
    await safeDelete(client, 'events', 'UPDATE events SET created_by = NULL WHERE created_by = $1', [id]);

    // 2. Finally Delete User
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');
    console.log(`[DELETE MEMBER SUCCESS] User ${id} deleted successfully.`);
    res.json({ success: true, message: 'Üye başarıyla silindi.' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(`[DELETE MEMBER ERROR] Failed to delete user ${id}:`, e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

/* --- SIPAY PAYMENT ENDPOINT --- */

function generateSipayHash(parts, appSecret) {
  // Generate IV using SHA1 hash of random value
  const iv = crypto.createHash('sha1').update(String(Math.random())).digest('hex').slice(0, 16);
  // Generate password using SHA1 hash of app secret
  const password = crypto.createHash('sha1').update(appSecret).digest('hex');
  // Generate salt using SHA1 hash of random value
  const salt = crypto.createHash('sha1').update(String(Math.random())).digest('hex').slice(0, 4);
  // Create encryption key using SHA256 hash of password and salt
  const saltWithPassword = crypto.createHash('sha256')
      .update(password + salt)
      .digest('hex')
      .slice(0, 32);
  // Encrypt data using AES-256-CBC
  const cipher = crypto.createCipheriv('aes-256-cbc', saltWithPassword, iv);
  let encrypted = cipher.update(parts.join('|'), 'binary', 'base64');
  encrypted += cipher.final('base64');
  // Bundle components and replace forward slashes with double underscores
  let msgEncryptedBundle = `${iv}:${salt}:${encrypted}`;
  msgEncryptedBundle = msgEncryptedBundle.replace(/\//g, '__');
  return msgEncryptedBundle;
}

app.post('/api/payment/pay', async (req, res) => {
  const { cardNumber, cardHolderName, expiryMonth, expiryYear, cvv, total } = req.body;
  
  if (!cardNumber || !cardHolderName || !expiryMonth || !expiryYear || !cvv || !total) {
    return res.status(400).json({ error: 'Eksik kart veya ödeme bilgileri.' });
  }

  // Load configs from environment variables with fallback to Sipay test values
  const sipayApiUrl = process.env.SIPAY_API_URL || 'https://provisioning.sipay.com.tr/ccpayment';
  const sipayAppId = process.env.SIPAY_APP_ID || '6d4a7e9374a76c15260fcc75e315b0b9';
  const sipayAppSecret = process.env.SIPAY_APP_SECRET || 'b46a67571aa1e7ef5641dc3fa6f1712a';
  const sipayMerchantKey = process.env.SIPAY_MERCHANT_KEY || '$2y$10$HmRgYosneqcwHj.UH7upGuyCZqpQ1ITgSMj9Vvxn.t6f.Vdf2SQFO';

  try {
    // 1. Generate token
    const tokenResponse = await fetch(`${sipayApiUrl}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: sipayAppId,
        app_secret: sipayAppSecret,
        app_lang: "tr"
      })
    });
    
    const tokenData = await tokenResponse.json();
    if (tokenData.status_code !== 100) {
      return res.status(400).json({ 
        error: 'sipay_auth_failed', 
        message: 'Sipay kimlik doğrulama başarısız oldu: ' + tokenData.status_description 
      });
    }

    const sipayToken = tokenData.data.token;

    // 2. Generate Hash Signature
    const invoice_id = "INV-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    
    // Sipay amount format is strictly string float with 2 decimal places in hash (e.g. "1000.00")
    const formattedTotal = parseFloat(total).toFixed(2);
    const hashParts = [
      formattedTotal,
      "1", // installment
      "TRY", // currency_code
      sipayMerchantKey,
      invoice_id
    ];
    
    const hash_key = generateSipayHash(hashParts, sipayAppSecret);

    // 3. Make POS Payment
    const cleanCardNumber = cardNumber.replace(/\s+/g, '');
    const payResponse = await fetch(`${sipayApiUrl}/api/paySmart2D`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sipayToken}`
      },
      body: JSON.stringify({
        card_number: cleanCardNumber,
        cc_no: cleanCardNumber,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        cvv: cvv,
        card_holder_name: cardHolderName,
        cc_holder_name: cardHolderName,
        merchant_key: sipayMerchantKey,
        total: parseFloat(total),
        installment: 1,
        installments_number: 1,
        currency_code: 'TRY',
        invoice_id: invoice_id,
        hash_key: hash_key
      })
    });

    const payData = await payResponse.json();
    
    if (payData.status_code === 100) {
      res.json({ success: true, message: 'Ödeme başarıyla tamamlandı.', data: payData.data });
    } else {
      res.status(400).json({ 
        success: false, 
        error: payData.status_code, 
        message: payData.status_description || 'Ödeme reddedildi.' 
      });
    }
  } catch (err) {
    console.error('Sipay POS Error:', err);
    res.status(500).json({ error: 'system_error', message: err.message });
  }
});

/* --- VISITOR INVITATION ENDPOINTS --- */

// Send Visitor Invite (Auth required)
app.post('/api/visitor-invite', authenticateToken, async (req, res) => {
  const { email, origin } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'E-posta adresi gereklidir.' });
  }
  
  try {
    // Generate token valid for 6 hours
    const token = jwt.sign(
      { email: email.trim().toLowerCase(), inviter_id: req.user.id, type: 'visitor_invite' },
      SECRET_KEY,
      { expiresIn: '6h' }
    );
    
    // Construct invitation link
    const inviteLink = `${origin || 'http://localhost:5173'}/ziyaretci?token=${token}`;
    
    // Send email
    const subject = 'Ziyaretçi Daveti - Event4Network';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #ef4444; margin: 0; font-size: 28px; font-weight: 800; tracking-tight">Event4Network</h2>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; font-weight: 500;">Seçici Networking Platformu</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; padding-top: 25px;">
          <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">Merhaba,</p>
          <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">E4N (Event4Network) üyelerimizden biri tarafından platformumuzdaki toplantımıza ziyaretçi olarak katılmanız için davet edildiniz.</p>
          <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">Aşağıdaki bağlantıya tıklayarak <strong>ücretsiz</strong> ziyaretçi kaydınızı oluşturabilirsiniz:</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${inviteLink}" style="background-color: #ef4444; color: white; padding: 14px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2);">Daveti Kabul Et ve Kaydol</a>
          </div>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <p style="color: #991b1b; font-size: 14px; font-weight: 600; margin: 0;">Önemli Not: Bu davet bağlantısı güvenlik amacıyla sadece 6 saat geçerlidir.</p>
          </div>
          <p style="font-size: 16px; color: #1e293b; line-height: 1.6;">Toplantımızda sizi de aramızda görmekten memnuniyet duyacağız.</p>
        </div>
        <div style="border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; margin-top: 30px; padding-top: 20px; line-height: 1.5;">
          Bu e-posta, talep üzerine Event4Network sistemi tarafından gönderilmiştir.<br />
          © 2026 Event4Network. Tüm Hakları Saklıdır.
        </div>
      </div>
    `;
    
    await sendEmail(email.trim().toLowerCase(), subject, html);
    res.json({ success: true });
  } catch (error) {
    console.error('Visitor invite error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Visitor Invite Token (Public)
app.get('/api/visitor-invite/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token gereklidir.' });
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (decoded.type !== 'visitor_invite') {
      return res.status(400).json({ valid: false, error: 'Geçersiz davetiye tipi.' });
    }
    
    // Get inviter details
    const { rows } = await pool.query('SELECT name FROM users WHERE id = $1', [decoded.inviter_id]);
    const inviterName = rows.length > 0 ? rows[0].name : 'E4N Üyesi';
    
    res.json({
      valid: true,
      email: decoded.email,
      inviter_id: decoded.inviter_id,
      inviter_name: inviterName
    });
  } catch (err) {
    console.error('Token verify error:', err);
    res.status(400).json({ valid: false, error: 'Davetiyenin süresi dolmuş veya geçersiz.', message: err.message });
  }
});

// Public Visitors API
app.post('/api/visitors/apply', async (req, res) => {
  const { name, email, phone, company, profession, source, kvkk_accepted, inviter_id, title, web_linkedin, activity_area, duration, target_customer, why_join, value_add, previous_groups, form_data, token, event_id } = req.body;
  try {
    let finalInviterId = inviter_id;
    let finalSource = source || 'web';
    let finalEmail = email;
    let paymentInfo = {};

    if (token) {
      try {
        const decoded = jwt.verify(token, SECRET_KEY);
        if (decoded.type === 'visitor_invite') {
          finalInviterId = decoded.inviter_id;
          finalSource = 'visitor_invite';
          finalEmail = decoded.email;
          paymentInfo = { payment_status: 'FREE', payment_amount: 0, invited: true };
        }
      } catch (err) {
        return res.status(400).json({ error: 'invalid_token', message: 'Davet linkinin süresi dolmuş veya geçersiz.' });
      }
    } else if (source === 'visitor_payment') {
      paymentInfo = { payment_status: 'PAID', payment_amount: 1000 };
    }

    const normalizedPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '____NON_EXISTENT____';
    const normalizedEmail = finalEmail ? finalEmail.trim().toLowerCase() : '____NON_EXISTENT____';

    const checkDup = await pool.query(
      `SELECT id FROM public_visitors 
       WHERE status = 'REJECTED' 
       AND (form_data->>'rejection_type' = 'permanent')
       AND (
         (email IS NOT NULL AND email != '' AND LOWER(email) = $1)
         OR
         (phone IS NOT NULL AND phone != '' AND (phone = $2 OR REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE $3))
       )`,
      [normalizedEmail, phone, `%${normalizedPhone}`]
    );

    if (checkDup.rows.length > 0) {
      return res.status(400).json({ 
        error: 'blocked_rejection',
        message: `Başvurunuz Daha Önce Değerlendirilmiştir\n\nBu kişi veya şirket adına daha önce yapılan başvuru, E4N üyelik kriterleri kapsamında değerlendirilmiş ve uygun bulunmamıştır.\n\nAynı kişi veya şirket adına yeniden yapılacak başvurular değerlendirmeye alınmayacaktır.\n\nAnlayışınız için teşekkür ederiz.` 
      });
    }
    // Lazy migration
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS inviter_id UUID REFERENCES users(id)");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS title VARCHAR(255)");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS web_linkedin VARCHAR(255)");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS activity_area VARCHAR(255)");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS duration VARCHAR(100)");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS target_customer TEXT");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS why_join TEXT");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS value_add TEXT");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS previous_groups TEXT");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb");
    await pool.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id) ON DELETE SET NULL");

    const finalFormData = {
      ...(form_data || {}),
      ...paymentInfo
    };

    const { rows } = await pool.query(
      'INSERT INTO public_visitors (name, email, phone, company, profession, source, kvkk_accepted, inviter_id, title, web_linkedin, activity_area, duration, target_customer, why_join, value_add, previous_groups, form_data, event_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *',
      [name, finalEmail, phone, company, profession || 'Ziyaretçi', finalSource, kvkk_accepted || false, finalInviterId || null, title || null, web_linkedin || null, activity_area || null, duration || null, target_customer || null, why_join || null, value_add || null, previous_groups || null, finalFormData, event_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/public-visitors', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });
  try {
    const { rows } = await pool.query(`
      SELECT pv.*, u.name as inviter_name, e.title as event_title, e.start_at as event_start_at 
      FROM public_visitors pv
      LEFT JOIN users u ON pv.inviter_id = u.id
      LEFT JOIN events e ON pv.event_id = e.id
      ORDER BY pv.created_at DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/public-visitors/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Access denied' });
  const { status, group_id, form_data } = req.body;
  const { id } = req.params;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update public_visitors status
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS inviter_id UUID REFERENCES users(id)");
    await client.query("ALTER TABLE public_visitors ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb");
    if (form_data) {
      await client.query('UPDATE public_visitors SET status = $1, form_data = COALESCE(form_data, \'{}\'::jsonb) || $3 WHERE id = $2', [status, id, JSON.stringify(form_data)]);
    } else {
      await client.query('UPDATE public_visitors SET status = $1 WHERE id = $2', [status, id]);
    }

    // 2. If it's a conversion to a group, create a record in the visitors table
    if (status === 'CONVERTED' && group_id) {
      // Lazy migration: Ensure visitors table has necessary columns
      await client.query("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS company VARCHAR(255)");
      await client.query("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS email VARCHAR(255)");
      await client.query("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS phone VARCHAR(50)");
      await client.query("ALTER TABLE visitors ADD COLUMN IF NOT EXISTS profession VARCHAR(255)");
      await client.query("ALTER TABLE visitors ALTER COLUMN inviter_id DROP NOT NULL");

      // Get visitor details first
      const { rows } = await client.query('SELECT * FROM public_visitors WHERE id = $1', [id]);
      if (rows.length > 0) {
        const v = rows[0];
        try {
          // ensure uuid formatting or null
          let finalInviterId = v.inviter_id;
          if (!finalInviterId || finalInviterId === 'null' || finalInviterId === '') {
             finalInviterId = null;
          }
          await client.query(
            `INSERT INTO visitors (name, email, phone, company, profession, group_id, inviter_id, status, visited_at) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'ATTENDED', NOW())`,
            [v.name, v.email, v.phone, v.company, v.profession, group_id, finalInviterId]
          );

          // 3. Send Email to Visitor
          const gRes = await client.query('SELECT * FROM groups WHERE id = $1', [group_id]);
          if (gRes.rows.length > 0) {
            const group = gRes.rows[0];
            const subject = group.visitor_email_subject || `${group.name} Ziyaretçi Davetiyesi`;
            
            // Calculate Next Meeting Date
            let nextDateStr = '-';
            const today = new Date();
            today.setHours(0,0,0,0);

            if (group.meeting_dates && Array.isArray(group.meeting_dates) && group.meeting_dates.length > 0) {
              const futureDates = group.meeting_dates
                .map(d => new Date(d))
                .filter(d => d >= today)
                .sort((a, b) => a.getTime() - b.getTime());
              
              if (futureDates.length > 0) {
                nextDateStr = futureDates[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
              }
            } else if (group.meeting_day) {
              // Fallback to day of week calculation
              const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const targetDay = days.indexOf(group.meeting_day);
              if (targetDay !== -1) {
                let d = new Date();
                let diff = targetDay - d.getDay();
                if (diff <= 0) diff += 7;
                d.setDate(d.getDate() + diff);
                nextDateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' });
              }
            }

            let template = group.visitor_email_template || `
              <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                <p>Sayın <strong>{name}</strong>,</p>
                <p><strong>Event4Network (E4N)</strong>, iş insanlarının bir araya gelerek güvene dayalı, sürdürülebilir iş ilişkileri kurduğu seçici bir networking platformudur.</p>
                <p>Klasik networking anlayışının aksine, yüzeysel tanışmalar yerine güçlü bağlar ve nitelikli iş yönlendirmeleri oluşturmayı hedeflemektedir.</p>
                <p>Sizleri de bu yapıyı yakından tanıyabileceğiniz online toplantımıza davet etmek isteriz.</p>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
                  <p style="margin: 5px 0;">📅 <strong>Tarih:</strong> {meeting_date}</p>
                  <p style="margin: 5px 0;">🕢 <strong>Saat:</strong> {meeting_time}</p>
                  <p style="margin: 5px 0;">🔗 <strong>Katılım Linki:</strong> <a href="{meeting_link}" style="color: #4f46e5;">{meeting_link}</a></p>
                </div>
                <p>Toplantımızda hem sistemi daha detaylı aktaracak hem de katılımcılarla birebir tanışma fırsatı bulabileceksiniz.</p>
                <p>Ayrıca öncesinde incelemek isterseniz:<br/>
                📱 <strong>Instagram:</strong> <a href="https://www.instagram.com/event4network/" style="color: #4f46e5;">https://www.instagram.com/event4network/</a></p>
                <p>Katılımınızı bekliyoruz.<br/>Görüşmek üzere.</p>
                <p>İyi günler dileriz.</p>
              </div>
            `;

            // Replace placeholders
            const html = template
              .replace(/{name}/g, v.name)
              .replace(/{group_name}/g, group.name)
              .replace(/{meeting_day}/g, group.meeting_day || '-')
              .replace(/{meeting_time}/g, group.meeting_time || '-')
              .replace(/{meeting_link}/g, group.meeting_link || '-')
              .replace(/{meeting_date}/g, nextDateStr);

            await sendEmail(v.email, subject, html);
          }
        } catch (insertError) {
          console.error('[VISITOR CONVERSION ERROR]:', insertError);
          throw new Error('Ziyaretçi işlemleri sırasında hata: ' + insertError.message);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[PUBLIC VISITOR STATUS UPDATE ERROR]:', e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});




// --- NOTIFICATIONS ---
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { console.error('Get Notifications Error:', e); res.status(500).json({ error: e.message }); }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = $1", [req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- LMS (E-Akademi) ---
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*, 
             (SELECT count(*)::int FROM lessons l WHERE l.course_id = c.id) as lesson_count,
             (SELECT count(*)::int FROM enrollments e WHERE e.course_id = c.id AND e.user_id = $1) as is_enrolled
      FROM courses c
      WHERE c.status = 'ACTIVE'
      ORDER BY c.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    if (courseRes.rows.length === 0) return res.status(404).json({ error: 'Course not found' });
    
    const lessonsRes = await pool.query('SELECT * FROM lessons WHERE course_id = $1 ORDER BY order_index ASC', [req.params.id]);
    
    res.json({
      ...courseRes.rows[0],
      lessons: lessonsRes.rows
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/lms/exams', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM exams ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- EMAIL CONFIGURATION ENDPOINTS ---

app.get('/api/admin/email-config', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    const { rows } = await pool.query('SELECT * FROM email_configurations ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/email-config', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { smtp_host, smtp_port, smtp_user, smtp_pass, sender_email, sender_name, is_active } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (is_active) {
      await client.query('UPDATE email_configurations SET is_active = FALSE');
    }

    const { rows } = await client.query(
      `INSERT INTO email_configurations (smtp_host, smtp_port, smtp_user, smtp_pass, sender_email, sender_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [smtp_host, smtp_port, smtp_user, smtp_pass, sender_email, sender_name, is_active || false]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.post('/api/admin/email-config/test', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { email } = req.body; // active config is used
  try {
    const result = await sendEmail(email, 'Test Email from Event4Network', '<p>This is a test email to verify SMTP settings.</p>');
    if (result.success) res.json({ success: true });
    else res.status(500).json({ error: result.error || 'Failed to send test email. Check server logs.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/admin/email-config/:id/activate', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE email_configurations SET is_active = FALSE');
    await client.query('UPDATE email_configurations SET is_active = TRUE WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// --- SYSTEM SETTINGS (Email Templates etc) ---
app.get('/api/admin/system-settings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    const { rows } = await pool.query('SELECT * FROM system_settings');
    const settings = rows.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json(settings);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/system-settings', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { key, value } = req.body;
  try {
    await pool.query(
      'INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      [key, value]
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Send Membership Invite to Visitor
app.post('/api/admin/visitors/:id/send-membership-invite', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Get visitor and group info
    const { rows } = await pool.query(`
      SELECT v.*, g.name as group_name 
      FROM visitors v 
      JOIN groups g ON v.group_id = g.id 
      WHERE v.id = $1
    `, [id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
    const v = rows[0];

    // 2. Get Template (Global fallback)
    const setRes = await pool.query("SELECT value FROM system_settings WHERE key = 'membership_invite_template'");
    let template = setRes.rows[0]?.value || `
      <h2>Üyelik Daveti</h2>
      <p>Sayın {name},</p>
      <p>{group_name} grubumuzdaki toplantımıza katılımınız için teşekkür ederiz.</p>
      <p>Sizi de E4N ailesinin bir parçası olarak görmekten mutluluk duyarız.</p>
    `;

    const html = template
      .replace(/{name}/g, v.name)
      .replace(/{group_name}/g, v.group_name);

    await sendEmail(v.email, 'Üyelik Daveti - Event4Network', html);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Visitor from Group
app.delete('/api/admin/visitors/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Get visitor to find group_id for auth check
    const vRes = await pool.query('SELECT group_id FROM visitors WHERE id = $1', [id]);
    if (vRes.rows.length === 0) return res.status(404).json({ error: 'Visitor not found' });
    const groupId = vRes.rows[0].group_id;

    // Auth check: ADMIN or PRESIDENT of this group
    if (req.user.role !== 'ADMIN') {
      const pRes = await pool.query(
        "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'PRESIDENT' AND status = 'ACTIVE'",
        [groupId, req.user.id]
      );
      if (pRes.rows.length === 0) return res.status(403).json({ error: 'Yetkisiz işlem' });
    }

    await pool.query('DELETE FROM visitors WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/email-config/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    await pool.query('DELETE FROM email_configurations WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- GROUP MANAGEMENT ENDPOINTS (ADDED) ---

// Create Group
app.post('/api/groups', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { name, meeting_day, meeting_time, meeting_link, status, meeting_dates } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO groups (name, meeting_day, meeting_time, meeting_link, status, meeting_dates) 
       VALUES ($1, $2::varchar, $3, $4, $5::varchar, $6::jsonb) RETURNING *`,
      [name, meeting_day, meeting_time, meeting_link, status || 'ACTIVE', JSON.stringify(meeting_dates || [])]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Group
app.put('/api/groups/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { name, meeting_day, meeting_time, meeting_link, status, meeting_dates, visitor_email_subject, visitor_email_template } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE groups SET name = $1, meeting_day = $2::varchar, meeting_time = $3, meeting_link = $4, status = $5::varchar, meeting_dates = $6::jsonb, visitor_email_subject = $7, visitor_email_template = $8
       WHERE id = $9 RETURNING *`,
      [name, meeting_day, meeting_time, meeting_link, status, JSON.stringify(meeting_dates || []), visitor_email_subject, visitor_email_template, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Group
app.delete('/api/groups/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});



// Group Activities (One-to-Ones for Group Manager)
app.get('/api/groups/:id/activities', authenticateToken, async (req, res) => {
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
app.get('/api/power-teams', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM power_teams ORDER BY name ASC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/power-teams', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { name, description } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO power_teams (name, description, status) VALUES ($1, $2, 'ACTIVE') RETURNING *`,
      [name, description]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/power-teams/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { name, description, status, visitor_email_subject, visitor_email_template } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE power_teams SET name = $1, description = $2, status = $3, visitor_email_subject = $4, visitor_email_template = $5
       WHERE id = $6 RETURNING *`,
      [name, description, status || 'ACTIVE', visitor_email_subject, visitor_email_template, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});


app.delete('/api/power-teams/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    await pool.query('DELETE FROM power_teams WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/power-teams/:id/members', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name as full_name, u.profession, u.email, u.role, u.performance_score, u.performance_color, 
       ptm.status, ptm.joined_at as created_at, ptm.role as group_title
       FROM power_team_members ptm 
       JOIN users u ON ptm.user_id = u.id 
       WHERE ptm.power_team_id = $1`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/power-teams/:id/referrals', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.*, g.name as from_member_name
       FROM referrals r
       JOIN users g ON r.giver_id = g.id
       JOIN power_team_members ptm ON g.id = ptm.user_id
       WHERE ptm.power_team_id = $1 AND ptm.status = 'ACTIVE'
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/power-teams/:id/synergy', authenticateToken, async (req, res) => {
  try {
    // Synergy requires receiver_id which is missing in current DB schema.
    // Returning empty array or dummy data until schema is fixed.
    /*
    const { rows } = await pool.query(`...`);
    res.json(rows);
    */
    res.json([]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/groups/:id/visitors', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT v.*, u.name as inviter_name 
       FROM visitors v 
       LEFT JOIN users u ON v.inviter_id = u.id 
       WHERE v.group_id = $1 
       ORDER BY v.visited_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/events/:id/attendance', authenticateToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.*, u.name, u.avatar, u.profession, u.name as member_name 
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
      `INSERT INTO group_members(group_id, user_id, status) VALUES($1, $2, 'REQUESTED') 
       ON CONFLICT(group_id, user_id) DO UPDATE SET status = 'REQUESTED'
RETURNING * `,
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
      `UPDATE group_members SET status = $1 WHERE group_id = $2 AND user_id = $3 RETURNING * `,
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
      `INSERT INTO power_team_members(power_team_id, user_id, status) VALUES($1, $2, 'REQUESTED') 
       ON CONFLICT(power_team_id, user_id) DO UPDATE SET status = 'REQUESTED'
RETURNING * `,
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
      `UPDATE power_team_members SET status = $1 WHERE power_team_id = $2 AND user_id = $3 RETURNING * `,
      [status, req.params.id, req.params.userId]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Remove Group Member (Reject/Kick)
app.delete('/api/groups/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    // Authorization check
    if (req.user.role !== 'ADMIN') {
      const isPresident = await pool.query(
        "SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2 AND role = 'PRESIDENT' AND status = 'ACTIVE'",
        [req.params.id, req.user.id]
      );
      if (isPresident.rows.length === 0) {
        return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' });
      }
    }

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
      WHERE role IN('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER', 'EDUCATION_COORDINATOR', 'VISITOR_HOST')
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
      INSERT INTO group_members(group_id, user_id, status, joined_at)
VALUES($1, $2, 'ACTIVE', NOW())
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

    // Insert new active group (or update if exists)
    await client.query(`
        INSERT INTO group_members(group_id, user_id, status, joined_at)
        VALUES($1, $2, 'ACTIVE', NOW())
        ON CONFLICT (group_id, user_id) 
        DO UPDATE SET status = 'ACTIVE', joined_at = NOW()
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

// Delete Member (Cascading)
app.delete('/api/admin/members/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { id } = req.params;

  // Protect key users
  // We can fetch user first to check email
  const checkRes = await pool.query('SELECT email FROM users WHERE id = $1', [id]);
  if (checkRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });

  const email = checkRes.rows[0].email;
  /* Protected Users Logic Removed as per Request */

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete Dependencies
    await client.query('DELETE FROM group_members WHERE user_id = $1', [id]);
    await client.query('DELETE FROM generated_leads WHERE user_id = $1', [id]);

    // Potentially handle Power Teams if table exists
    try { await client.query('DELETE FROM power_team_members WHERE user_id = $1', [id]); } catch (e) { }

    // Attendance
    await client.query('DELETE FROM attendance WHERE user_id = $1', [id]);

    // Visitors (invited by user)
    await client.query('DELETE FROM visitors WHERE inviter_id = $1', [id]);

    // Education
    await client.query('DELETE FROM education WHERE user_id = $1', [id]);

    // Champions
    try { await client.query('DELETE FROM champions WHERE user_id = $1', [id]); } catch (e) { }

    // Notifications
    try { await client.query('DELETE FROM notifications WHERE user_id = $1', [id]); } catch (e) { }

    // Support & Messages
    await safeDelete('ticket_messages', 'DELETE FROM ticket_messages WHERE sender_id = $1', [id]);
    await safeDelete('tickets', 'DELETE FROM tickets WHERE user_id = $1', [id]);
    await safeDelete('messages', 'DELETE FROM messages WHERE sender_id = $1', [id]);

    // Scoring & Revenue
    await safeDelete('user_score_history', 'DELETE FROM user_score_history WHERE user_id = $1', [id]);
    await safeDelete('revenue_entries', 'DELETE FROM revenue_entries WHERE user_id = $1', [id]);

    // Referrals (Giver or Receiver)
    try {
      await client.query('SAVEPOINT sp_referrals');
      console.log('Fix: Deleting Referrals (giver only)');
      await client.query('DELETE FROM referrals WHERE giver_id = $1', [id]);
      await client.query('RELEASE SAVEPOINT sp_referrals');
    } catch (e) {
      await client.query('ROLLBACK TO SAVEPOINT sp_referrals');
      console.warn('Referral Delete Failed (Ignored):', e.message);
    }

    // One-to-Ones
    await client.query('DELETE FROM one_to_ones WHERE requester_id = $1 OR partner_id = $1', [id]);

    // Friend Requests
    try {
      await client.query('SAVEPOINT sp_friend_requests');
      console.log('Fix: Deleting FriendReqs (sender only)');
      await client.query('DELETE FROM friend_requests WHERE sender_id = $1', [id]);
      await client.query('RELEASE SAVEPOINT sp_friend_requests');
    } catch (e) {
      await client.query('ROLLBACK TO SAVEPOINT sp_friend_requests');
      console.warn('FriendReq Delete Failed (Ignored):', e.message);
    }

    // Update Events created by user to NULL
    await client.query('UPDATE events SET created_by = NULL WHERE created_by = $1', [id]);

    // 2. Finally Delete User
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Üye başarıyla silindi.' });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Delete Member Error:', e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Helper: Send Notification (Mock + DB)
// Helper: Send Notification (DB + Email)
const sendNotification = async (userId, title, message) => {
  console.log(`[NOTIFICATION] To: ${userId} | Subject: ${title} `);
  try {
    // 1. Insert In-App Notification
    await pool.query(
      `INSERT INTO notifications(user_id, type, content, is_read) VALUES($1, 'SYSTEM', $2, false)`,
      [userId, `${title}: ${message} `]
    );

    // 2. Fetch User Email & Send
    const res = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (res.rows.length > 0 && res.rows[0].email) {
      await sendEmail(res.rows[0].email, title, `<p>${message}</p>`);
    }

  } catch (err) {
    console.error('Notification/Email failed', err);
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
    const triggers = [3, 1, -1, -3, -5];

    for (const user of rows) {
      const endDate = new Date(user.subscription_end_date);
      const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysLeft = Math.round((endMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

      if (triggers.includes(daysLeft) && user.last_reminder_trigger !== daysLeft) {
        let title = '';
        let message = '';
        
        if (daysLeft > 0) {
          title = 'Üyelik Ödeme Hatırlatması';
          message = `Sayın ${user.name}, üyeliğinizin bitmesine ${daysLeft} gün kaldı. Hesabınızın kısıtlanmaması için lütfen en kısa sürede dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi gerçekleştiriniz.`;
        } else {
          const overdue = Math.abs(daysLeft);
          title = 'Gecikmiş Üyelik Ödemesi Uyarısı';
          message = `Sayın ${user.name}, üyeliğinizin süresi dolalı ${overdue} gün olmuştur. Hizmetlerinizin kesilmemesi için lütfen acilen dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi tamamlayınız.`;
        }

        await sendNotification(user.id, title, message);
        await pool.query('UPDATE users SET last_reminder_trigger = $1 WHERE id = $2', [daysLeft, user.id]);
      }
    }
  } catch (e) {
    console.error('Daily check error:', e);
  }
});



// Get Champions
app.get('/api/champions', authenticateToken, async (req, res) => {
  try {
    // Return the latest entry for each (Period x Metric) tuple
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (c.period_type, c.metric_type) 
        c.*, u.name as user_name, u.profession, COALESCE(u.company, 'Şirket Belirtilmemiş') as company_name 
      FROM champions c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.period_type, c.metric_type, c.period_date DESC
    `);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/admin/trigger-champions', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  // Manual trigger for testing/demo
  const today = new Date();
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
  await calculateChampions('WEEK', weekStart.toISOString(), today.toISOString());

  // Last month
  const start = new Date(); start.setMonth(start.getMonth() - 1); start.setDate(1);
  const end = new Date(); end.setDate(0); // Last day of prev month
  await calculateChampions('MONTH', start.toISOString(), end.toISOString());

  // For manual now, just calculate current month as month
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  await calculateChampions('MONTH', currentMonthStart.toISOString(), today.toISOString());

  // Year
  const yearStart = new Date(today.getFullYear(), 0, 1);
  await calculateChampions('YEAR', yearStart.toISOString(), today.toISOString());

  res.json({ success: true });
});

// Assign Role
app.post('/api/admin/assign-role', authenticateToken, async (req, res) => {
  const { userId, role, groupTitle, contextId, type } = req.body;
  
  if (req.user.role !== 'ADMIN') {
    if (!contextId) return res.sendStatus(403);
    
    // Check if the requester is the president of this context
    if (type === 'POWER_TEAM') {
      const checkPt = await pool.query("SELECT role FROM power_team_members WHERE user_id = $1 AND power_team_id = $2", [req.user.id, contextId]);
      if (checkPt.rows.length === 0 || checkPt.rows[0].role !== 'PRESIDENT') {
        return res.sendStatus(403);
      }
    } else {
      // type === 'GROUP'
      const checkGrp = await pool.query(`
        SELECT u.role, u.group_title 
        FROM group_members gm 
        JOIN users u ON u.id = gm.user_id 
        WHERE gm.group_id = $1 AND gm.user_id = $2 AND gm.status = 'ACTIVE'
      `, [contextId, req.user.id]);
      
      if (checkGrp.rows.length === 0 || (checkGrp.rows[0].role !== 'PRESIDENT' && checkGrp.rows[0].group_title !== 'PRESIDENT')) {
        return res.sendStatus(403);
      }
    }
  }

  try {
    if (type === 'POWER_TEAM' && contextId) {
      // 1. Check if member
      const check = await pool.query('SELECT * FROM power_team_members WHERE user_id = $1 AND power_team_id = $2', [userId, contextId]);

      if (check.rows.length === 0) {
        // Add member with role
        await pool.query(
          'INSERT INTO power_team_members (user_id, power_team_id, status, role) VALUES ($1, $2, \'ACTIVE\', $3)',
          [userId, contextId, groupTitle]
        );
      } else {
        // Update existing
        await pool.query(
          'UPDATE power_team_members SET role = $1 WHERE user_id = $2 AND power_team_id = $3',
          [groupTitle, userId, contextId]
        );
      }
    } else {
      // Legacy behavior for Groups
      console.log(`[ASSIGN-ROLE] Group Context. User: ${userId}, Role: ${role}, Title: ${groupTitle}, Ctx: ${contextId}`);

      // If we are in a specific Group context (contextId is provided and type is GROUP), 
      // ensure the user is a member of that group.
      if (type === 'GROUP' && contextId) {
        // Check membership
        const checkMember = await pool.query('SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2', [contextId, userId]);
        if (checkMember.rows.length === 0) {
          console.log(`[ASSIGN-ROLE] Adding user ${userId} to group ${contextId}`);
          await pool.query(
            "INSERT INTO group_members (group_id, user_id, status, joined_at) VALUES ($1, $2, 'ACTIVE', NOW())",
            [contextId, userId]
          );
        } else {
          // If member exists but inactive, reactivate?
          if (checkMember.rows[0].status !== 'ACTIVE') {
            console.log(`[ASSIGN-ROLE] Reactivating user ${userId} in group ${contextId}`);
            await pool.query("UPDATE group_members SET status = 'ACTIVE' WHERE group_id = $1 AND user_id = $2", [contextId, userId]);
          }
        }
      }

      if (groupTitle !== undefined) {
        console.log(`[ASSIGN-ROLE] Updating User Table: Role=${role}, Title=${groupTitle}`);
        await pool.query('UPDATE users SET role = $1, group_title = $2 WHERE id = $3', [role, groupTitle, userId]);
      } else {
        console.log(`[ASSIGN-ROLE] Updating User Table: Role=${role}`);
        await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);
      }
    }

    res.json({ success: true });
  } catch (e) {
    console.error('[ASSIGN-ROLE] Error:', e);
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
      return {
        ...r,
        user_id: r.id, // CRITICAL FIX: Frontend store relies on user_id to find the membership
        status: status || 'ACTIVE',
        end_date: r.subscription_end_date,
        plan: r.subscription_plan
      };
    });

    res.json(validatedRows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create Membership (Start Subscription)
app.post('/api/memberships', authenticateToken, async (req, res) => {
  const { user_id, plan, start_date } = req.body;

  // Calculate end date based on plan
  const start = start_date ? new Date(start_date) : new Date();
  const end = new Date(start);

  if (plan === '12_MONTHS') end.setMonth(end.getMonth() + 12);
  else if (plan === '8_MONTHS') end.setMonth(end.getMonth() + 8);
  else if (plan === '1_MONTH') end.setMonth(end.getMonth() + 1);
  else end.setMonth(end.getMonth() + 4); // Default 4

  try {
    const { rows } = await pool.query(`
      UPDATE users 
      SET subscription_plan = $1, 
          subscription_end_date = $2, 
          account_status = 'ACTIVE',
          last_reminder_trigger = NULL
      WHERE id = $3
      RETURNING id, name, email, subscription_plan, subscription_end_date, account_status
    `, [plan, end.toISOString(), user_id]);

    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];

    // Return a "Membership" object format expected by frontend
    const membership = {
      id: user.id, // Using user_id as membership_id for 1-to-1 mapping simplicity
      user_id: user.id,
      plan: user.subscription_plan,
      status: user.account_status,
      start_date: start.toISOString(), // We don't store start_date explicitly in users table, but frontend needs it
      end_date: user.subscription_end_date,
      last_renewal_date: new Date().toISOString()
    };

    res.status(201).json(membership);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update Membership (Renew/Edit)
app.put('/api/memberships/:id', authenticateToken, async (req, res) => {
  // :id is the membership_id, which we mapped to user_id
  const userId = req.params.id;
  const { plan, end_date, status } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (plan) { fields.push(`subscription_plan = $${idx++}`); values.push(plan); }
    if (end_date) { fields.push(`subscription_end_date = $${idx++}`); values.push(end_date); }
    if (status) { fields.push(`account_status = $${idx++}`); values.push(status); }

    if (fields.length > 0) {
      values.push(userId);
      await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    // Return the updated "virtual" membership
    const { rows } = await pool.query('SELECT subscription_plan, subscription_end_date, account_status FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];

    const membership = {
      id: userId,
      user_id: userId,
      plan: user.subscription_plan,
      status: user.account_status,
      start_date: new Date().toISOString(), // Mock
      end_date: user.subscription_end_date
    };

    res.json(membership);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Extend/Update Membership (Admin Specific Tool)
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
    } else if (months && [1, 6, 12].includes(months)) {
      const currentEnd = rows[0].subscription_end_date ? new Date(rows[0].subscription_end_date) : new Date();
      const now = new Date();
      const effectiveStart = (currentEnd > now) ? currentEnd : now;
      newEnd = new Date(effectiveStart);
      newEnd.setMonth(newEnd.getMonth() + months);
      if (!newPlan) {
        newPlan = months === 12 ? '12_MONTHS' : months === 6 ? '6_MONTHS' : '1_MONTH';
      }
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

// Manual Membership Reminder
app.post('/api/memberships/:id/remind', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const userId = req.params.id;
  try {
    const { rows } = await pool.query('SELECT name, email, subscription_end_date FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = rows[0];
    const endDate = user.subscription_end_date ? new Date(user.subscription_end_date) : null;
    let message = '';
    let title = 'Üyelik Ödeme Hatırlatması';
    
    if (endDate) {
      const now = new Date();
      const endMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysLeft = Math.round((endMidnight - nowMidnight) / (1000 * 60 * 60 * 24));
      
      if (daysLeft > 0) {
        message = `Sayın ${user.name}, üyeliğinizin bitmesine ${daysLeft} gün kaldı. Hesabınızın kısıtlanmaması için lütfen en kısa sürede dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi gerçekleştiriniz.`;
      } else {
        const overdue = Math.abs(daysLeft);
        title = 'Gecikmiş Üyelik Ödemesi Uyarısı';
        message = `Sayın ${user.name}, üyeliğinizin süresi dolalı ${overdue} gün olmuştur. Hizmetlerinizin kesilmemesi için lütfen acilen dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi tamamlayınız.`;
      }
    } else {
      message = `Sayın ${user.name}, üyeliğinizin ödeme dönemi yaklaşmaktadır. Lütfen dashboard üzerindeki Üyelik İşlemleri sayfasından ödemenizi gerçekleştiriniz.`;
    }
    
    await sendNotification(userId, title, message);
    res.json({ success: true, message: 'Hatırlatma başarıyla gönderildi.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Accounting: Get Payments (Visitors & Members)
app.get('/api/admin/accounting/payments', authenticateToken, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  try {
    const visitorsQuery = `
      SELECT 
        pv.id, 
        pv.name, 
        pv.email, 
        pv.phone, 
        pv.company, 
        pv.profession, 
        pv.created_at, 
        'VISITOR' as type, 
        COALESCE((pv.form_data->>'payment_amount')::float, 1000.00) as amount, 
        pv.invoice_url, 
        pv.invoice_issued, 
        pv.form_data->>'tax_number' as tax_number, 
        pv.form_data->>'address' as billing_address,
        e.title as event_title
      FROM public_visitors pv
      LEFT JOIN events e ON pv.event_id = e.id
      WHERE pv.kvkk_accepted = true 
        AND (pv.source = 'visitor_payment' AND pv.form_data->>'payment_status' = 'PAID')
    `;

    const membersQuery = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.company, 
        u.profession, 
        u.created_at, 
        'MEMBER' as type, 
        u.subscription_plan as plan, 
        u.subscription_invoice_url as invoice_url, 
        u.subscription_invoice_issued as invoice_issued, 
        u.tax_number, 
        u.tax_office, 
        u.billing_address
      FROM users u
      WHERE u.subscription_plan IS NOT NULL 
        AND u.subscription_end_date IS NOT NULL
    `;

    const visitors = await pool.query(visitorsQuery);
    const members = await pool.query(membersQuery);

    const mappedMembers = members.rows.map(m => {
      let amount = 6000;
      if (m.plan === '1_MONTH') amount = 7200;
      else if (m.plan === '6_MONTHS') amount = 39000;
      else if (m.plan === '12_MONTHS') amount = 69000;
      return { ...m, amount };
    });

    const allPayments = [...visitors.rows, ...mappedMembers].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(allPayments);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Accounting: Upload Invoice and Email User
app.post('/api/admin/accounting/:type/:id/upload-invoice', authenticateToken, upload.single('invoice'), async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.sendStatus(403);
  const { type, id } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'Lütfen bir fatura dosyası yükleyiniz.' });
  }

  try {
    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;
    let user = null;

    if (type === 'VISITOR') {
      const { rows } = await pool.query('SELECT name, email FROM public_visitors WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Ziyaretçi kaydı bulunamadı.' });
      user = rows[0];
      await pool.query('UPDATE public_visitors SET invoice_url = $1, invoice_issued = true WHERE id = $2', [fileUrl, id]);
    } else if (type === 'MEMBER') {
      const { rows } = await pool.query('SELECT name, email FROM users WHERE id = $1', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Üye kaydı bulunamadı.' });
      user = rows[0];
      await pool.query('UPDATE users SET subscription_invoice_url = $1, subscription_invoice_issued = true WHERE id = $2', [fileUrl, id]);
    } else {
      return res.status(400).json({ error: 'Geçersiz kayıt tipi.' });
    }

    // Send email with attachment
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #f1f5f9; rounded: 12px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Faturanız Hazır</h2>
        <p>Sayın <strong>${user.name}</strong>,</p>
        <p>Event4Network üzerinden yapmış olduğunuz ödemenize ait faturanız kesilmiştir. Fatura belgeniz bu e-postanın ekinde yer almaktadır.</p>
        <p>Bizimle iş birliği yaptığınız için teşekkür ederiz.</p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">Bu e-posta otomatik bir bildirimdir, lütfen cevap vermeyiniz.</p>
      </div>
    `;

    const cleanName = user.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    await sendEmail(user.email, 'Event4Network - Ödeme Faturanız', emailHtml, [
      {
        filename: `fatura-${cleanName}-${Date.now()}.pdf`,
        path: filePath
      }
    ]);

    res.json({ success: true, invoice_url: fileUrl });
  } catch (e) {
    console.error('Invoice Upload/Email Error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* --- LMS Endpoints (Keep existing logic mostly) --- */
app.get('/api/lms/courses', authenticateToken, async (req, res) => {
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
            WHERE status = 'SUCCESSFUL' AND updated_at > NOW() - INTERVAL '6 months'
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
            LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.status = 'ACTIVE'
            LEFT JOIN referrals r ON r.giver_id = gm.user_id AND r.status = 'SUCCESSFUL'
            LEFT JOIN visitors v ON v.group_id = g.id
            LEFT JOIN users u ON u.id = gm.user_id
            LEFT JOIN one_to_ones o ON(o.requester_id = u.id OR o.partner_id = u.id)
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


/* --- PAYMENT ENDPOINTS (REMOVED) --- */

// --- SUPPORT TICKET SYSTEM ---

// Update Schema for Tickets
pool.query(`
    CREATE TABLE IF NOT EXISTS tickets(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN', --OPEN, ANSWERED, CLOSED
        created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

    CREATE TABLE IF NOT EXISTS ticket_messages(
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
        WHERE 1 = 1
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
      `INSERT INTO tickets(user_id, subject, status) VALUES($1, $2, 'OPEN') RETURNING * `,
      [req.user.id, subject]
    );
    const ticketId = ticketRes.rows[0].id;

    // Create First Message
    await client.query(
      `INSERT INTO ticket_messages(ticket_id, sender_id, message) VALUES($1, $2, $3)`,
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
        `INSERT INTO ticket_messages(ticket_id, sender_id, message) VALUES($1, $2, $3)`,
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






const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Export for Vercel
export default app;

// Serve Frontend in Production or specific dev setup
// Serve Frontend in Production (BUT NOT ON VERCEL)
// Vercel handles static serving and rewrites via vercel.json
if ((process.env.NODE_ENV === 'production' || process.env.SERVE_FRONTEND === 'true') && !process.env.VERCEL) {
  const distPath = path.join(__dirname, '../../dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    // Exclude API routes just in case, though they are defined above
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  });
}

// Conditional Listen
(async () => {
  try {
    await runMigrations();
    console.log('✅ Migrations completed.');
  } catch (e) {
    console.error('⚠️ Migration Warning (non-fatal):', e.message);
  }

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
})();
