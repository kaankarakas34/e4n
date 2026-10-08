const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const statuses = ['REGISTERED', 'PRESENT', 'ABSENT'];
export function installEventAttendance(app, {pool, authenticateToken}) {
  app.get('/api/admin/events/:id/attendance-snapshot', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    if (!uuid(req.params.id) || Object.keys(req.query).length) return res.sendStatus(400);
    let c;
    try {
      c = await pool.connect(); await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const actor = (await c.query('SELECT role FROM users WHERE id=$1', [req.user.id])).rows[0];
      if (!actor || actor.role !== 'ADMIN') { await c.query('ROLLBACK'); return res.sendStatus(actor ? 403 : 401); }
      const event = (await c.query('SELECT id,title,type,status,start_at FROM events WHERE id=$1', [req.params.id])).rows[0];
      if (!event) { await c.query('ROLLBACK'); return res.sendStatus(404); }
      if (event.type === 'education') { await c.query('ROLLBACK'); return res.sendStatus(403); }
      const participants = (await c.query(`SELECT a.id,a.user_id,a.status,u.name,
        COALESCE(h.revision,0)::int revision,
        CASE WHEN h.after_status=a.status THEN h.recorded_at ELSE NULL END verified_at
        FROM attendance a JOIN users u ON u.id=a.user_id
        LEFT JOIN LATERAL (SELECT revision,after_status,recorded_at FROM event_attendance_verifications
          WHERE attendance_id=a.id ORDER BY revision DESC LIMIT 1) h ON true
        WHERE a.event_id=$1 ORDER BY u.name,a.user_id LIMIT 1001`, [event.id])).rows;
      if (participants.length > 1000) { await c.query('ROLLBACK'); return res.sendStatus(503); }
      const history = (await c.query(`SELECT id,attendance_id,user_id,actor_id,actor_name,before_status,after_status,
        revision,reason,recorded_at FROM event_attendance_verifications WHERE event_id=$1 ORDER BY recorded_at DESC,id DESC LIMIT 50`, [event.id])).rows;
      const totalHistory = (await c.query('SELECT count(*)::int n FROM event_attendance_verifications WHERE event_id=$1', [event.id])).rows[0].n;
      await c.query('COMMIT'); res.json({version:1,ownerId:req.user.id,event,participants,history,totalHistory});
    } catch { if (c) await c.query('ROLLBACK').catch(()=>{}); res.status(500).json({error:'Yoklama kayıtları yüklenemedi.'}); }
    finally { c?.release(); }
  });
  app.put('/api/admin/events/:id/attendance/:userId', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'private, no-store');
    const b=req.body;
    if (!uuid(req.params.id) || !uuid(req.params.userId) || Object.keys(req.query).length || !b || Array.isArray(b)
      || Object.keys(b).sort().join(',')!=='expectedStatus,expectedVersion,reason,requestId,status'
      || !uuid(b.requestId) || !statuses.includes(b.status) || !['REGISTERED','PRESENT','ABSENT','LATE','SUBSTITUTE','MEDICAL'].includes(b.expectedStatus)
      || !Number.isSafeInteger(b.expectedVersion) || b.expectedVersion<0 || typeof b.reason!=='string' || !b.reason.trim() || b.reason.trim().length>500) return res.sendStatus(400);
    let c;
    try {
      c=await pool.connect(); await c.query('BEGIN');
      const actor=(await c.query('SELECT role,name FROM users WHERE id=$1 FOR SHARE', [req.user.id])).rows[0];
      if (!actor || actor.role!=='ADMIN') { await c.query('ROLLBACK'); return res.sendStatus(actor ? 403 : 401); }
      const event=(await c.query('SELECT id,type,status,start_at FROM events WHERE id=$1 FOR UPDATE', [req.params.id])).rows[0];
      if (!event) { await c.query('ROLLBACK'); return res.sendStatus(404); }
      const replay=(await c.query('SELECT * FROM event_attendance_verifications WHERE id=$1', [b.requestId])).rows[0];
      if (replay) {
        if (replay.event_id!==event.id || replay.user_id!==req.params.userId || replay.actor_id!==req.user.id || replay.after_status!==b.status || replay.reason!==b.reason.trim() || replay.revision!==b.expectedVersion+1 || replay.before_status!==b.expectedStatus) { await c.query('ROLLBACK'); return res.status(409).json({error:'İşlem anahtarı farklı bir kayıt için kullanıldı.'}); }
        await c.query('COMMIT'); return res.json({version:1,ownerId:req.user.id,eventId:event.id,userId:replay.user_id,requestId:replay.id,revision:replay.revision,status:replay.after_status,replayed:true});
      }
      if (event.type==='education' || !['PUBLISHED','COMPLETED'].includes(event.status) || !event.start_at || new Date(event.start_at)>new Date()) { await c.query('ROLLBACK'); return res.status(409).json({error:'Yoklama yalnız başlamış, iptal edilmemiş etkinlik için kaydedilebilir.'}); }
      const row=(await c.query('SELECT id,status FROM attendance WHERE event_id=$1 AND user_id=$2 FOR UPDATE', [event.id,req.params.userId])).rows[0];
      if (!row) { await c.query('ROLLBACK'); return res.sendStatus(404); }
      const revision=(await c.query('SELECT COALESCE(max(revision),0)::int n FROM event_attendance_verifications WHERE attendance_id=$1', [row.id])).rows[0].n;
      if (row.status!==b.expectedStatus || revision!==b.expectedVersion) { await c.query('ROLLBACK'); return res.status(409).json({error:'Yoklama değişti. Güncel kayıtları yükleyip yeniden değerlendirin.'}); }
      await c.query('UPDATE attendance SET status=$1 WHERE id=$2', [b.status,row.id]);
      await c.query(`INSERT INTO event_attendance_verifications(id,event_id,attendance_id,user_id,actor_id,actor_name,before_status,after_status,revision,reason)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [b.requestId,event.id,row.id,req.params.userId,req.user.id,actor.name,row.status,b.status,revision+1,b.reason.trim()]);
      // Explicit attendance evidence only. Pricing, rights and score policy are separate decisions.
      await c.query('COMMIT'); res.json({version:1,ownerId:req.user.id,eventId:event.id,userId:req.params.userId,requestId:b.requestId,revision:revision+1,status:b.status,replayed:false});
    } catch { if(c) await c.query('ROLLBACK').catch(()=>{}); res.status(500).json({error:'Yoklama kaydı tamamlanamadı.'}); }
    finally { c?.release(); }
  });
}
