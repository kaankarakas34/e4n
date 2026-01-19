import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// List Groups
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
        SELECT g.*, count(gm.id):: int as member_count 
        FROM groups g 
        LEFT JOIN group_members gm ON g.id = gm.group_id
        GROUP BY g.id
        ORDER BY g.name ASC
      `);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create Group
router.post('/', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { name, meeting_day, meeting_time, meeting_link, status } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO groups (name, meeting_day, meeting_time, meeting_link, status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, meeting_day, meeting_time, meeting_link, status || 'ACTIVE']
        );
        res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get Group Members
router.get('/:id/members', authenticateToken, async (req, res) => {
    try {
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

// Update Group
router.put('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    const { name, meeting_day, meeting_time, meeting_link, status } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE groups SET name = $1, meeting_day = $2, meeting_time = $3, meeting_link = $4, status = $5 
       WHERE id = $6 RETURNING *`,
            [name, meeting_day, meeting_time, meeting_link, status, req.params.id]
        );
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Group
router.delete('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        await pool.query('DELETE FROM groups WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Join Request
router.post('/:id/join', authenticateToken, async (req, res) => {
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

// Update Member Status
router.put('/:id/members/:userId', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE group_members SET status = $1 WHERE group_id = $2 AND user_id = $3 RETURNING * `,
            [status, req.params.id, req.params.userId]
        );
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Remove Member
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM group_members WHERE group_id = $1 AND user_id = $2`,
            [req.params.id, req.params.userId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Sub-Resources
router.get('/:id/referrals', authenticateToken, async (req, res) => {
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

router.get('/:id/events', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
        SELECT e.*,
          (SELECT COUNT(*) FROM attendance a WHERE a.event_id = e.id AND a.status = 'PRESENT') as attendee_count
        FROM events e
        WHERE e.group_id = $1
        ORDER BY e.start_at DESC
      `, [req.params.id]);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/activities', authenticateToken, async (req, res) => {
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

router.get('/:id/visitors', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT v.*, u.name as inviter_name 
         FROM visitors v 
         JOIN users u ON v.inviter_id = u.id 
         WHERE v.group_id = $1 
         ORDER BY v.visited_at DESC`,
            [req.params.id]
        );
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/:id/substitutes', authenticateToken, async (req, res) => {
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

export default router;
