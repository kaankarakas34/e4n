import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import { calculateMemberScore } from '../utils/scoring.js';

const router = express.Router();

// Get My One-to-Ones
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT o.*, 
       CASE 
         WHEN requester_id = $1 THEN u2.name 
         ELSE u1.name 
       END as partner_name,
       CASE 
         WHEN requester_id = $1 THEN u2.profession 
         ELSE u1.profession 
       END as partner_profession
       FROM one_to_ones o
       JOIN users u1 ON o.requester_id = u1.id
       JOIN users u2 ON o.partner_id = u2.id
       WHERE o.requester_id = $1 OR o.partner_id = $1
       ORDER BY o.meeting_date DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create One-to-One
router.post('/', authenticateToken, async (req, res) => {
    const { partnerId, date, notes } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO one_to_ones(requester_id, partner_id, meeting_date, notes, status)
       VALUES($1, $2, $3, $4, 'COMPLETED') RETURNING *`,
            [req.user.id, partnerId, date, notes]
        );
        // Recalculate Score (For BOTH?)
        // Usually only requester gets point? Or both?
        // Definition: "1-1 Toplantı" -> Both parties participated?
        // Current logic is to update requester. Often usually updates both.
        // Let's update both for safety if business rule implies mutual benefit.
        // Assuming requester is the 'active' logger.
        await calculateMemberScore(req.user.id);
        await calculateMemberScore(partnerId);

        res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update One-to-One
router.put('/:id', authenticateToken, async (req, res) => {
    const { date, notes } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE one_to_ones SET meeting_date = $1, notes = $2 WHERE id = $3 AND requester_id = $4 RETURNING *`,
            [date, notes, req.params.id, req.user.id]
        );
        if (rows.length > 0) {
            // Recalculate if date changed involved filtering?
            // Just simple recalc
            const o = rows[0];
            await calculateMemberScore(req.user.id);
            await calculateMemberScore(o.partner_id); // partner too
        }
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete One-to-One
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Get details first to know who to recalc
        const check = await pool.query('SELECT * FROM one_to_ones WHERE id = $1', [req.params.id]);
        if (check.rows.length === 0) return res.json({ success: true });
        const { requester_id, partner_id } = check.rows[0];

        // Verify ownership
        if (requester_id !== req.user.id && req.user.role !== 'ADMIN') {
            return res.sendStatus(403);
        }

        await pool.query('DELETE FROM one_to_ones WHERE id = $1', [req.params.id]);

        await calculateMemberScore(requester_id);
        await calculateMemberScore(partner_id);

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
