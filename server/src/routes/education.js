import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import { calculateMemberScore } from '../utils/scoring.js';

const router = express.Router();

// Get My Education History
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM education WHERE user_id = $1 ORDER BY completed_date DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add Education Entry
router.post('/', authenticateToken, async (req, res) => {
    const { title, hours, date } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO education(user_id, title, hours, completed_date)
       VALUES($1, $2, $3, $4) RETURNING *`,
            [req.user.id, title, hours, date]
        );
        // Recalculate Score
        await calculateMemberScore(req.user.id);

        res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Education Entry
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM education WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
        await calculateMemberScore(req.user.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
