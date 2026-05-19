import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Professions
router.get('/professions', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM professions ORDER BY name ASC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/professions/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM professions WHERE id = $1", [req.params.id]);
        res.sendStatus(204);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Public Visitor Application
router.post('/visitors/apply', async (req, res) => {
    const { name, email, phone, company, profession, source, kvkk_accepted, inviter_id, title, web_linkedin, activity_area, duration, target_customer, why_join, value_add, previous_groups } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO public_visitors (name, email, phone, company, profession, source, kvkk_accepted, inviter_id, title, web_linkedin, activity_area, duration, target_customer, why_join, value_add, previous_groups) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
            [name, email, phone, company, profession, source || 'web', kvkk_accepted || false, inviter_id || null, title || null, web_linkedin || null, activity_area || null, duration || null, target_customer || null, why_join || null, value_add || null, previous_groups || null]
        );
        res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// LMS Courses
router.get('/lms/courses', authenticateToken, async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM courses WHERE status=$1', ['ACTIVE']); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }) }
});

router.get('/lms/exams', authenticateToken, async (req, res) => {
    try {
        // Logic for exams. Returning empty list as placeholder
        res.json([]);
    } catch (e) { res.json([]); }
});

export default router;
