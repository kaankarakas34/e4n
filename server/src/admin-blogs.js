const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const fields=['title','slug','content','excerpt','featured_image','featured_image_alt','category_id','tags','status','meta_title','meta_description','focus_keyword','secondary_keywords','canonical_url','robots','schema_type','include_in_sitemap','sitemap_priority','change_frequency','og_title','og_description','cluster_key','pillar_slug','related_slugs','editorial_brief','image_rights_source','author_id'];
const defaults={excerpt:'',content:'',status:'draft',robots:'index, follow',schema_type:'BlogPosting',include_in_sitemap:true,sitemap_priority:0.7,change_frequency:'monthly',tags:[],secondary_keywords:[],cluster_key:null,pillar_slug:null,related_slugs:[],editorial_brief:'',image_rights_source:'',author_id:null};
import {textContent} from '../../src/seo/contentMetadata.mjs';
import {publicBlogColumns,blogLinks} from './blog-links.mjs';
import {parseBlogImage,prepareBlogImage,storeBlogImage} from './blog-images.mjs';
function payload(body){
 if(!body || typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>![...fields,'revision','reviewConfirmed'].includes(k)))throw Object.assign(new Error('Geçersiz yazı alanları.'),{status:400});
 const data={...defaults,...Object.fromEntries(fields.filter(k=>body[k]!==undefined).map(k=>[k,body[k]]))};
 if(typeof data.title!=='string'||!data.title.trim()||data.title.length>255||typeof data.slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)||data.slug.length>255)throw Object.assign(new Error('Başlık ve benzersiz URL gerekli.'),{status:400});
 for(const f of fields.filter(f=>!['category_id','tags','secondary_keywords','related_slugs','include_in_sitemap','sitemap_priority'].includes(f)))if(data[f]!=null && (typeof data[f]!=='string'||data[f].length>(f==='content'?200000:['excerpt','editorial_brief'].includes(f)?5000:2048)))throw Object.assign(new Error('Metin alanı geçersiz.'),{status:400});
 for(const [f,max] of Object.entries({featured_image_alt:255,meta_title:255,meta_description:500,focus_keyword:255,canonical_url:500,og_title:255,og_description:500}))if(data[f]?.length>max)throw Object.assign(new Error('Alan uzunluk sınırı aşıldı: '+f),{status:400});
 if(!['draft','published','scheduled','archived'].includes(data.status)||!['index, follow','noindex, follow','index, nofollow','noindex, nofollow'].includes(data.robots)||!['BlogPosting','Article','NewsArticle'].includes(data.schema_type))throw Object.assign(new Error('Yayın/SEO seçimi geçersiz.'),{status:400});
 for(const f of ['tags','secondary_keywords'])if(!Array.isArray(data[f])||data[f].length>30||data[f].some(v=>typeof v!=='string'||v.length>160))throw Object.assign(new Error('Etiket alanı geçersiz.'),{status:400});
 for(const f of ['featured_image','canonical_url'])if(data[f]){let url;try{url=new URL(data[f]);}catch{throw Object.assign(new Error('Görsel/canonical tam URL olmalı.'),{status:400});}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Object.assign(new Error('Görsel/canonical URL geçersiz.'),{status:400});}
 if(data.category_id!=null&&!uuid(data.category_id))throw Object.assign(new Error('Kategori geçersiz.'),{status:400});
 if(typeof data.include_in_sitemap!=='boolean'||typeof data.sitemap_priority!=='number'||data.sitemap_priority<0||data.sitemap_priority>1)throw Object.assign(new Error('Sitemap seçimi geçersiz.'),{status:400});
 if(data.robots.includes('noindex'))data.include_in_sitemap=false;
 if(data.status==='published'&&(textContent(data.content).length<80||!data.meta_description?.trim()||body.reviewConfirmed!==true))throw Object.assign(new Error('Yayın için içerik, açıklama ve uzman inceleme onayı gerekli.'),{status:400});
 if(data.featured_image&&!data.featured_image_alt?.trim())throw Object.assign(new Error('Görsel alternatif metni gerekli.'),{status:400});
 if(data.cluster_key!==null&&!/^(0[1-9]|1[0-8])$/.test(data.cluster_key))throw Object.assign(new Error('İçerik kümesi geçersiz.'),{status:400});
 if(data.author_id!==null&&!uuid(data.author_id))throw Object.assign(new Error('Yazar geçersiz.'),{status:400});
 const slug=v=>typeof v==='string'&&v.length<=255&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
 if((data.pillar_slug!==null&&!slug(data.pillar_slug))||!Array.isArray(data.related_slugs)||data.related_slugs.length>6||data.related_slugs.some(v=>!slug(v))||new Set(data.related_slugs).size!==data.related_slugs.length||[data.pillar_slug,...data.related_slugs].includes(data.slug)||data.related_slugs.includes(data.pillar_slug))throw Object.assign(new Error('Ana rehber ve ilgili içerik seçimi geçersiz.'),{status:400});
 if(data.status==='published'&&(!data.cluster_key||!data.editorial_brief?.trim()))throw Object.assign(new Error('Yayın için küme ve içerik briefi gerekli.'),{status:400});
 if(data.featured_image&&!data.image_rights_source?.trim())throw Object.assign(new Error('Görsel kullanım izni/kaynağı gerekli.'),{status:400});
 return data;
}
async function validateReferences(c,data){
 if(data.author_id && !(await c.query("SELECT id FROM users WHERE id=$1 AND role='ADMIN' FOR SHARE",[data.author_id])).rows.length)throw Object.assign(new Error('Yazar mevcut bir yönetici olmalı; kurumsal yazar da seçebilirsiniz.'),{status:400});
 const slugs=[data.pillar_slug,...data.related_slugs].filter(Boolean);
 if(slugs.length && (await c.query("SELECT slug FROM blogs WHERE slug=ANY($1::text[]) AND status='published' FOR SHARE",[slugs])).rows.length!==slugs.length)throw Object.assign(new Error('Bağlantılar yalnız yayımlanmış yazılardan seçilmeli.'),{status:400});
}
export function installAdminBlogs(app,{pool,authenticateToken,imageStore=storeBlogImage}){
 const publicRead=`SELECT ${publicBlogColumns},json_build_object('name',u.name) AS author,json_build_object('name',c.name) AS category FROM blogs b LEFT JOIN users u ON u.id=b.author_id LEFT JOIN blog_categories c ON c.id=b.category_id WHERE b.status='published'`;
 app.get('/api/blogs',async(req,res)=>{res.set('Cache-Control','private, no-store');try{res.json((await pool.query(publicRead+' ORDER BY b.published_at DESC,b.id')).rows);}catch{res.status(503).json({error:'Yazılar yüklenemedi.'});}});
 app.get('/api/blogs/:slug',async(req,res)=>{res.set('Cache-Control','private, no-store');try{const blog=(await pool.query(publicRead+' AND b.slug=$1',[req.params.slug])).rows[0];if(!blog)return res.sendStatus(404);blog.links=await blogLinks(pool.query.bind(pool),blog.id);res.json(blog);}catch{res.status(503).json({error:'Yazı yüklenemedi.'});}});
 const route=fn=>async(req,res)=>{
  res.set('Cache-Control','private, no-store');if(!uuid(req.user?.id))return res.sendStatus(401);let client;
  try{client=await pool.connect();await client.query('BEGIN');const owner=(await client.query('SELECT role FROM users WHERE id=$1 FOR SHARE',[req.user.id])).rows[0];if(!owner){await client.query('ROLLBACK');return res.sendStatus(401);}if(owner.role!=='ADMIN'){await client.query('ROLLBACK');return res.sendStatus(403);}const result=await fn(req,client);await client.query('COMMIT');res.json({version:1,ownerId:req.user.id,...result});}
  catch(e){if(client)await client.query('ROLLBACK').catch(()=>{});res.status(e.status|| (e.code==='23505'?409:e.code==='23503'?400:500)).json({error:e.status?e.message:e.code==='23505'?'Bu URL zaten kullanılıyor.':e.code==='23503'?'Yazar/kategori kaydı bulunamadı.':'Yazı işlemi tamamlanamadı.'});}finally{client?.release();}
 };
 const read="SELECT b.*,b.sitemap_priority::float8 AS sitemap_priority,md5(to_jsonb(b)::text) AS revision FROM blogs b";
 app.get('/api/admin/blog-options',authenticateToken,route(async(req,c)=>({authors:(await c.query("SELECT id,name FROM users WHERE role='ADMIN' ORDER BY name,id")).rows,posts:(await c.query("SELECT id,title,slug,cluster_key FROM blogs WHERE status='published' ORDER BY title,id LIMIT 1000")).rows})));
 // Authorize with the current DB role before parsing an upload into memory.
 app.post('/api/admin/blog-images',authenticateToken,route(async(req)=>{
  await new Promise((resolve,reject)=>parseBlogImage(req,req.res,error=>error?reject(Object.assign(new Error(error.code==='LIMIT_FILE_SIZE'?'Görsel en fazla 4 MB olabilir.':'Tek bir kapak görseli seçin.'),{status:400})):resolve()));
  const image=await prepareBlogImage(req.file);return {image:await imageStore(image)};
 }));
 app.get('/api/admin/blogs',authenticateToken,route(async(req,c)=>({blogs:(await c.query(read+' ORDER BY b.created_at DESC,b.id LIMIT 1000')).rows})));
 app.get('/api/admin/blogs/:id',authenticateToken,route(async(req,c)=>{if(!uuid(req.params.id))throw Object.assign(new Error('Yazı bulunamadı.'),{status:404});const blog=(await c.query(read+' WHERE b.id=$1',[req.params.id])).rows[0];if(!blog)throw Object.assign(new Error('Yazı bulunamadı.'),{status:404});return{blog};}));
 app.post('/api/admin/blogs',authenticateToken,route(async(req,c)=>{const data=payload(req.body);await validateReferences(c,data);const keys=fields.filter(k=>data[k]!==undefined);const result=await c.query(`INSERT INTO blogs (${keys.join(',')},published_at,reviewed_by,reviewed_at) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')},CASE WHEN $${keys.length+1}::boolean THEN now() ELSE NULL END,CASE WHEN $${keys.length+1}::boolean THEN $${keys.length+2}::uuid ELSE NULL END,CASE WHEN $${keys.length+1}::boolean THEN now() ELSE NULL END) RETURNING id`,[...keys.map(k=>data[k]),data.status==='published',req.user.id]);return {blog:(await c.query(read+' WHERE b.id=$1',[result.rows[0].id])).rows[0]};}));
 app.put('/api/admin/blogs/:id',authenticateToken,route(async(req,c)=>{
  if(!uuid(req.params.id))throw Object.assign(new Error('Yazı bulunamadı.'),{status:404});const old=(await c.query(read+' WHERE b.id=$1 FOR UPDATE',[req.params.id])).rows[0];if(!old)throw Object.assign(new Error('Yazı bulunamadı.'),{status:404});if(req.body?.revision!==old.revision)throw Object.assign(new Error('Yazı başka bir oturumda değişti. Güncel kaydı yükleyin.'),{status:409});
  const data=payload(req.body);if(old.published_at && data.slug!==old.slug)throw Object.assign(new Error('Yayımlanmış URL için yönlendirme kararı gerekli.'),{status:409});await validateReferences(c,data);const keys=fields.filter(k=>data[k]!==undefined);await c.query(`UPDATE blogs SET ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')},updated_at=now(),published_at=CASE WHEN $${keys.length+1}::boolean THEN COALESCE(published_at,now()) ELSE published_at END,reviewed_by=CASE WHEN $${keys.length+1}::boolean THEN $${keys.length+3}::uuid ELSE NULL END,reviewed_at=CASE WHEN $${keys.length+1}::boolean THEN now() ELSE NULL END WHERE id=$${keys.length+2}`,[...keys.map(k=>data[k]),data.status==='published',old.id,req.user.id]);return{blog:(await c.query(read+' WHERE b.id=$1',[old.id])).rows[0]};
 }));
 app.post('/api/admin/blogs/:id/archive',authenticateToken,route(async(req,c)=>{
  if(!uuid(req.params.id))throw Object.assign(new Error('Yazı bulunamadı.'),{status:404});const old=(await c.query(read+' WHERE b.id=$1 FOR UPDATE',[req.params.id])).rows[0];if(!old)throw Object.assign(new Error('Yazı bulunamadı.'),{status:404});if(req.body?.revision!==old.revision)throw Object.assign(new Error('Güncel yazıyı yükleyin.'),{status:409});await c.query("UPDATE blogs SET status='archived',include_in_sitemap=FALSE,updated_at=now() WHERE id=$1",[old.id]);return{blog:(await c.query(read+' WHERE b.id=$1',[old.id])).rows[0]};
 }));
}
