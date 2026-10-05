import multer from 'multer';
import {createHash} from 'node:crypto';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const fail=(status,message)=>Object.assign(new Error(message),{status});
const metadata='id,member_id,visitor_id,uploaded_by,filename,size_bytes,email_state,created_at,request_key';
const receipt=(d,owner,replay)=>({success:true,ownerId:owner,targetType:d.member_id?'MEMBER':'VISITOR',targetId:d.member_id||d.visitor_id,requestKey:d.request_key,invoiceId:d.id,invoice_url:`/api/invoices/${d.id}`,filename:d.filename,size_bytes:d.size_bytes,emailState:d.email_state,replay});
export function installInvoices(app,{pool,authenticateToken,sendEmail}){
 const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:3145728,files:1,fields:1,fieldSize:128}}).single('invoice');
 const owner=async(c,req)=>{if(!uuid(req.user.id))throw fail(401,'Oturum doğrulanamadı.');const u=(await c.query('SELECT id,role FROM users WHERE id=$1',[req.user.id])).rows[0];if(!u)throw fail(401,'Oturum doğrulanamadı.');return u;};
 app.post('/api/admin/accounting/:type/:id/upload-invoice',authenticateToken,(req,res,next)=>{
   res.set('Cache-Control','private, no-store');upload(req,res,e=>e?res.status(400).json({error:'Tek PDF dosyası gerekiyor (en fazla 3 MB).'}):next());
 },async(req,res)=>{
   let c,committed=false;
   try{
     c=await pool.connect();await c.query('BEGIN');const u=await owner(c,req);if(u.role!=='ADMIN'||req.user.role!=='ADMIN')throw fail(403,'Yönetici yetkisi gerekiyor.');
     const {type,id}=req.params,key=req.body.requestKey,f=req.file;
     if(!['MEMBER','VISITOR'].includes(type)||!uuid(id)||!uuid(key)||Object.keys(req.body).some(k=>k!=='requestKey'))throw fail(400,'Fatura hedefi veya gönderim anahtarı geçersiz.');
     if(f){const decoded=Buffer.from(f.originalname,'latin1').toString('utf8');if(!decoded.includes('\uFFFD'))f.originalname=decoded;}
     if(!f||!f.size||!f.buffer.subarray(0,5).equals(Buffer.from('%PDF-'))||!/\.pdf$/i.test(f.originalname)||f.originalname.length>180||/[\x00-\x1f\x7f/\\]/.test(f.originalname))throw fail(400,'Geçerli bir PDF dosyası seçin.');
     const fingerprint=createHash('sha256').update(JSON.stringify([type,id.toLowerCase(),f.originalname])).update(f.buffer).digest('hex');
     await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`invoice:${u.id}:${key.toLowerCase()}`]);
     const old=(await c.query(`SELECT ${metadata},fingerprint FROM invoice_files WHERE uploaded_by=$1 AND request_key=$2`,[u.id,key])).rows[0];
     if(old){if(old.fingerprint!==fingerprint)throw fail(409,'Anahtar başka bir faturaya ait.');await c.query('COMMIT');committed=true;return res.json(receipt(old,u.id,true));}
     const member=type==='MEMBER';
     const target=(await c.query(member?"SELECT id,email FROM users WHERE id=$1 AND subscription_plan IS NOT NULL AND subscription_end_date IS NOT NULL FOR UPDATE":"SELECT id,email FROM public_visitors WHERE id=$1 AND kvkk_accepted=true AND source='visitor_payment' AND form_data->>'payment_status'='PAID' FOR UPDATE",[id])).rows[0];
     if(!target)throw fail(404,'Muhasebe kaydı bulunamadı.');
     const {rows:[d]}=await c.query(`INSERT INTO invoice_files(member_id,visitor_id,uploaded_by,request_key,fingerprint,filename,size_bytes,content,email_state) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${metadata}`,[member?id:null,member?null:id,u.id,key,fingerprint,f.originalname,f.size,f.buffer,target.email?'ATTEMPTED':'NO_ADDRESS']);
     const url=`/api/invoices/${d.id}`;
     await c.query(member?'UPDATE users SET subscription_invoice_url=$1,subscription_invoice_issued=true WHERE id=$2':'UPDATE public_visitors SET invoice_url=$1,invoice_issued=true WHERE id=$2',[url,id]);
     await c.query('COMMIT');committed=true;c.release();c=null;
     // Claim the one notification attempt in the transaction. Replays never resend.
     if(target.email){let state='UNKNOWN';try{const result=await sendEmail(target.email,'Event4Network - Ödeme Faturanız','<p>Fatura belgeniz ektedir.</p>',[{filename:f.originalname,content:f.buffer,contentType:'application/pdf'}]);if(result?.success===true)state='SENT';}catch{/* An SMTP error can occur after delivery: no automatic resend. */}
       try{await pool.query('UPDATE invoice_files SET email_state=$1 WHERE id=$2',[state,d.id]);d.email_state=state;}catch{d.email_state='ATTEMPTED';}
     }
     res.json(receipt(d,u.id,false));
   }catch(e){if(c&&!committed)await c.query('ROLLBACK').catch(()=>{});if(!e.status)console.error('Invoice operation failed:',e.message);res.status(e.status||500).json({error:e.status?e.message:'Fatura işlemi doğrulanamadı. Aynı gönderimi tekrar kontrol edin.'});}finally{c?.release();}
 });
 app.get('/api/invoices/:id',authenticateToken,async(req,res)=>{
   res.set('Cache-Control','private, no-store');let c;
   try{c=await pool.connect();await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');const u=await owner(c,req);if(!uuid(req.params.id))throw fail(400,'Geçersiz fatura.');
     const d=(await c.query(`SELECT ${metadata} FROM invoice_files WHERE id=$1`,[req.params.id])).rows[0];if(!d||u.role!=='ADMIN'&&d.member_id!==u.id)throw fail(404,'Fatura bulunamadı.');
     const bytes=(await c.query('SELECT content FROM invoice_files WHERE id=$1',[d.id])).rows[0]?.content;if(!bytes||bytes.length!==d.size_bytes)throw fail(500,'Fatura dosyası doğrulanamadı.');await c.query('COMMIT');
     res.set({'Content-Type':'application/pdf','X-Content-Type-Options':'nosniff','Content-Disposition':`attachment; filename="invoice.pdf"; filename*=UTF-8''${encodeURIComponent(d.filename)}`});res.send(bytes);
   }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});res.status(e.status||500).json({error:e.status?e.message:'Fatura indirilemedi.'});}finally{c?.release();}
 });
}
