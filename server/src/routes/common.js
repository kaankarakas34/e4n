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
    const { name, email, phone, company, profession, source, kvkk_accepted } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO public_visitors (name, email, phone, company, profession, source, kvkk_accepted) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, email, phone, company, profession, source || 'web', kvkk_accepted || false]
        );
        res.status(201).json(rows[0]);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// LMS Courses
router.get('/lms/courses', authenticateToken, async (req, res) => {
    try { const { rows } = await pool.query('SELECT * FROM courses WHERE status=$1', ['ACTIVE']); res.json(rows); } catch (e) { res.status(500).json({ error: e.message }) }
});

export default router;
