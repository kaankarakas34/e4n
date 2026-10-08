import {createHash} from 'node:crypto';

const limits = {name:100,profession:100,phone:20,city:100,website:2048,bio:5000,linkedin_profile:255,company:255,tax_number:50,tax_office:100,billing_address:5000};
const fields = Object.keys(limits);
const columns = ['id',...fields].join(',');
const uuid = v => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const fail = (status,message) => Object.assign(new Error(message),{status});
const revision = row => createHash('sha256').update(JSON.stringify(fields.map(k=>row[k]??null))).digest('hex');
const reply = row => ({...row,profileSettingsVersion:1,ownerId:row.id,revision:revision(row)});
function patch(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(k=>![...fields,'expectedRevision'].includes(k))) throw fail(400,'Geçersiz profil alanları.');
  if (body.expectedRevision !== undefined && (typeof body.expectedRevision !== 'string' || !/^[0-9a-f]{64}$/.test(body.expectedRevision))) throw fail(400,'Geçersiz profil sürümü.');
  const values = {};
  for (const key of fields) {
    if (!(key in body)) continue;
    if (body[key] !== null && typeof body[key] !== 'string') throw fail(400,'Profil alanları metin olmalıdır.');
    const value = typeof body[key] === 'string' ? body[key].trim() : '';
    if (value.length > limits[key] || value.includes('\u0000') || key === 'name' && !value) throw fail(400,'Profil alanı boş veya çok uzun.');
    if (['website','linkedin_profile'].includes(key) && value) {
      let url; try { url = new URL(value); } catch { throw fail(400,'Site adresi http:// veya https:// ile başlamalıdır.'); }
      if (!['http:','https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw fail(400,'Geçersiz site adresi.');
    }
    values[key] = value || (key === 'profession' ? '' : null);
  }
  if (!Object.keys(values).length) throw fail(400,'Kaydedilecek profil alanı yok.');
  return values;
}
export function installSelfProfile(app,{pool,authenticateToken}) {
  const handle = write => async(req,res) => {
    res.set('Cache-Control','private, no-store'); let client;
    try {
      if (!uuid(req.user.id)) throw fail(401,'Oturum doğrulanamadı.');
      if (Object.keys(req.query).length) throw fail(400,'Geçersiz sorgu.');
      const values = write ? patch(req.body) : null;
      client = await pool.connect();
      await client.query(write?'BEGIN':'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
      await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='30s'");
      let row = (await client.query(`SELECT ${columns} FROM users WHERE id=$1${write?' FOR UPDATE':''}`,[req.user.id])).rows[0];
      if (!row) throw fail(401,'Oturum doğrulanamadı.');
      if (write && Object.entries(values).some(([k,v])=>row[k]!==v)) {
        if (req.body.expectedRevision !== undefined && req.body.expectedRevision !== revision(row)) throw fail(409,'Profil başka bir işlemde değişti. Güncel bilgileri yükleyip tekrar düzenleyin.');
        const entries = Object.entries(values);
        row = (await client.query(`UPDATE users SET ${entries.map(([k],i)=>`${k}=$${i+1}`).join(',')},updated_at=NOW() WHERE id=$${entries.length+1} RETURNING ${columns}`,[...entries.map(([,v])=>v),req.user.id])).rows[0];
      }
      const result = reply(row); // Saved projection is captured inside the transaction, never SELECT *.
      await client.query('COMMIT'); res.json(result);
    } catch(e) {
      if(client) await client.query('ROLLBACK').catch(()=>{});
      res.status(e.status||500).json({error:e.status?e.message:'Profil kaydedilemedi veya okunamadı. Durumu kontrol edip tekrar deneyin.'});
    } finally { client?.release(); }
  };
  app.get('/api/user/profile-settings',authenticateToken,handle(false));
  app.put('/api/users/me',authenticateToken,handle(true));
}
