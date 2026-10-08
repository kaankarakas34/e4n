const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const failure=(status,message)=>Object.assign(new Error(message),{status});
const columns='id,title,message,type,read,created_at';
export function installNotifications(app,{pool,authenticateToken}) {
  const handle=(mode,legacy=false)=>async(req,res)=>{
    res.set('Cache-Control','private, no-store');let client;
    try {
      if(!uuid(req.user.id))throw failure(401,'Oturum doğrulanamadı.');
      if(Object.keys(req.query).length||mode!=='get'&&req.body&&Object.keys(req.body).length)throw failure(400,'Geçersiz bildirim isteği.');
      if(mode==='one'&&!uuid(req.params.id))throw failure(400,'Geçersiz bildirim.');
      client=await pool.connect();await client.query(mode==='get'?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN');
      await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
      if(!(await client.query(`SELECT id FROM users WHERE id=$1${mode==='get'?'':' FOR UPDATE'}`,[req.user.id])).rowCount)throw failure(401,'Oturum doğrulanamadı.');
      let notification;
      if(mode==='one') {
        const row=(await client.query(`SELECT ${columns} FROM notifications WHERE id=$1 AND user_id=$2 FOR UPDATE`,[req.params.id,req.user.id])).rows[0];
        if(!row)throw failure(404,'Bildirim bulunamadı.');
        notification=row.read?row:(await client.query(`UPDATE notifications SET read=TRUE WHERE id=$1 AND user_id=$2 RETURNING ${columns}`,[req.params.id,req.user.id])).rows[0];
      }
      if(mode==='all')await client.query('UPDATE notifications SET read=TRUE WHERE user_id=$1 AND read IS DISTINCT FROM TRUE',[req.user.id]);
      // Both count and window belong to the same snapshot. Read-all affects existing rows;
      // a subsequently created notification remains unread.
      const snapshot=(await client.query(`SELECT (SELECT count(*)::int FROM notifications WHERE user_id=$1) AS total,(SELECT count(*)::int FROM notifications WHERE user_id=$1 AND read IS DISTINCT FROM TRUE) AS unread,COALESCE((SELECT json_agg(n ORDER BY created_at DESC,id DESC) FROM (SELECT ${columns} FROM notifications WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT 50)n),'[]'::json) AS rows`,[req.user.id])).rows[0];
      const result={notificationVersion:1,ownerId:req.user.id,notifications:snapshot.rows,total:snapshot.total,unreadCount:snapshot.unread,...(mode!=='get'?{success:true}:{}),...(notification?{notification}:{})};
      await client.query('COMMIT');res.json(legacy?snapshot.rows.map(n=>({...n,user_id:req.user.id})):result);
    }catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});res.status(e.status||500).json({error:e.status?e.message:'Bildirim işlemi tamamlanamadı. Durumu yenileyip kontrol edin.'});}
    finally{client?.release();}
  };
  app.get('/api/notifications',authenticateToken,handle('get',true));
  app.get('/api/notifications/web',authenticateToken,handle('get'));
  app.put('/api/notifications/:id/read',authenticateToken,handle('one'));
  app.put('/api/notifications/read-all',authenticateToken,handle('all'));
}
