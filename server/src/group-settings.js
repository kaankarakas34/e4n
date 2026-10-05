import { randomUUID } from 'node:crypto';
const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const fields = ['name','meeting_day','meeting_time','meeting_link','status','meeting_dates','visitor_email_subject','visitor_email_template'];
const fail = (status, message) => Object.assign(new Error(message), { status });
function normalize(body, previous) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k => ![...fields,'id','description'].includes(k))
    || (body.description !== undefined && body.description !== '')) throw fail(400, 'Geçersiz grup alanları.');
  const result = {};
  for (const key of fields) result[key] = body[key] === undefined ? previous?.[key] ?? (key === 'status' && !previous ? 'ACTIVE' : key === 'meeting_dates' ? [] : null) : body[key];
  for (const [key, max] of [['name',255],['meeting_day',255],['meeting_link',255],['visitor_email_subject',500],['visitor_email_template',100000]]) {
    if (result[key] !== null && typeof result[key] !== 'string') throw fail(400,'Geçersiz metin alanı.');
    if (typeof result[key] === 'string') { result[key] = result[key].trim() || null; if (result[key]?.length > max) throw fail(400,'Grup alanı çok uzun.'); }
  }
  if (!result.name || (!['ACTIVE','DRAFT'].includes(result.status) && !(previous && result.status === null))) throw fail(400,'İsim veya durum geçersiz.');
  if (result.meeting_time === '') result.meeting_time = null;
  if (result.meeting_time !== null) {
    if (typeof result.meeting_time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(result.meeting_time)) throw fail(400,'Toplantı saati geçersiz.');
    if (result.meeting_time.length === 5) result.meeting_time += ':00';
  }
  if (result.meeting_link) { let u; try { u = new URL(result.meeting_link); } catch { throw fail(400,'Toplantı bağlantısı geçersiz.'); } if (!['http:','https:'].includes(u.protocol) || u.username || u.password) throw fail(400,'Toplantı bağlantısı geçersiz.'); }
  if (!Array.isArray(result.meeting_dates) || result.meeting_dates.length > 366 || result.meeting_dates.some(d => typeof d !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d) || !Number.isFinite(Date.parse(d)) || new Date(d).toISOString().slice(0,10) !== d)) throw fail(400,'Toplantı tarihleri geçersiz.');
  result.meeting_dates = [...new Set(result.meeting_dates)].sort();
  return result;
}
export function installGroupSettings(app, { pool, authenticateToken }) {
  const write = create => async (req, res) => {
    res.set('Cache-Control','private, no-store'); let client;
    try {
      if (!uuid(req.user.id)) throw fail(401,'Kullanıcı bulunamadı.');
      if (Object.keys(req.query).length) throw fail(400,'Geçersiz sorgu.');
      const id = create ? req.body?.id ?? randomUUID() : req.params.id;
      if (!uuid(id) || (!create && req.body?.id !== undefined && req.body.id !== id)) throw fail(400,'Grup kimliği geçersiz.');
      client = await pool.connect(); await client.query('BEGIN');
      const owner = (await client.query('SELECT role FROM users WHERE id=$1 FOR SHARE',[req.user.id])).rows[0];
      if (!owner) throw fail(401,'Kullanıcı bulunamadı.');
      if (owner.role !== 'ADMIN') throw fail(403,'Yönetici erişimi gerekli.');
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1::text,0))',[id]);
      const old = (await client.query('SELECT * FROM groups WHERE id=$1 FOR UPDATE',[id])).rows[0];
      if (!create && !old) throw fail(404,'Grup bulunamadı.');
      const values = normalize(req.body,create ? null : old);
      if (create && old) {
        const prior = normalize(Object.fromEntries(fields.map(k => [k,old[k]])),old);
        if (JSON.stringify(prior) !== JSON.stringify(values)) throw fail(409,'Bu oluşturma kimliği başka içerikle kullanıldı.');
        await client.query('COMMIT'); return res.json(old);
      }
      const params = fields.map(k => k === 'meeting_dates' ? JSON.stringify(values[k]) : values[k]); params.push(id);
      const sql = create ? `INSERT INTO groups (${fields.join(',')},id) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) RETURNING *`
        : `UPDATE groups SET ${fields.map((k,i) => `${k}=$${i+1}${k==='meeting_dates'?'::jsonb':''}`).join(',')} WHERE id=$9 RETURNING *`;
      const saved = (await client.query(sql,params)).rows[0]; await client.query('COMMIT'); res.status(create?201:200).json(saved);
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(()=>{});
      if (!error.status) console.error('Group settings write failed:',error.message);
      res.status(error.status||500).json({error:error.status?error.message:'Grup ayarları kaydedilemedi.'});
    } finally { client?.release(); }
  };
  app.post('/api/groups',authenticateToken,write(true));
  app.put('/api/groups/:id',authenticateToken,write(false));
}
