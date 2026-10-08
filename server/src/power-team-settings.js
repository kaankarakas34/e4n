import {randomUUID} from 'node:crypto';
const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const fields = ['name','description','status','visitor_email_subject','visitor_email_template'];
const columns = ['id',...fields,'created_at'].join(',');
const fail = (status,message) => Object.assign(new Error(message),{status});
function normalize(body,old) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => ![...fields,'id'].includes(k))) throw fail(400,'Geçersiz lonca alanları.');
  const values = {};
  for (const key of fields) values[key] = body[key] === undefined ? old?.[key] ?? (key === 'status' && !old ? 'ACTIVE' : null) : body[key];
  for (const [key,max] of [['name',255],['description',10000],['visitor_email_subject',500],['visitor_email_template',100000]]) {
    if (values[key] !== null && typeof values[key] !== 'string') throw fail(400,'Geçersiz lonca metni.');
    if (typeof values[key] === 'string') {
      if (!old || body[key] !== undefined) values[key] = values[key].trim() || null;
      if (values[key]?.length > max) throw fail(400,'Lonca metni çok uzun.');
    }
  }
  if (!values.name || !['ACTIVE','DRAFT'].includes(values.status) && !(old && values.status === null)) throw fail(400,'Lonca adı veya durumu geçersiz.');
  return values;
}
export function installPowerTeamSettings(app,{pool,authenticateToken}) {
  const actor = async (c,req,write) => {
    if (!uuid(req.user.id)) throw fail(401,'Oturum doğrulanamadı.');
    const u = (await c.query('SELECT role FROM users WHERE id=$1'+(write?' FOR SHARE':''),[req.user.id])).rows[0];
    if (!u) throw fail(401,'Oturum doğrulanamadı.');
    if (u.role !== 'ADMIN') throw fail(403,'Yönetici erişimi gerekiyor.');
  };
  const reply = (row,req) => ({...row,settingsVersion:1,ownerId:req.user.id});
  app.get('/api/admin/power-team-settings',authenticateToken,async(req,res) => {
    res.set('Cache-Control','private, no-store'); let c;
    try {
      if (Object.keys(req.query).length) throw fail(400,'Geçersiz sorgu.');
      c = await pool.connect(); await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'); await actor(c,req,false);
      const rows = (await c.query(`SELECT ${columns} FROM power_teams ORDER BY name,id LIMIT 1001`)).rows;
      if (rows.length > 1000) throw fail(503,'Lonca listesi sınırı aşıldı.');
      await c.query('COMMIT'); res.json({settingsVersion:1,ownerId:req.user.id,teams:rows});
    } catch(e) { if(c) await c.query('ROLLBACK').catch(()=>{}); res.status(e.status||500).json({error:e.status?e.message:'Lonca listesi yüklenemedi.'}); }
    finally { c?.release(); }
  });
  const write = create => async(req,res) => {
    res.set('Cache-Control','private, no-store'); let c;
    try {
      if (Object.keys(req.query).length) throw fail(400,'Geçersiz sorgu.');
      const id = create ? req.body?.id ?? randomUUID() : req.params.id;
      if (!uuid(id) || !create && req.body?.id !== undefined && (!uuid(req.body.id) || req.body.id.toLowerCase() !== id.toLowerCase())) throw fail(400,'Lonca kimliği geçersiz.');
      c = await pool.connect(); await c.query('BEGIN'); await actor(c,req,true);
      await c.query("SET LOCAL lock_timeout='5s'"); await c.query("SET LOCAL statement_timeout='30s'");
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['power-team:'+id.toLowerCase()]);
      const old = (await c.query(`SELECT ${columns} FROM power_teams WHERE id=$1 FOR UPDATE`,[id])).rows[0];
      if (!create && !old) throw fail(404,'Lonca bulunamadı.');
      const values = normalize(req.body,create?null:old);
      if (create && old) {
        if (JSON.stringify(normalize(Object.fromEntries(fields.map(k=>[k,old[k]])),old)) !== JSON.stringify(values)) throw fail(409,'Bu oluşturma kimliği farklı içerikle kullanıldı.');
        await c.query('COMMIT'); return res.json(reply(old,req));
      }
      const args = fields.map(k=>values[k]); args.push(id);
      const sql = create ? `INSERT INTO power_teams (${fields.join(',')},id) VALUES($1,$2,$3,$4,$5,$6) RETURNING ${columns}`
        : `UPDATE power_teams SET ${fields.map((k,i)=>`${k}=$${i+1}`).join(',')} WHERE id=$6 RETURNING ${columns}`;
      const row = (await c.query(sql,args)).rows[0]; await c.query('COMMIT'); res.status(create?201:200).json(reply(row,req));
    } catch(e) { if(c) await c.query('ROLLBACK').catch(()=>{}); res.status(e.status|| (e.code==='23505'?409:500)).json({error:e.status?e.message:e.code==='23505'?'Bu lonca adı zaten kullanılıyor.':'Lonca ayarları kaydedilemedi. Sonucu kontrol edip tekrar deneyin.'}); }
    finally { c?.release(); }
  };
  app.post('/api/power-teams',authenticateToken,write(true));
  app.put('/api/power-teams/:id',authenticateToken,write(false));
}
