const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const failure = (status, text) => Object.assign(new Error(text), {status});
const dateColumn = `to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at`;
const columns = `id,sender_id,receiver_id,content,request_key,${dateColumn}`;
export function installMessages(app, {pool, authenticateToken}) {
  const route = fn => async (req,res) => {
    res.set('Cache-Control','private, no-store');
    let client;
    try {
      if (!uuid(req.user.id)) throw failure(401,'Oturum doğrulanamadı.');
      client=await pool.connect();
      await client.query(req.method==='GET'?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN');
      const {rows:[owner]}=await client.query('SELECT id FROM users WHERE id=$1',[req.user.id]);
      if (!owner) throw failure(401,'Oturum doğrulanamadı.');
      const result=await fn(req,client,owner.id);
      await client.query('COMMIT');res.json(result);
    } catch(e) {
      if(client)await client.query('ROLLBACK').catch(()=>{});
      if(!e.status)console.error('Messages operation failed:',e.message);
      res.status(e.status||500).json({error:e.status?e.message:'Mesaj işlemi tamamlanamadı. Tekrar deneyin.'});
    } finally {client?.release();}
  };
  const friend = async (client,owner,raw) => {
    if(!uuid(raw)||raw.toLowerCase()===owner)throw failure(400,'Geçersiz mesaj alıcısı.');
    const target=raw.toLowerCase();
    const {rows:[user]}=await client.query('SELECT id,name AS full_name,profession FROM users WHERE id=$1',[target]);
    if(!user)throw failure(404,'Alıcı bulunamadı.');
    const {rows}=await client.query('SELECT status FROM friend_requests WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)',[owner,target]);
    if(rows.length!==1||rows[0].status!=='ACCEPTED')throw failure(403,'Mesajlaşmak için kabul edilmiş bir bağlantı gerekiyor.');
    return user;
  };
  app.get('/api/messages/conversations',authenticateToken,route(async(req,client,owner)=>{
    if(Object.keys(req.query).length)throw failure(400,'Geçersiz konuşma sorgusu.');
    const {rows}=await client.query(`SELECT DISTINCT ON (friend_id) m.id,sender_id,receiver_id,content,request_key,to_char(m.created_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at,
      u.id AS friend_id,u.name AS friend_name,u.profession
      FROM direct_messages m JOIN users u ON u.id=CASE WHEN sender_id=$1 THEN receiver_id ELSE sender_id END
      WHERE (sender_id=$1 OR receiver_id=$1)
      AND (SELECT count(*) FROM friend_requests f WHERE (f.sender_id=$1 AND f.receiver_id=u.id) OR (f.sender_id=u.id AND f.receiver_id=$1))=1
      AND EXISTS(SELECT 1 FROM friend_requests f WHERE f.status='ACCEPTED' AND ((f.sender_id=$1 AND f.receiver_id=u.id) OR (f.sender_id=u.id AND f.receiver_id=$1)))
      ORDER BY friend_id,m.created_at DESC,m.id DESC`,[owner]);
    const conversations=rows.map(r=>({friend:{id:r.friend_id,full_name:r.friend_name,profession:r.profession},lastMessage:{id:r.id,sender_id:r.sender_id,receiver_id:r.receiver_id,content:r.content,request_key:r.request_key,created_at:r.created_at}}))
      .sort((a,b)=>b.lastMessage.created_at.localeCompare(a.lastMessage.created_at)||b.lastMessage.id.localeCompare(a.lastMessage.id));
    return {ownerId:owner,conversations};
  }));
  app.get('/api/messages/:id',authenticateToken,route(async(req,client,owner)=>{
    const user=await friend(client,owner,req.params.id);
    if(Object.keys(req.query).some(k=>k!=='before'))throw failure(400,'Geçersiz mesaj sorgusu.');
    const before=req.query.before;
    if(before!==undefined&&!uuid(before))throw failure(400,'Geçersiz sayfa anahtarı.');
    let cursor;
    if(before){cursor=(await client.query('SELECT id,created_at FROM direct_messages WHERE id=$3 AND ((sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1))',[owner,user.id,before])).rows[0];if(!cursor)throw failure(404,'Mesaj sayfası bulunamadı.');}
    const {rows}=await client.query(`SELECT ${columns} FROM direct_messages WHERE ((sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1))
      ${cursor?'AND (created_at,id)<(SELECT created_at,id FROM direct_messages WHERE id=$3)':''} ORDER BY created_at DESC,id DESC LIMIT 51`,cursor?[owner,user.id,cursor.id]:[owner,user.id]);
    const more=rows.length>50, page=rows.slice(0,50);
    return {ownerId:owner,targetId:user.id,friend:user,messages:page.reverse(),before:more?page[0].id:null};
  }));
  app.post('/api/messages/:id',authenticateToken,route(async(req,client,owner)=>{
    const {content,requestKey}=req.body;
    if(!uuid(requestKey)||typeof content!=='string'||!content.trim()||content.length>4000)throw failure(400,'Mesaj metni veya gönderim anahtarı geçersiz.');
    const text=content.trim();
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`message:${owner}:${requestKey.toLowerCase()}`]);
    const target=typeof req.params.id==='string'?req.params.id.toLowerCase():req.params.id;
    // Serialize against the connection decision routes as well.
    if(!uuid(target))throw failure(400,'Geçersiz mesaj alıcısı.');
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`friend:${[owner,target].sort().join(':')}`]);
    await friend(client,owner,target);
    const existing=(await client.query(`SELECT ${columns} FROM direct_messages WHERE sender_id=$1 AND request_key=$2`,[owner,requestKey])).rows[0];
    if(existing){if(existing.receiver_id!==target||existing.content!==text)throw failure(409,'Gönderim anahtarı başka bir mesaj için kullanılmış.');return{ownerId:owner,targetId:target,message:existing,replay:true};}
    const {rows:[message]}=await client.query(`INSERT INTO direct_messages(sender_id,receiver_id,content,request_key) VALUES($1,$2,$3,$4) RETURNING ${columns}`,[owner,target,text,requestKey]);
    if(!message)throw failure(409,'Mesaj kaydı doğrulanamadı.');
    return {ownerId:owner,targetId:target,message,replay:false};
  }));
}
