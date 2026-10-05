const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
export function installAdminGroupDetail(app, { pool, authenticateToken }) {
  app.get('/api/admin/groups/:id/detail', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (!uuid(req.params.id) || Object.keys(req.query).length) return res.status(400).json({ error: 'Invalid group request' });
    if (!uuid(req.user.id)) return res.sendStatus(401);
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const owner = (await client.query('SELECT role FROM users WHERE id=$1', [req.user.id])).rows[0];
      if (!owner) { await client.query('ROLLBACK'); return res.sendStatus(401); }
      if (owner.role !== 'ADMIN') { await client.query('ROLLBACK'); return res.sendStatus(403); }
      const group = (await client.query(`SELECT id,name,status,meeting_day,meeting_time,meeting_link,COALESCE(meeting_dates,'[]'::jsonb) AS meeting_dates,
        visitor_email_subject,visitor_email_template FROM groups WHERE id=$1`, [req.params.id])).rows[0];
      if (!group) { await client.query('ROLLBACK'); return res.sendStatus(404); }
      const args = [group.id];
      const members = (await client.query(`SELECT u.id,u.name AS full_name,u.profession,u.email,u.role,u.performance_score,u.performance_color,
        gm.status,gm.joined_at AS created_at,
        (SELECT count(*)::int FROM attendance a JOIN events e ON e.id=a.event_id
          WHERE a.user_id=u.id AND e.group_id=$1 AND a.status='ABSENT') AS absence_count
        FROM group_members gm JOIN users u ON u.id=gm.user_id WHERE gm.group_id=$1 ORDER BY u.name,u.id LIMIT 5001`, args)).rows;
      const events = (await client.query(`SELECT e.id,e.title AS topic,e.start_at AS date,
        (SELECT count(*)::int FROM attendance a JOIN users u ON u.id=a.user_id WHERE a.event_id=e.id) AS attendees_count,
        (SELECT count(*)::int FROM attendance a JOIN users u ON u.id=a.user_id WHERE a.event_id=e.id AND a.status='PRESENT') AS present_count
        FROM events e WHERE e.group_id=$1 AND e.type IS DISTINCT FROM 'education' ORDER BY e.start_at DESC,e.id LIMIT 5001`, args)).rows;
      const visitors = (await client.query(`SELECT v.id,v.name,v.profession,v.company,v.email,v.visited_at,v.status,u.name AS inviter_name
        FROM visitors v LEFT JOIN users u ON u.id=v.inviter_id WHERE v.group_id=$1 ORDER BY v.visited_at DESC,v.id LIMIT 5001`, args)).rows;
      const referrals = (await client.query(`SELECT r.id,r.status,r.amount::text AS amount,r.created_at,g.name AS from_member_name,u.name AS to_member_name
        FROM referrals r JOIN users g ON g.id=r.giver_id JOIN users u ON u.id=r.receiver_id
        WHERE EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id=$1 AND gm.user_id=r.giver_id AND gm.status='ACTIVE')
        ORDER BY r.created_at DESC,r.id LIMIT 5001`, args)).rows;
      if ([members,events,visitors,referrals].some(rows => rows.length > 5000)) {
        await client.query('ROLLBACK'); return res.status(503).json({ error: 'Group detail exceeds supported size' });
      }
      const summary = (await client.query(`SELECT
        (SELECT count(*)::int FROM group_members WHERE group_id=$1 AND status='ACTIVE') AS activeMembers,
        (SELECT count(*)::int FROM events WHERE group_id=$1 AND type IS DISTINCT FROM 'education' AND start_at>now()) AS upcomingEvents,
        count(*)::int AS count,count(*) FILTER(WHERE r.status='SUCCESSFUL')::int AS successful,
        count(*) FILTER(WHERE r.status='SUCCESSFUL' AND (r.amount IS NULL OR r.amount<0))::int AS missing,
        COALESCE(sum(r.amount) FILTER(WHERE r.status='SUCCESSFUL' AND r.amount>=0),0)::text AS known_volume
        FROM referrals r JOIN users g ON g.id=r.giver_id JOIN users u ON u.id=r.receiver_id
        WHERE EXISTS(SELECT 1 FROM group_members gm WHERE gm.group_id=$1 AND gm.user_id=r.giver_id AND gm.status='ACTIVE')`, args)).rows[0];
      await client.query('COMMIT');
      res.json({ version:1,ownerId:req.user.id,group,members,events,visitors,referrals,
        summary:{ activeMembers:summary.activemembers,upcomingEvents:summary.upcomingevents,
          count:summary.count,successful:summary.successful,missingAmounts:summary.missing,knownVolume:summary.known_volume,
          volume:summary.missing ? null : summary.known_volume } });
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('Admin group detail failed:', error.message); res.status(500).json({ error:'Group detail unavailable' });
    } finally { client?.release(); }
  });
}
