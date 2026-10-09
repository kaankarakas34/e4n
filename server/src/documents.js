import multer from 'multer';
import {createHash} from 'node:crypto';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const roles=['ADMIN','PRESIDENT','VICE_PRESIDENT','MEMBER','SECRETARY_TREASURER'];
const categories=['GENERAL','EDUCATION','LEGAL','MARKETING'];
const fail=(status,message)=>Object.assign(new Error(message),{status});
const columns='id,title,description,category,filename,mime_type,size_bytes,uploaded_by,allowed_roles,created_at,archived_at';
const visible=(d,u)=>u.role==='ADMIN'||d.uploaded_by===u.id||!d.allowed_roles.length||d.allowed_roles.includes(u.role);
const removable=(d,u)=>u.role==='ADMIN'||d.uploaded_by===u.id;
const output=(d,u)=>{const {archived_at,...row}=d;return {...row,canArchive:removable(d,u)};};
export function installDocuments(app,{pool,authenticateToken}){
  const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:3*1024*1024,files:1,fields:5,fieldSize:4096}}).single('file');
  const route=fn=>async(req,res)=>{
    res.set('Cache-Control','private, no-store');let c;
    try{
      if(!uuid(req.user.id))throw fail(401,'Oturum doğrulanamadı.');
      c=await pool.connect();await c.query(req.method==='GET'?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN');
      const {rows:[u]}=await c.query('SELECT id,role FROM users WHERE id=$1',[req.user.id]);if(!u)throw fail(401,'Oturum doğrulanamadı.');
      const result=await fn(req,c,u);await c.query('COMMIT');
      if(result.bytes){res.set({'Content-Type':result.doc.mime_type,'X-Content-Type-Options':'nosniff','Content-Disposition':`attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(result.doc.filename)}`});res.send(result.bytes);}else res.json(result);
    }catch(e){if(c)await c.query('ROLLBACK').catch(()=>{});if(!e.status)console.error('Document operation failed:',e.message);res.status(e.status||500).json({error:e.status?e.message:'Belge işlemi tamamlanamadı. Yeniden deneyin.'});}finally{c?.release();}
  };
  app.get('/api/documents',authenticateToken,route(async(req,c,u)=>{
    if(Object.keys(req.query).length)throw fail(400,'Geçersiz belge sorgusu.');
    const {rows}=await c.query(`SELECT ${columns} FROM document_library WHERE archived_at IS NULL AND ($2='ADMIN' OR uploaded_by=$1 OR cardinality(allowed_roles)=0 OR $2=ANY(allowed_roles)) ORDER BY created_at DESC,id DESC`,[u.id,u.role]);
    return {ownerId:u.id,canUpload:['ADMIN','PRESIDENT'].includes(u.role),documents:rows.map(d=>output(d,u))};
  }));
  app.post('/api/documents',authenticateToken,(req,res,next)=>upload(req,res,e=>e?res.status(400).json({error:'Tek bir PDF, PNG veya JPEG dosyası seçin (en fazla 3 MB).'}):next()),route(async(req,c,u)=>{
    if(!['ADMIN','PRESIDENT'].includes(u.role))throw fail(403,'Belge yükleme yetkiniz yok.');
    const {title,description='',category,requestKey}=req.body;let allowed;
    try{allowed=JSON.parse(req.body.allowed_roles);}catch{throw fail(400,'Görünürlük rolleri geçersiz.');}
    if(Object.keys(req.body).some(k=>!['title','description','category','requestKey','allowed_roles'].includes(k))||!uuid(requestKey)||typeof title!=='string'||!title.trim()||title.length>200||typeof description!=='string'||description.length>2000||!categories.includes(category)||!Array.isArray(allowed)||allowed.some(r=>!roles.includes(r))||new Set(allowed).size!==allowed.length)throw fail(400,'Belge alanları geçersiz.');
    const f=req.file;if(f){const decoded=Buffer.from(f.originalname,'latin1').toString('utf8');if(!decoded.includes('\uFFFD'))f.originalname=decoded;}if(!f||!f.size||/[\x00-\x1f\x7f/\\]/.test(f.originalname)||f.originalname.length>180)throw fail(400,'Dosya adı veya içeriği geçersiz.');
    const b=f.buffer;const mime=b.subarray(0,5).toString()==='%PDF-'?'application/pdf':b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':null;
    const extension=mime==='application/pdf'?/\.pdf$/i:mime==='image/png'?/\.png$/i:/\.jpe?g$/i;
    if(!mime||!extension.test(f.originalname))throw fail(400,'Desteklenen PDF, PNG veya JPEG dosyası gerekiyor.');
    allowed.sort();const digest=createHash('sha256').update(b).digest('hex');
    const fingerprint=createHash('sha256').update(JSON.stringify([title.trim(),description.trim(),category,f.originalname,mime,digest,allowed])).digest('hex');
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[`document:${u.id}:${requestKey.toLowerCase()}`]);
    const old=(await c.query(`SELECT ${columns},fingerprint FROM document_library WHERE uploaded_by=$1 AND request_key=$2`,[u.id,requestKey])).rows[0];
    if(old){if(old.fingerprint!==fingerprint||old.archived_at)throw fail(409,'Bu gönderim anahtarı başka veya kaldırılmış bir belgeye ait.');const {fingerprint:_,...d}=old;return{ownerId:u.id,document:output(d,u),replay:true};}
    const {rows:[d]}=await c.query(`INSERT INTO document_library(title,description,category,filename,mime_type,size_bytes,uploaded_by,allowed_roles,request_key,fingerprint) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${columns}`,[title.trim(),description.trim(),category,f.originalname,mime,f.size,u.id,allowed,requestKey,fingerprint]);
    await c.query('INSERT INTO document_files(document_id,content) VALUES($1,$2)',[d.id,b]);return {ownerId:u.id,document:output(d,u),replay:false};
  }));
  app.get('/api/documents/:id/download',authenticateToken,route(async(req,c,u)=>{
    if(!uuid(req.params.id))throw fail(400,'Geçersiz belge.');
    const d=(await c.query(`SELECT ${columns} FROM document_library WHERE id=$1 AND archived_at IS NULL`,[req.params.id])).rows[0];
    if(!d||!visible(d,u))throw fail(404,'Belge bulunamadı.');
    const f=(await c.query('SELECT content FROM document_files WHERE document_id=$1',[d.id])).rows[0];if(!f||f.content.length!==d.size_bytes)throw fail(500,'Belge dosyası doğrulanamadı.');return {doc:d,bytes:f.content};
  }));
  app.delete('/api/documents/:id',authenticateToken,route(async(req,c,u)=>{
    if(!uuid(req.params.id))throw fail(400,'Geçersiz belge.');
    const d=(await c.query(`SELECT ${columns} FROM document_library WHERE id=$1 FOR UPDATE`,[req.params.id])).rows[0];if(!d)throw fail(404,'Belge bulunamadı.');if(!removable(d,u))throw fail(403,'Belgeyi kaldırma yetkiniz yok.');
    await c.query('UPDATE document_library SET archived_at=COALESCE(archived_at,now()) WHERE id=$1',[d.id]);return {ownerId:u.id,id:d.id,archived:true,replay:!!d.archived_at};
  }));
}
