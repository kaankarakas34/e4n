import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import { calculateChampions } from '../utils/scoring.js';

const router = express.Router();

// Middleware: Verify Admin
router.use((req, res, next) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    next();
});

// Member Management
router.get('/members', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
              u.id, u.name, u.email, u.phone, u.city, u.profession, u.role, u.created_at,
              u.performance_score, u.performance_color,
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

router.post('/move-member', async (req, res) => {
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

// Email Configuration
router.get('/email-config', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM email_configurations ORDER BY created_at DESC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/email-config', async (req, res) => {
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

router.post('/email-config/test', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await sendEmail(email, 'Test Email from Event4Network', '<p>This is a test email to verify SMTP settings.</p>');
        if (result.success) res.json({ success: true });
        else res.status(500).json({ error: result.error || 'Failed to send test email. Check server logs.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.put('/email-config/:id/activate', async (req, res) => {
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

router.delete('/email-config/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM email_configurations WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stats & Dashboard
router.get('/stats/dashboard', async (req, res) => {
    try {
        // Queries...
        // To match original exactly we need complex queries.
        // For brevity I'll copy logic.
        const totalGroups = (await pool.query("SELECT COUNT(*) FROM groups WHERE status = 'ACTIVE'")).rows[0].count;
        const totalPowerTeams = (await pool.query("SELECT COUNT(*) FROM power_teams WHERE status = 'ACTIVE'")).rows[0].count;
        const totalMembers = (await pool.query("SELECT COUNT(*) FROM users WHERE role != 'ADMIN'")).rows[0].count;

        const revenueRes = await pool.query("SELECT SUM(amount) as total, SUM(CASE WHEN type='INTERNAL' THEN amount ELSE 0 END) as internal, SUM(CASE WHEN type='EXTERNAL' THEN amount ELSE 0 END) as external FROM referrals WHERE status='SUCCESSFUL'");
        const totalRevenue = revenueRes.rows[0].total || 0;
        const internalRevenue = revenueRes.rows[0].internal || 0;
        const externalRevenue = revenueRes.rows[0].external || 0;

        const totalOneToOnes = (await pool.query("SELECT COUNT(*) FROM one_to_ones WHERE status = 'COMPLETED'")).rows[0].count;
        const totalVisitors = (await pool.query("SELECT COUNT(*) FROM visitors")).rows[0].count;
        const totalEvents = (await pool.query("SELECT COUNT(*) FROM events")).rows[0].count;

        const convertedVisitors = (await pool.query("SELECT COUNT(*) FROM visitors WHERE status = 'JOINED'")).rows[0].count;
        const visitorConversionRate = parseInt(totalVisitors) > 0 ? (parseInt(convertedVisitors) / parseInt(totalVisitors)) * 100 : 0;

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

router.get('/stats/charts', async (req, res) => {
    try {
        const revenueTrend = await pool.query(`
            SELECT TO_CHAR(updated_at, 'Mon') as name, SUM(amount) as value 
            FROM referrals 
            WHERE status = 'SUCCESSFUL' AND updated_at > NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(updated_at, 'Mon'), DATE_TRUNC('month', updated_at) 
            ORDER BY DATE_TRUNC('month', updated_at)
  `);

        const memberGrowth = await pool.query(`
            SELECT TO_CHAR(created_at, 'Mon') as name, COUNT(*) as value
            FROM users
            WHERE role != 'ADMIN' AND created_at > NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
            ORDER BY DATE_TRUNC('month', created_at)
  `);

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

router.get('/stats/groups', async (req, res) => {
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

router.get('/stats/geo', async (req, res) => {
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

// Public Visitors Management (Admin)
router.get('/public-visitors', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM public_visitors ORDER BY created_at DESC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/public-visitors/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE public_visitors SET status = $1 WHERE id = $2', [status, req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Manual Triggers
router.post('/trigger-champions', async (req, res) => {
    const today = new Date();
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7);
    await calculateChampions('WEEK', weekStart.toISOString(), today.toISOString());
    res.json({ success: true, message: 'Champions calculation triggered.' });
});

// Shuffle Save
router.post('/shuffle/save', async (req, res) => {
    const { assignments } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Reset LEADERSHIP roles
        await client.query(`
      UPDATE users 
      SET role = 'MEMBER' 
      WHERE role IN('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER', 'EDUCATION_COORDINATOR', 'VISITOR_HOST')
  `);

        // 2. Archive ALL existing active group memberships
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

// Manual Membership Extension
router.post('/memberships/extend', async (req, res) => {
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
            if (!newPlan) newPlan = `${months} _MONTHS`;
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

export default router;
