import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/traffic-lights', authenticateToken, async (req, res) => {
    try {
        let query = `SELECT id, name, profession, performance_score as score, performance_color as color FROM users WHERE 1=1`;
        let params = [];
        query += ` ORDER BY performance_score DESC`;

        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/attendance-stats', authenticateToken, async (req, res) => {
    try {
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

router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const memberCount = (await pool.query('SELECT count(*) FROM users')).rows[0].count;
        const groupCount = (await pool.query('SELECT count(*) FROM groups')).rows[0].count;
        const ptCount = (await pool.query('SELECT count(*) FROM power_teams')).rows[0].count;
        const eventCount = (await pool.query('SELECT count(*) FROM events')).rows[0].count;
        const visitorCount = (await pool.query('SELECT count(*) FROM visitors')).rows[0].count;
        const oneToOneCount = (await pool.query('SELECT count(*) FROM one_to_ones')).rows[0].count;

        let totalRevenue = 0;
        try {
            const revRes = await pool.query('SELECT SUM(amount) as total FROM revenue_entries');
            totalRevenue = parseFloat(revRes.rows[0].total || 0);
        } catch { }

        res.json({
            totalRevenue: totalRevenue,
            internalRevenue: totalRevenue * 0.7,
            externalRevenue: totalRevenue * 0.3,
            totalMembers: parseInt(memberCount),
            lostMembers: 0,
            totalGroups: parseInt(groupCount),
            totalPowerTeams: parseInt(ptCount),
            totalEvents: parseInt(eventCount),
            totalVisitors: parseInt(visitorCount),
            totalOneToOnes: parseInt(oneToOneCount),
            visitorConversionRate: 20
        });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/charts', authenticateToken, async (req, res) => {
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

export default router;
