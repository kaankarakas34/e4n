const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function installWebActivities(app, { pool, authenticateToken }) {
  app.get('/api/me/web-activities', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (Object.keys(req.query).length) return res.status(400).json({ error: 'Unexpected activity query' });
    if (!uuid(req.user.id)) return res.status(401).json({ error: 'Invalid owner' });
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      if (!(await client.query('SELECT id FROM users WHERE id=$1', [req.user.id])).rows.length) { await client.query('ROLLBACK'); return res.status(401).json({ error: 'Owner missing' }); }
      const { rows } = await client.query(`WITH records AS (
        SELECT o.id,'one_to_one'::text AS type,o.created_at,o.status,
          CASE WHEN o.requester_id=$1 THEN partner.name ELSE requester.name END AS title,
          o.meeting_date::text AS scheduled_at,NULL::uuid AS event_id,NULL::text AS direction
        FROM one_to_ones o LEFT JOIN users partner ON partner.id=o.partner_id LEFT JOIN users requester ON requester.id=o.requester_id
        WHERE o.requester_id=$1 OR o.partner_id=$1
        UNION ALL
        SELECT r.id,'referral',r.created_at,r.status,
          CASE WHEN r.giver_id=$1 THEN receiver.name ELSE giver.name END,
          NULL::text,NULL::uuid,CASE WHEN r.giver_id=$1 THEN 'given' ELSE 'received' END
        FROM referrals r LEFT JOIN users giver ON giver.id=r.giver_id LEFT JOIN users receiver ON receiver.id=r.receiver_id
        WHERE r.giver_id=$1 OR r.receiver_id=$1
        UNION ALL
        SELECT v.id,'visitor',v.created_at,v.status,v.name,v.visited_at::text,NULL::uuid,NULL::text
        FROM visitors v WHERE v.inviter_id=$1
        UNION ALL
        SELECT a.id,'attendance',a.created_at,a.status,e.title,e.start_at::text,e.id,NULL::text
        FROM attendance a JOIN events e ON e.id=a.event_id WHERE a.user_id=$1
      ) SELECT id,type,created_at,status,title,scheduled_at,event_id,direction FROM records
        ORDER BY created_at DESC NULLS LAST,type,id LIMIT 10`, [req.user.id]);
      if (rows.some(row => !row.created_at || !Number.isFinite(new Date(row.created_at).getTime()))) throw new Error('Invalid stored activity date');
      await client.query('COMMIT'); res.json({ ownerId: req.user.id, items: rows });
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('Web activity read failed:', error.message); res.status(500).json({ error: 'Activities unavailable' });
    } finally { client?.release(); }
  });
}
