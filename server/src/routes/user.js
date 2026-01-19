import express from 'express';
import pool from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

router.get('/friends', authenticateToken, async (req, res) => {
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

router.get('/groups', authenticateToken, async (req, res) => {
    // It handles ?userId param or uses req.user.id?
    // Original: const { userId } = req.query; if mock ID return empty.
    // But wait, the path is /user/groups, usually implying "my groups".
    // However original code allowed userId query param.
    // There was TWO endpoints in original code:
    // 1. app.get('/api/user/groups', ...) lines 1587 (took query userId)
    // 2. app.get('/api/user/groups', ...) lines 2226 (took req.user.id)
    // That looks like duplicate definition in original file! 
    // The second one (line 2226) likely overwrote the first one or Express ignored the second?
    // Express executes the first match.
    // The first one (1587) was unauthenticated originally (before my fix in step 1109).
    // I will implement the one that uses `req.user.id` by default if no query param, OR restrict query param to admin?
    // Let's stick to "My Groups" for `/api/user/groups`.

    try {
        const { rows } = await pool.query(`
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1 AND gm.status = 'ACTIVE'
  `, [req.user.id]);
        res.json(rows);
    } catch (e) {
        // If syntax error (mock ID), return empty
        res.json([]);
    }
});

router.get('/power-teams', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
        SELECT pt.*
      FROM power_teams pt
        JOIN power_team_members ptm ON pt.id = ptm.power_team_id
        WHERE ptm.user_id = $1 AND ptm.status = 'ACTIVE'
      `, [req.user.id]);
        res.json(rows);
    } catch (e) {
        res.json([]);
    }
});

router.get('/group-requests', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
      SELECT g.id FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1 AND gm.status = 'REQUESTED'
  `, [req.user.id]);
        res.json(rows.map(r => r.id));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/power-team-requests', authenticateToken, async (req, res) => {
    try {
        const { rows } = await pool.query(`
      SELECT pt.id FROM power_teams pt
      JOIN power_team_members ptm ON pt.id = ptm.power_team_id
      WHERE ptm.user_id = $1 AND ptm.status = 'REQUESTED'
  `, [req.user.id]);
        res.json(rows.map(r => r.id));
    } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
