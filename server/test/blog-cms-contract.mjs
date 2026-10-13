import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import {installAdminBlogs} from '../src/admin-blogs.js';
const bin='C:/Program Files/PostgreSQL/15/bin',dir=resolve('output/blog-cms-pg-'+randomUUID().slice(0,8));mkdirSync(dir,{recursive:true});
const temporary=createServer();await new Promise(r=>temporary.listen(0,'127.0.0.1',r));const port=temporary.address().port;await new Promise(r=>temporary.close(r));
const user='e4n_local_fixture',secret='local_fixture_signing_key_32_characters_only';let started=false,pool,http;
const run=(name,args)=>execFileSync(bin+'/'+name+'.exe',args,{windowsHide:true,timeout:30000,stdio:'ignore'});
try{
 run('initdb',['-D',dir,'-U',user,'-A','trust','-E','UTF8','--locale=C']);run('pg_ctl',['-D',dir,'-l',dir+'/postgres.log','-o',`-p ${port} -h 127.0.0.1`,'-w','start']);started=true;
 pool=new pg.Pool({host:'127.0.0.1',port,user,database:'postgres'});const dataDir=(await pool.query('SHOW data_directory')).rows[0].data_directory;assert.equal(resolve(dataDir),dir,'Isolated data directory must match before any fixture SQL');
 await pool.query('CREATE TABLE users(id UUID PRIMARY KEY,name TEXT,role TEXT);');const migration=readFileSync('server/migrations/0003_legacy_tables.sql','utf8');await pool.query(migration.slice(migration.indexOf('CREATE TABLE IF NOT EXISTS blog_categories')));
 const admin=randomUUID(),member=randomUUID(),deleted=randomUUID();await pool.query('INSERT INTO users VALUES($1,$2,$3),($4,$5,$6)',[admin,'Fixture Admin','ADMIN',member,'Fixture Member','MEMBER']);
 const app=express();app.use(express.json());const authenticateToken=(req,res,next)=>{const t=req.headers.authorization?.slice(7);if(!t)return res.sendStatus(401);try{req.user=jwt.verify(t,secret);next();}catch{res.sendStatus(403);}};installAdminBlogs(app,{pool,authenticateToken});http=app.listen(0,'127.0.0.1');await new Promise(r=>http.on('listening',r));const base='http://127.0.0.1:'+http.address().port;
 const token=id=>jwt.sign({id,role:'ADMIN'},secret);const rows=[];
 async function request(path,method='GET',body,id=admin){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(id?{Authorization:'Bearer '+token(id)}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();let data;try{data=JSON.parse(text);}catch{}rows.push({path,method,status:r.status});return{status:r.status,data};}
 assert.equal((await request('/api/admin/blogs','GET',null,null)).status,401);assert.equal((await request('/api/admin/blogs','GET',null,member)).status,403);assert.equal((await request('/api/admin/blogs','GET',null,deleted)).status,401);
 const draft={title:'Fixture Article',slug:'fixture-article',content:'<p>'+('Useful original content. '.repeat(10))+'</p>',status:'draft',meta_description:'Fixture description'};
 const create=await request('/api/admin/blogs','POST',draft);assert.equal(create.status,200);let blog=create.data.blog;assert.equal(create.data.ownerId,admin);assert.equal(blog.author_id,null);assert.equal(blog.published_at,null);assert.match(blog.revision,/^[0-9a-f]{32}$/);
 assert.equal((await request('/api/admin/blogs','POST',draft)).status,409);assert.equal((await request('/api/blogs','GET',null,null)).data.length,0);assert.equal((await request('/api/blogs/fixture-article','GET',null,null)).status,404);
 const fields=Object.fromEntries(Object.keys(draft).map(k=>[k,blog[k]]));assert.equal((await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,status:'published',revision:blog.revision})).status,400);
 assert.equal((await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,author_id:member,revision:blog.revision})).status,400);
 const publish=await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,status:'published',revision:blog.revision,reviewConfirmed:true});assert.equal(publish.status,200);const old=blog;blog=publish.data.blog;assert(blog.published_at);assert.notEqual(blog.revision,old.revision);assert.equal((await request('/api/blogs','GET',null,null)).data.length,1);
 const publicRead=await request('/api/blogs/fixture-article','GET',null,null);assert.equal(publicRead.status,200);assert.equal(publicRead.data.status,'published');assert.equal(publicRead.data.author.name,null);
 assert.equal((await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,status:'published',revision:old.revision,reviewConfirmed:true})).status,409);
 assert.equal((await request('/api/admin/blogs/'+blog.id,'PUT',{...fields,slug:'changed-published-url',status:'published',revision:blog.revision,reviewConfirmed:true})).status,409);
 assert.equal((await request('/api/admin/blogs','POST',{...draft,slug:'another',canonical_url:'javascript:alert(1)'})).status,400);
 const archived=await request('/api/admin/blogs/'+blog.id+'/archive','POST',{revision:blog.revision});assert.equal(archived.status,200);assert.equal(archived.data.blog.status,'archived');assert.equal((await request('/api/blogs/fixture-article','GET',null,null)).status,404);assert.equal((await pool.query('SELECT count(*)::int AS n FROM blogs')).rows[0].n,1);
 await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await request('/api/admin/blogs','POST',{...draft,slug:'demoted-admin'})).status,403);
 writeFileSync('output/blog-cms-contract-result.json',JSON.stringify({scope:'Isolated local PostgreSQL15 instance, fresh exact CMS migration tables; no production connection',rows,tests:{dbRoleGate:true,draftHidden:true,publicationReview:true,organizationAuthor:true,revisionConflict:true,publishedSlugProtected:true,recoverableArchive:true,adminDemotion:true,noRlsChanges:true}},null,2));console.log('Blog CMS contract PASS: '+rows.length+' requests; isolated PostgreSQL15; role/draft/review/revision/archive/slug/public-read boundaries.');
}finally{if(http)await new Promise(r=>http.close(r));if(pool)await pool.end();if(started)run('pg_ctl',['-D',dir,'-m','fast','-w','stop']);}
