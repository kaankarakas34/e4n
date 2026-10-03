import { createHash } from 'node:crypto';

const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
const failure = (status,message) => Object.assign(new Error(message),{status});
const text = (value,max) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;

export function installSupportProcessing(app,{pool,authenticateToken}) {
  const mutate = operation => async(req,res) => {
    const body=req.body || {}, key=body.requestKey, target=operation==='create'?null:req.params.id;
    if(operation==='status' && req.user.role!=='ADMIN')return res.sendStatus(403);
    if((key!==undefined && !uuid(key)) || (target && !uuid(target))
      || (operation==='create' && !text(body.subject,255))
      || (operation!=='status' && !text(body.message,10000))
      || (operation==='status' && !['OPEN','ANSWERED','CLOSED'].includes(body.status)))return res.status(400).json({error:'Geçersiz destek işlemi.'});
    const subject=operation==='create'?body.subject.trim():null,message=operation!=='status'?body.message.trim():null;
    const fingerprint=createHash('sha256').update(JSON.stringify([operation,target,operation==='create'?subject:null,operation==='status'?body.status:message])).digest('hex');
    let client;
    try {
      client=await pool.connect();await client.query('BEGIN');
      if(key)await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`${req.user.id}:${key}`]);
      let ticket;
      if(target) {
        ticket=(await client.query('SELECT * FROM tickets WHERE id=$1 FOR UPDATE',[target])).rows[0];
        if(!ticket)throw failure(404,'Talep bulunamadı.');
        if(req.user.role!=='ADMIN' && ticket.user_id!==req.user.id)throw failure(403,'Erişim reddedildi.');
      }
      const previous=key?(await client.query('SELECT * FROM support_mutations WHERE user_id=$1 AND request_key=$2',[req.user.id,key])).rows[0]:null;
      if(previous) {
        if(previous.fingerprint!==fingerprint)throw failure(409,'İşlem anahtarı başka bir destek işleminde kullanılmış.');
        await client.query('COMMIT');return res.status(operation==='status'?200:201).json(previous.response);
      }
      let response;
      if(operation==='create') {
        ticket=(await client.query("INSERT INTO tickets(user_id,subject,status) VALUES($1,$2,'OPEN') RETURNING *",[req.user.id,subject])).rows[0];
        await client.query('INSERT INTO ticket_messages(ticket_id,sender_id,message) VALUES($1,$2,$3)',[ticket.id,req.user.id,message]);
        response=ticket;
      } else if(operation==='reply') {
        if(ticket.status==='CLOSED' && req.user.role!=='ADMIN')throw failure(409,'Kapalı talebe yanıt gönderilemez.');
        const inserted=(await client.query('INSERT INTO ticket_messages(ticket_id,sender_id,message) VALUES($1,$2,$3) RETURNING id',[target,req.user.id,message])).rows[0];
        const status=req.user.role==='ADMIN'?'ANSWERED':'OPEN';
        await client.query('UPDATE tickets SET status=$1,updated_at=NOW() WHERE id=$2',[status,target]);
        response={success:true,ticket_id:target,message_id:inserted.id,status};
      } else {
        await client.query('UPDATE tickets SET status=$1,updated_at=NOW() WHERE id=$2',[body.status,target]);
        response={success:true,ticket_id:target,status:body.status};
      }
      if(key)await client.query('INSERT INTO support_mutations(user_id,request_key,operation,fingerprint,ticket_id,response) VALUES($1,$2,$3,$4,$5,$6)',[req.user.id,key,operation,fingerprint,ticket.id,JSON.stringify(response)]);
      await client.query('COMMIT');res.status(operation==='status'?200:201).json(response);
    } catch(error) {
      if(client)await client.query('ROLLBACK').catch(()=>{});
      res.status(error.status || 500).json({error:error.status?error.message:'Destek işlemi kaydedilemedi.'});
    } finally {client?.release();}
  };
  app.get(['/api/tickets','/api/support'],authenticateToken,async(req,res)=>{
    try {
      const result=await pool.query(`SELECT t.*,u.name AS user_name,u.email AS user_email,
        (SELECT message FROM ticket_messages WHERE ticket_id=t.id ORDER BY created_at DESC,id DESC LIMIT 1) AS last_message
        FROM tickets t JOIN users u ON u.id=t.user_id
        ${req.user.role==='ADMIN'?'':'WHERE t.user_id=$1'} ORDER BY t.updated_at DESC,t.id`,req.user.role==='ADMIN'?[]:[req.user.id]);
      res.json(result.rows);
    }catch{res.status(500).json({error:'Destek talepleri yüklenemedi.'});}
  });
  app.get(['/api/tickets/:id','/api/support/:id'],authenticateToken,async(req,res)=>{
    if(!uuid(req.params.id))return res.status(400).json({error:'Geçersiz talep.'});
    let client;
    try {
      client=await pool.connect();await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      const ticket=(await client.query('SELECT t.*,u.name AS user_name,u.email AS user_email FROM tickets t JOIN users u ON u.id=t.user_id WHERE t.id=$1',[req.params.id])).rows[0];
      if(!ticket)throw failure(404,'Talep bulunamadı.');
      if(req.user.role!=='ADMIN' && ticket.user_id!==req.user.id)throw failure(403,'Erişim reddedildi.');
      const messages=(await client.query('SELECT tm.*,u.name AS sender_name,u.role AS sender_role FROM ticket_messages tm JOIN users u ON u.id=tm.sender_id WHERE tm.ticket_id=$1 ORDER BY tm.created_at,tm.id',[ticket.id])).rows;
      await client.query('COMMIT');res.json({ticket,messages});
    }catch(error){if(client)await client.query('ROLLBACK').catch(()=>{});res.status(error.status||500).json({error:error.status?error.message:'Talep detayı yüklenemedi.'});}
    finally{client?.release();}
  });
  app.post(['/api/tickets','/api/support'],authenticateToken,mutate('create'));
  app.post(['/api/tickets/:id/messages','/api/support/:id/messages'],authenticateToken,mutate('reply'));
  app.put(['/api/tickets/:id/status','/api/support/:id/status'],authenticateToken,mutate('status'));
}
