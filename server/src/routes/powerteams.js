import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// List Power Teams
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM power_teams ORDER BY name ASC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create Power Team
router.post('/', authenticateToken, async (req, res) => {
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

// Delete Power Team
router.delete('/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'ADMIN') return res.sendStatus(403);
    try {
        await pool.query('DELETE FROM power_teams WHERE id = $1', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get Members
router.get('/:id/members', authenticateToken, async (req, res) => {
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

// Get Referrals
router.get('/:id/referrals', authenticateToken, async (req, res) => {
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

// Synergy
router.get('/:id/synergy', authenticateToken, async (req, res) => {
    try {
        // Synergy requires receiver_id which is missing in current DB schema.
        // Returning empty array or dummy data until schema is fixed.
        res.json([]);
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

// Update Member Status
router.put('/:id/members/:userId', authenticateToken, async (req, res) => {
    const { status } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE power_team_members SET status = $1 WHERE power_team_id = $2 AND user_id = $3 RETURNING * `,
            [status, req.params.id, req.params.userId]
        );
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Remove Member
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM power_team_members WHERE power_team_id = $1 AND user_id = $2`,
            [req.params.id, req.params.userId]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
