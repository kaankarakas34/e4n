import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';
import { calculateMemberScore } from '../utils/scoring.js';

const router = express.Router();

// Get Visitors (for me?)
// Original user logic for 'My Visitors' was missing or implicit?
// Ah, `app.get('/api/users/:id/attendance')` was there.
// But `app.get('/api/visitors')`?
// Let's create general visitor management for users.

// Get Visitors I invited
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT v.*, u.name as inviter_name 
           FROM visitors v 
           JOIN users u ON v.inviter_id = u.id 
           WHERE v.inviter_id = $1 
           ORDER BY v.visited_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add Visitor
router.post('/', authenticateToken, async (req, res) => {
    const { name, email, phone, company, profession, visited_at, group_id } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO visitors(inviter_id, name, email, phone, company, profession, visited_at, group_id, status)
             VALUES($1, $2, $3, $4, $5, $6, $7, $8, 'INVITED') RETURNING *`,
            [req.user.id, name, email, phone, company, profession, visited_at, group_id]
        );
        // Recalc
        await calculateMemberScore(req.user.id);
        res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update Visitor
router.put('/:id', authenticateToken, async (req, res) => {
    const { status, visited_at } = req.body;
    try {
        const { rows } = await pool.query(
            `UPDATE visitors SET status = COALESCE($1, status), visited_at = COALESCE($2, visited_at) WHERE id = $3 AND inviter_id = $4 RETURNING *`,
            [status, visited_at, req.params.id, req.user.id]
        );
        await calculateMemberScore(req.user.id);
        res.json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create Public Application (Unauthenticated) -> MOVED TO COMMON.js as /api/visitors/apply?
// Wait, my index.js mounts this router to `/api/visitors`.
// common.js has `/visitors/apply` which mounts to `/api/visitors/apply`? 
// No, common.js is mounted to `/api`. So `/api/visitors/apply` works.
// This is fine.

export default router;
