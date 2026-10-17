import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import {createContentHandler} from '../src/public-content-seo.mjs';
import {publicBlogColumns,blogLinks} from '../src/blog-links.mjs';
import {storeBlogImage} from '../src/blog-images.mjs';
import {installAdminBlogs} from '../src/admin-blogs.js';
const bin='C:/Program Files/PostgreSQL/15/bin',dir=resolve('output/blog-cms-pg-'+randomUUID().slice(0,8));mkdirSync(dir,{recursive:true});
const temporary=createServer();await new Promise(r=>temporary.listen(0,'127.0.0.1',r));const port=temporary.address().port;await new Promise(r=>temporary.close(r));
const user='e4n_local_fixture',secret='local_fixture_signing_key_32_characters_only';let started=false,pool,http,vite;
const run=(name,args)=>execFileSync(bin+'/'+name+'.exe',args,{windowsHide:true,timeout:30000,stdio:'ignore'});
try{
 run('initdb',['-D',dir,'-U',user,'-A','trust','-E','UTF8','--locale=C']);run('pg_ctl',['-D',dir,'-l',dir+'/postgres.log','-o',`-p ${port} -h 127.0.0.1`,'-w','start']);started=true;
 pool=new pg.Pool({host:'127.0.0.1',port,user,database:'postgres'});const dataDir=(await pool.query('SHOW data_directory')).rows[0].data_directory;assert.equal(resolve(dataDir),dir,'Isolated data directory must match before any fixture SQL');
 await pool.query('CREATE TABLE users(id UUID PRIMARY KEY,name TEXT,role TEXT);');const migration=readFileSync('server/migrations/0003_legacy_tables.sql','utf8');await pool.query(migration.slice(migration.indexOf('CREATE TABLE IF NOT EXISTS blog_categories')));
 assert.deepEqual((await pool.query('SELECT '+publicBlogColumns+' FROM blogs b')).rows,[]);assert.deepEqual(await blogLinks(pool.query.bind(pool),randomUUID()),[]);
 await pool.query(readFileSync('server/supabase/migrations/20261017071555_blog_editorial_workflow.sql','utf8'));
 const admin=randomUUID(),member=randomUUID(),deleted=randomUUID();await pool.query('INSERT INTO users VALUES($1,$2,$3),($4,$5,$6)',[admin,'Fixture Admin','ADMIN',member,'Fixture Member','MEMBER']);
 const app=express();app.use(express.json());const authenticateToken=(req,res,next)=>{const t=req.headers.authorization?.slice(7);if(!t)return res.sendStatus(401);try{req.user=jwt.verify(t,secret);next();}catch{res.sendStatus(403);}};let imageWrites=0;installAdminBlogs(app,{pool,authenticateToken,imageStore:async image=>{imageWrites++;const meta=await sharp(image.buffer).metadata();assert.equal(meta.format,'webp');assert(meta.width<=1600);assert(!meta.exif);return{url:'https://fixture.invalid/covers/cover.webp',width:meta.width,height:meta.height};}});http=app.listen(0,'127.0.0.1');await new Promise(r=>http.on('listening',r));const base='http://127.0.0.1:'+http.address().port;
 const token=id=>jwt.sign({id,role:'ADMIN'},secret);const rows=[];
 async function request(path,method='GET',body,id=admin){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(id?{Authorization:'Bearer '+token(id)}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();let data;try{data=JSON.parse(text);}catch{}rows.push({path,method,status:r.status});return{status:r.status,data};}
 assert.equal((await request('/api/admin/blogs','GET',null,null)).status,401);assert.equal((await request('/api/admin/blogs','GET',null,member)).status,403);assert.equal((await request('/api/admin/blogs','GET',null,deleted)).status,401);
 const draft={title:'Fixture Article',slug:'fixture-article',content:'<p>'+('Useful original content. '.repeat(10))+'</p>',status:'draft',meta_description:'Fixture description',cluster_key:'02',editorial_brief:'Private brief: verify original sources and registration CTA.'};
 const create=await request('/api/admin/blogs','POST',draft);assert.equal(create.status,200);let blog=create.data.blog;assert.equal(create.data.ownerId,admin);assert.equal(blog.author_id,null);assert.equal(blog.published_at,null);assert.match(blog.revision,/^[0-9a-f]{32}$/);
 assert.equal((await request('/api/admin/blogs','POST',draft)).status,409);assert.equal((await request('/api/blogs','GET',null,null)).data.length,0);assert.equal((await request('/api/blogs/fixture-article','GET',null,null)).status,404);
 const fields=Object.fromEntries(Object.keys(draft).map(k=>[k,blog[k]]));assert.equal((await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,status:'published',revision:blog.revision})).status,400);
 assert.equal((await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,author_id:member,revision:blog.revision})).status,400);
 const publish=await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,status:'published',revision:blog.revision,reviewConfirmed:true});assert.equal(publish.status,200);const old=blog;blog=publish.data.blog;assert(blog.published_at);assert.notEqual(blog.revision,old.revision);assert.equal((await request('/api/blogs','GET',null,null)).data.length,1);
 const publicRead=await request('/api/blogs/fixture-article','GET',null,null);assert.equal(publicRead.status,200);assert.equal(publicRead.data.status,'published');assert.equal(publicRead.data.author.name,null);assert(!('editorial_brief' in publicRead.data));assert(!('image_rights_source' in publicRead.data));assert(!('reviewed_by' in publicRead.data));assert.equal(blog.reviewed_by,admin);assert(blog.reviewed_at);
 assert.equal((await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,status:'published',revision:old.revision,reviewConfirmed:true})).status,409);
 assert.equal((await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,slug:'changed-published-url',status:'published',revision:blog.revision,reviewConfirmed:true})).status,409);
 assert.equal((await request('/api/admin/blogs','POST',{...draft,slug:'another',canonical_url:'javascript:alert(1)'})).status,400);
 const options=await request('/api/admin/blog-options');assert.equal(options.data.authors.length,1);assert.equal(options.data.authors[0].id,admin);
 for(const patch of [{cluster_key:'19'},{related_slugs:['fixture-article','fixture-article']},{related_slugs:['missing-post']},{editorial_brief:'',status:'published',reviewConfirmed:true},{reviewed_by:admin},{meta_title:'x'.repeat(256)},{featured_image:'https://fixture.invalid/img.webp',featured_image_alt:'Cover'}])assert.equal((await request('/api/admin/blogs','POST',{...draft,slug:'bad-'+randomUUID().slice(0,8),...patch})).status,400);
 const support=await request('/api/admin/blogs','POST',{...draft,slug:'support-article',status:'published',reviewConfirmed:true,author_id:admin,pillar_slug:blog.slug});assert.equal(support.status,200);assert.equal(support.data.blog.author_id,admin);
 const linked=await request('/api/blogs/support-article','GET',null,null);assert.deepEqual(linked.data.links,[{slug:blog.slug,title:blog.title,kind:'pillar'}]);
 const htmlHandler=createContentHandler({query:pool.query.bind(pool),loadTemplate:async()=>'<html><head></head><body><div id="root"></div></body></html>'});
 let html='';const httpResponse={setHeader(){},end(value){html=value;},statusCode:0};await htmlHandler({url:'/blog/support-article',method:'GET'},httpResponse);assert.equal(httpResponse.statusCode,200);assert(html.includes('href="/blog/fixture-article"'));assert(!html.includes('Private brief'));
 const imageBuffer=await sharp({create:{width:2000,height:1000,channels:3,background:'#aa2233'}}).png().toBuffer();
 async function upload(buffer,id=admin,type='image/png'){
  const form=new FormData();form.append('image',new Blob([buffer],{type}),'cover.png');const response=await fetch(base+'/api/admin/blog-images',{method:'POST',headers:id?{Authorization:'Bearer '+token(id)}:{},body:form});rows.push({path:'/api/admin/blog-images',method:'POST',status:response.status});return{status:response.status,data:await response.json().catch(()=>null)};
 }
 assert.equal((await upload(imageBuffer,null)).status,401);assert.equal((await upload(imageBuffer,member)).status,403);assert.equal((await upload(imageBuffer,deleted)).status,401);assert.equal(imageWrites,0);
 assert.equal((await upload(Buffer.from('<svg/>'),admin,'image/svg+xml')).status,400);
 assert.equal((await upload(Buffer.from('not a png'))).status,400);
 assert.equal((await upload(await sharp({create:{width:200,height:100,channels:3,background:'#fff'}}).png().toBuffer())).status,400);
 assert.equal((await upload(Buffer.alloc(4*1024*1024+1))).status,400);
 assert.equal((await upload(await sharp({create:{width:5000,height:5000,channels:3,background:'#fff'}}).png().toBuffer())).status,400);
 const uploaded=await upload(imageBuffer);assert.equal(uploaded.status,200,JSON.stringify(uploaded.data));assert.equal(uploaded.data.image.width,1600);assert.equal(imageWrites,1);
 let storageCall;const stored=await storeBlogImage({buffer:Buffer.from('fixture'),width:800,height:400},{env:{SUPABASE_URL:'https://storage.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-server-only'},fetcher:async(url,options)=>{storageCall={url:String(url),options};return{ok:true};}});assert(stored.url.startsWith('https://storage.invalid/storage/v1/object/public/blog-images/covers/'));assert.equal(storageCall.options.headers['x-upsert'],'false');assert.equal(storageCall.options.headers.Authorization,'Bearer fixture-server-only');assert(!JSON.stringify(stored).includes('fixture-server-only'));
 await assert.rejects(()=>storeBlogImage({},{env:{}}),error=>error.status===503);
 await assert.rejects(()=>storeBlogImage({buffer:Buffer.from('fixture')},{env:{SUPABASE_URL:'https://storage.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture-server-only'},fetcher:async()=>({ok:false})}),error=>error.status===503);
 const archived=await request('/api/admin/blogs/'+blog.id+'/archive','POST',{revision:blog.revision});assert.equal(archived.status,200);assert.equal(archived.data.blog.status,'archived');assert.equal((await request('/api/blogs/fixture-article','GET',null,null)).status,404);assert.equal((await pool.query('SELECT count(*)::int AS n FROM blogs')).rows[0].n,2);assert.deepEqual((await request('/api/blogs/support-article','GET',null,null)).data.links,[]);
 await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await request('/api/admin/blogs','POST',{...draft,slug:'demoted-admin'})).status,403);
 if(process.argv.includes('--browser-fixture')){
  await pool.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);
  const {preview}=await import('vite');
  vite=await preview({root:process.cwd(),preview:{host:'127.0.0.1',port:0,proxy:{'/api':base}},logLevel:'error'});
  const webBase='http://127.0.0.1:'+vite.httpServer.address().port;
  const stopKey=randomUUID();const expire=setTimeout(()=>stop(),20*60*1000);let stop;const stopped=new Promise(resolve=>{stop=resolve;});app.post('/__fixture/stop',(req,res)=>{if(req.headers['x-fixture-key']!==stopKey)return res.sendStatus(403);res.json({ok:true});stop();});
  writeFileSync('output/seo-cms-17-browser-fixture.json',JSON.stringify({webBase,apiBase:base,admin:{id:admin,name:'Fixture Admin',role:'ADMIN'},token:token(admin),stopKey}));console.log('CMS_BROWSER_FIXTURE_READY '+webBase);
  await stopped;clearTimeout(expire);vite.httpServer.closeAllConnections();await new Promise(resolve=>vite.httpServer.close(resolve));vite=null;
 }
 writeFileSync('output/blog-cms-contract-result.json',JSON.stringify({scope:'Isolated local PostgreSQL15 instance, fresh exact CMS migration tables; no production connection',rows,tests:{dbRoleGate:true,draftHidden:true,publicationReview:true,organizationAuthor:true,revisionConflict:true,publishedSlugProtected:true,recoverableArchive:true,adminDemotion:true,noRlsChanges:true,editorialPrivacy:true,pillarPublishedOnly:true,serverImageGate:true,imageBounds:true,serverStorageSecretBoundary:true}},null,2));console.log('Blog CMS contract PASS: '+rows.length+' requests; isolated PostgreSQL15; role/draft/review/revision/archive/slug/public-read boundaries.');
}finally{if(vite){vite.httpServer.closeAllConnections();await new Promise(resolve=>vite.httpServer.close(resolve));}if(http)await new Promise(r=>http.close(r));if(pool)await pool.end();if(started)run('pg_ctl',['-D',dir,'-m','fast','-w','stop']);}
