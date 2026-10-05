const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function installWebGroups(app, { pool, authenticateToken }) {
  app.get('/api/me/web-groups', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (Object.keys(req.query).length) return res.status(400).json({ error: 'Unexpected group query' });
    if (!uuid(req.user.id)) return res.status(401).json({ error: 'Invalid owner' });
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      if (!(await client.query('SELECT id FROM users WHERE id=$1', [req.user.id])).rows.length) { await client.query('ROLLBACK'); return res.status(401).json({ error: 'Owner missing' }); }
      const groups = await client.query(`SELECT g.id,g.name,g.meeting_dates,(to_jsonb(g)->>'meeting_time') AS meeting_time,
        COALESCE((to_jsonb(g)->>'meeting_link') <> '',false) AS is_online
        FROM groups g WHERE g.status='ACTIVE' AND EXISTS (
          SELECT 1 FROM group_members gm WHERE gm.group_id=g.id AND gm.user_id=$1 AND gm.status='ACTIVE')
        ORDER BY g.name,g.id LIMIT 101`, [req.user.id]);
      if (groups.rows.length > 100) { await client.query('ROLLBACK'); return res.status(503).json({ error: 'Too many groups' }); }
      const ids = groups.rows.map(g => g.id);
      const members = ids.length ? await client.query(`SELECT gm.group_id,u.id,u.name,u.profession
        FROM group_members gm JOIN users u ON u.id=gm.user_id
        WHERE gm.group_id=ANY($1::uuid[]) AND gm.status='ACTIVE' ORDER BY u.name,u.id,gm.group_id LIMIT 5001`, [ids]) : { rows: [] };
      if (members.rows.length > 5000) { await client.query('ROLLBACK'); return res.status(503).json({ error: 'Too many members' }); }
      const result = groups.rows.map(g => {
        const dates = g.meeting_dates ?? [];
        if (!Array.isArray(dates) || dates.some(d => typeof d !== 'string' || !Number.isFinite(Date.parse(d)))) throw new Error('Invalid stored meeting dates');
        return { ...g, meeting_dates: dates, members: members.rows.filter(m => m.group_id === g.id).map(({ group_id, ...m }) => m) };
      });
      await client.query('COMMIT'); res.json({ ownerId: req.user.id, groups: result });
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('Web groups read failed:', error.message); res.status(500).json({ error: 'Groups unavailable' });
    } finally { client?.release(); }
  });
}
