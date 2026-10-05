const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const instant = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;

export function installWebCalendar(app, { pool, authenticateToken }) {
  app.get('/api/calendar/web', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const { from, to } = req.query;
    if (!instant(from) || !instant(to) || Date.parse(to) <= Date.parse(from)
      || Date.parse(to) - Date.parse(from) > 43 * 86400000
      || Object.keys(req.query).some(key => !['from', 'to'].includes(key))) return res.status(400).json({ error: 'Invalid calendar range' });
    if (!uuid(req.user.id)) return res.status(401).json({ error: 'Invalid calendar owner' });
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const owner = await client.query('SELECT id FROM users WHERE id=$1', [req.user.id]);
      if (!owner.rows.length) { await client.query('ROLLBACK'); return res.status(401).json({ error: 'Calendar owner missing' }); }
      const result = await client.query(`
        WITH items AS (
          SELECT o.id, o.meeting_date AS start_at, 'one_to_one' AS type,
            CONCAT('Birebir: ', CASE WHEN o.requester_id=$1 THEN partner.name ELSE requester.name END) AS title,
            NULL::text AS location
          FROM one_to_ones o JOIN users requester ON requester.id=o.requester_id JOIN users partner ON partner.id=o.partner_id
          WHERE (o.requester_id=$1 OR o.partner_id=$1) AND o.status IN ('ACCEPTED','COMPLETED')
          UNION ALL
          SELECT v.id, v.visited_at, 'visitor', CONCAT('Ziyaretçi: ',v.name), v.profession::text FROM visitors v WHERE v.inviter_id=$1
          UNION ALL
          SELECT e.id,e.start_at,'meeting',e.title,e.location::text FROM events e
          WHERE e.status IN ('PUBLISHED','COMPLETED') AND (e.is_public=true OR EXISTS (
            SELECT 1 FROM group_members gm JOIN groups g ON g.id=gm.group_id
            WHERE gm.user_id=$1 AND gm.group_id=e.group_id AND gm.status='ACTIVE' AND g.status='ACTIVE'))
        )
        SELECT id,start_at,type,title,location FROM items
        WHERE start_at >= $2::timestamptz AND start_at < $3::timestamptz
        ORDER BY start_at,id,type LIMIT 1001`, [req.user.id, from, to]);
      if (result.rows.length > 1000) { await client.query('ROLLBACK'); return res.status(503).json({ error: 'Calendar range has too many items' }); }
      await client.query('COMMIT');
      res.json({ ownerId: req.user.id, from, to, items: result.rows });
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('Web calendar read failed:', error.message);
      res.status(500).json({ error: 'Calendar unavailable' });
    } finally { client?.release(); }
  });
}
