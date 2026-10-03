import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

export const validInvoice = value => typeof value === 'string' && /^[a-zA-Z0-9-]{1,255}$/.test(value);
export const validRequestKey = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])) : value;
export const paymentFingerprint = (user, amount, action) => crypto.createHash('sha256')
  .update(JSON.stringify(canonical({user:user || null,amount:Number(amount),action}))).digest('hex');
export const paymentReceipt = (invoice,secret) => ({success:true,is3D:false,recoveryOnly:true,invoiceId:invoice,
  receiptToken:jwt.sign({invoice},`${secret}:payment-receipt`,{audience:'e4n-payment-receipt',expiresIn:'24h'})});
const fail = (message, status = 409) => Object.assign(new Error(message), { status });
const paid = status => ['SUCCESS', 'PAID'].includes(status);
const cents = value => { const n = Number(value); return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null; };

// Provider I/O happens before row locks. Only a matching settled Auth payment grants an action.
export async function checkSipay(tx, generateHash) {
  const { SIPAY_API_URL, SIPAY_APP_ID, SIPAY_APP_SECRET, SIPAY_MERCHANT_KEY } = process.env;
  if (!SIPAY_API_URL || !SIPAY_APP_ID || !SIPAY_APP_SECRET || !SIPAY_MERCHANT_KEY) throw fail('Ödeme doğrulama yapılandırması eksik.', 503);
  const post = async (path, body, token) => {
    const response = await fetch(`${SIPAY_API_URL.replace(/\/$/, '')}/api/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body), signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw fail('Ödeme sağlayıcısı doğrulanamadı.', 502);
    return response.json();
  };
  const auth = await post('token', { app_id: SIPAY_APP_ID, app_secret: SIPAY_APP_SECRET, app_lang: 'tr' });
  if (Number(auth.status_code) !== 100 || typeof auth.data?.token !== 'string' || !auth.data.token) throw fail('Ödeme sağlayıcısı doğrulanamadı.', 502);
  const result = await post('checkstatus', { invoice_id: tx.merchant_oid, merchant_key: SIPAY_MERCHANT_KEY,
    hash_key: generateHash([tx.merchant_oid, SIPAY_MERCHANT_KEY], SIPAY_APP_SECRET) }, auth.data.token);
  if (result.invoice_id !== tx.merchant_oid) throw fail('Ödeme işlem eşleşmesi doğrulanamadı.', 502);
  if (result.transaction_status === 'Completed' && Number(result.status_code) === 100 && result.transaction_type === 'Auth') {
    if (cents(result.transaction_amount) !== cents(tx.amount) || cents(tx.amount) === null) throw fail('Ödeme tutarı eşleşmiyor.', 409);
    return 'SUCCESS';
  }
  if (result.transaction_status === 'Failed' && Number(result.status_code) === 68) return 'FAILED';
  // Unknown, pre-authorized and pending responses never become a settled payment.
  return 'PENDING';
}

async function applyAction(client, tx) {
  const data = tx.action_data || {};
  if (tx.action_type === 'membership') {
    const months = { '1_MONTH': 1, '4_MONTHS': 4, '6_MONTHS': 6, '8_MONTHS': 8, '12_MONTHS': 12 }[data.plan];
    if (!tx.user_id || tx.user_id !== data.user_id || !months || tx.plan_id !== data.plan) throw fail('Üyelik işlem sahipliği veya planı doğrulanamadı.');
    const end = new Date(); end.setMonth(end.getMonth() + months);
    const changed = await client.query(`UPDATE users SET subscription_plan=$1,subscription_end_date=$2,
      account_status='ACTIVE',last_reminder_trigger=NULL,last_membership_payment_amount=$4 WHERE id=$3 RETURNING id`,
    [data.plan,end.toISOString(),tx.user_id,tx.amount]);
    if (changed.rowCount !== 1) throw fail('Üyelik hesabı bulunamadı.');
  } else if (tx.action_type === 'event_registration') {
    if (!tx.user_id || tx.user_id !== data.user_id) throw fail('Etkinlik işlem sahipliği doğrulanamadı.');
    const event = (await client.query('SELECT * FROM events WHERE id=$1 FOR UPDATE',[data.event_id])).rows[0];
    if (!event) throw fail('Etkinlik bulunamadı.');
    await client.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'PRESENT') ON CONFLICT(event_id,user_id) DO NOTHING",[data.event_id,tx.user_id]);
    if (event.generate_tickets && !(await client.query('SELECT 1 FROM event_tickets WHERE event_id=$1 AND user_id=$2',[data.event_id,tx.user_id])).rowCount) {
      await client.query("INSERT INTO event_tickets(event_id,user_id,ticket_number,payment_status) VALUES($1,$2,$3,'PAID')",
        [data.event_id,tx.user_id,`E4N-${crypto.randomBytes(8).toString('hex').toUpperCase()}`]);
    }
  } else if (tx.action_type === 'visitor_registration') {
    const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
    if (!email || typeof data.name !== 'string' || !data.name.trim()) throw fail('Ziyaretçi bilgileri doğrulanamadı.');
    // Serialize the existing email/event duplicate rule, including registrations without an event.
    await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[JSON.stringify([email,data.event_id || null])]);
    const exists = await client.query('SELECT 1 FROM public_visitors WHERE LOWER(email)=$1 AND event_id IS NOT DISTINCT FROM $2::uuid',[email,data.event_id || null]);
    if (!exists.rowCount) {
      await client.query(`INSERT INTO public_visitors(name,email,phone,company,profession,source,kvkk_accepted,inviter_id,title,web_linkedin,
        activity_area,duration,target_customer,why_join,value_add,previous_groups,form_data,event_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      [data.name,email,data.phone,data.company,data.profession || 'Ziyaretçi',data.source || 'visitor_payment',data.kvkk_accepted || false,
        data.inviter_id || null,data.title || null,data.web_linkedin || null,data.activity_area || null,data.duration || null,
        data.target_customer || null,data.why_join || null,data.value_add || null,data.previous_groups || null,
        {...(data.form_data || {}),payment_status:'PAID',payment_amount:tx.amount,payment_date:new Date().toISOString()},data.event_id || null]);
    }
  } else throw fail('Ödeme işlem türü doğrulanamadı.');
}

export function installPaymentProcessing(app, { pool, secret, generateHash, onEventPaid }) {
  app.post('/api/payment/resume',async(req,res)=>{
    try {
      if(!validRequestKey(req.body.requestKey))return res.status(400).json({error:'Geçersiz işlem anahtarı.'});
      const row=(await pool.query('SELECT merchant_oid,user_id,action_type,initiation_state,status FROM payment_transactions WHERE request_key=$1',[req.body.requestKey])).rows[0];
      let owner=null;
      if(req.headers.authorization)try{owner=jwt.verify(req.headers.authorization.split(' ')[1],secret).id;}catch{return res.sendStatus(403);}
      if(!row || (row.user_id ? row.user_id!==owner : row.action_type!=='visitor_registration'))return res.status(404).json({error:'İşlem bulunamadı.'});
      res.json({...paymentReceipt(row.merchant_oid,secret),retryAllowed:row.initiation_state==='NOT_SENT' && row.status==='PENDING'});
    }catch{res.status(500).json({error:'İşlem bilgisi yüklenemedi.'});}
  });
  const reconcile = async invoice => {
    const before = (await pool.query('SELECT * FROM payment_transactions WHERE merchant_oid=$1',[invoice])).rows[0];
    if (!before) throw fail('İşlem kaydı bulunamadı.',404);
    if (paid(before.status)) return before;
    const provider = await checkSipay(before,generateHash);
    if (provider === 'PENDING') return before;
    const client = await pool.connect(); let changed = false;
    let row;
    try {
      await client.query('BEGIN');
      row = (await client.query('SELECT * FROM payment_transactions WHERE merchant_oid=$1 FOR UPDATE',[invoice])).rows[0];
      if (!row) throw fail('İşlem kaydı bulunamadı.',404);
      if (!paid(row.status)) {
        if (cents(row.amount) !== cents(before.amount) || row.action_type !== before.action_type
          || row.user_id !== before.user_id || JSON.stringify(row.action_data) !== JSON.stringify(before.action_data)) throw fail('İşlem doğrulama sırasında değişti.');
        if (provider === 'SUCCESS') { await applyAction(client,row); changed = true; }
        row = (await client.query('UPDATE payment_transactions SET status=$1,updated_at=NOW() WHERE merchant_oid=$2 RETURNING *',[provider,invoice])).rows[0];
      }
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
    // Email is a notification after a committed action; it cannot roll back payment state.
    if (changed && row.action_type === 'event_registration' && onEventPaid) {
      void onEventPaid(row).catch(() => console.error('Committed event payment email could not be sent.'));
    }
    return row;
  };
  const publicStatus = row => ({ invoice_id: row.merchant_oid, status: row.status, amount: Number(row.amount), action_type: row.action_type });
  app.post('/api/payment/status', async (req,res) => {
    try {
      const { invoiceId, receiptToken } = req.body;
      if (!validInvoice(invoiceId)) throw fail('Geçersiz işlem.',400);
      const row = (await pool.query('SELECT * FROM payment_transactions WHERE merchant_oid=$1',[invoiceId])).rows[0];
      let allowed = false;
      try {
        if (typeof receiptToken === 'string') { const receipt = jwt.verify(receiptToken,`${secret}:payment-receipt`,{audience:'e4n-payment-receipt'}); allowed = receipt.invoice === invoiceId; }
        else { const token=req.headers.authorization?.split(' ')[1]; const user=jwt.verify(token || '',secret); allowed=!!row?.user_id && row.user_id===user.id; }
      } catch { /* No data is returned for invalid credentials. */ }
      if (!row || !allowed) throw fail('İşlem bulunamadı.',404);
      res.json(publicStatus(await reconcile(invoiceId)));
    } catch (error) { res.status(error.status || 502).json({error:error.status ? error.message : 'Ödeme sonucu doğrulanamadı.'}); }
  });
  const callback = async (req,res) => {
    const invoice = req.method === 'GET' ? req.query.invoice_id : req.body.invoice_id;
    let status='pending', message='Ödeme sonucu doğrulanamadı. İşlem durumunu kontrol edin.', http=200;
    try {
      if (!validInvoice(invoice)) throw fail('Geçersiz işlem.',400);
      const row = await reconcile(invoice);
      status=paid(row.status)?'success':row.status==='FAILED'?'fail':'pending';
      if(status==='fail')message='Ödeme sağlayıcısı işlemi başarısız olarak doğruladı.';
    } catch(error) { http=error.status || 502; }
    const payload=JSON.stringify({status,invoice_id:validInvoice(invoice)?invoice:null,message}).replace(/</g,'\\u003c');
    res.status(http).type('html').send(`<html><body><script>if(window.opener)window.opener.postMessage(${payload},"*");window.close();</script></body></html>`);
  };
  for(const outcome of ['success','fail']) {
    app.post(`/api/payment/sipay-callback/${outcome}`,callback);
    app.get(`/api/payment/sipay-callback/${outcome}`,callback);
  }
  return reconcile;
}
