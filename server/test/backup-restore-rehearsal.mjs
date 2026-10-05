// Disposable synthetic database only. No production URL or external dump is accepted.
import {spawnSync} from 'node:child_process';
import {randomUUID,createHash} from 'node:crypto';
import {once} from 'node:events';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import {readPublicSchemaCatalog} from '../src/config/schema-catalog.js';

const serverDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const container=`e4n-restore-${randomUUID().slice(0,8)}`;
const dbUser='e4n_restore_fixture',dbName='e4n_restore_fixture',restoreName='e4n_restore_target';
let started=false,pool,restored,appServer;
const hash=value=>createHash('sha256').update(value).digest('hex');
// pg_dump reparses varchar literal arrays into per-element text casts in PG17.
// Normalize ONLY this literal-array spelling; changed values/operators stay different.
const catalogComparable=rows=>rows.map(row=>({...row,definition:row.kind==='constraint'
 ? row.definition.replace(/ARRAY\[((?:'[^']*'::character varying(?:, )?)+)\]::text\[\]/g,(_,items)=>`ARRAY[${items.replaceAll('::character varying','::character varying::text')}]`)
 : row.definition}));
function docker(args){
 const r=spawnSync('docker',args,{encoding:'utf8',windowsHide:true,timeout:30000,maxBuffer:16*1024*1024});
 if(r.error||r.status!==0)throw new Error(`Isolated Docker ${args[0]} failed: ${r.stderr||r.error?.message}`);
 return r.stdout.trim();
}
const quoted=value=>'"'+value.replaceAll('"','""')+'"';
async function manifest(db){
 const c=await db.connect();
 try {
  await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const names=(await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows;
  const tables=[];
  for(const {tablename} of names){
   // JSONB has canonical key ordering; row ordering is independent of heap insertion order.
   // bytea is represented as exact hex, including NUL and non-UTF8 bytes.
   const rows=(await c.query(`SELECT to_jsonb(t)::text AS row FROM public.${quoted(tablename)} t ORDER BY to_jsonb(t)::text COLLATE "C"`)).rows;
   tables.push({name:tablename,count:rows.length,sha256:hash(JSON.stringify(rows.map(r=>r.row)))});
  }
  const catalog=await readPublicSchemaCatalog(c);
  const security=(await c.query(`SELECT cls.relname,cls.relrowsecurity,cls.relforcerowsecurity,
    COALESCE(cls.relacl,acldefault(CASE WHEN cls.relkind='S' THEN 's'::"char" ELSE 'r'::"char" END,cls.relowner))::text AS effective_acl,
    pg_get_userbyid(cls.relowner) AS owner FROM pg_class cls JOIN pg_namespace ns ON ns.oid=cls.relnamespace
    WHERE ns.nspname='public' AND cls.relkind IN ('r','S') ORDER BY cls.relname`)).rows;
  const policies=(await c.query("SELECT * FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname")).rows;
  const defaults=(await c.query("SELECT pg_get_userbyid(defaclrole) AS owner,defaclnamespace::regnamespace::text AS namespace,defaclobjtype,defaclacl::text FROM pg_default_acl ORDER BY 1,2,3")).rows;
  const seqNames=(await c.query("SELECT sequencename FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename")).rows;
  const sequences=[];
  for(const {sequencename} of seqNames)sequences.push({name:sequencename,...(await c.query(`SELECT last_value::text,is_called FROM public.${quoted(sequencename)}`)).rows[0]});
  await c.query('COMMIT');
  return {tables,catalog:catalogComparable(catalog),catalogSha256:hash(JSON.stringify(catalogComparable(catalog))),security,policies,defaults,sequences};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
async function main(){
 docker(['run','--rm','-d','--pull=never','--name',container,'-e',`POSTGRES_USER=${dbUser}`,'-e','POSTGRES_PASSWORD=synthetic_fixture_only','-e',`POSTGRES_DB=${dbName}`,'-p','127.0.0.1::5432','postgres:17']);started=true;
 for(let i=0;i<60;i++){try{docker(['exec',container,'pg_isready','-U',dbUser,'-d',dbName]);break;}catch{if(i===59)throw new Error('Local fixture unavailable');await new Promise(r=>setTimeout(r,500));}}
 const port=Number(docker(['port',container,'5432/tcp']).match(/127\.0\.0\.1:(\d+)/)?.[1]);assert.ok(port>0);
 for(const k of ['DATABASE_URL','POSTGRES_URL','SUPABASE_DB_URL','SIPAY_API_URL','SIPAY_APP_ID','SIPAY_APP_SECRET','SIPAY_MERCHANT_KEY'])delete process.env[k];
 Object.assign(process.env,{DOTENV_CONFIG_PATH:path.join(serverDir,'test','.nonexistent-env'),DB_HOST:'127.0.0.1',DB_PORT:String(port),DB_USER:dbUser,DB_PASSWORD:'synthetic_fixture_only',DB_NAME:dbName,NODE_ENV:'test',VERCEL:'1',JWT_SECRET:'restore_fixture_signing_only'});
 ({default:pool}=await import('../src/config/db.js'));
 for(let i=0;i<20;i++){try{await pool.query('SELECT 1');break;}catch(e){if(i===19)throw e;await new Promise(r=>setTimeout(r,500));}}
 const {applyVersionedSchema}=await import('../src/config/versioned-schema.js');
 // Roles must pre-exist: database dumps do not contain cluster roles.
 await pool.query('CREATE ROLE anon; CREATE ROLE authenticated');
 assert.equal((await applyVersionedSchema()).applied.length,14);
 const [admin,member,other,event,invoice,document]=Array.from({length:6},()=>randomUUID());
 for(const [i,id] of [admin,member,other].entries())await pool.query("INSERT INTO users(id,email,name,profession,role) VALUES($1,$2,$3,'Fixture',$4)",[id,`restore-${i}@example.invalid`,i===1?'Üye – 😀':'Fixture',i===0?'ADMIN':'MEMBER']);
 await pool.query("INSERT INTO events(id,title,start_at,type,generate_tickets,price,created_by) VALUES($1,'Restore event','2099-01-01','social',true,100,$2)",[event,admin]);
 await pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'PRESENT')",[event,member]);
 await pool.query("INSERT INTO event_tickets(event_id,user_id,ticket_number,payment_status) VALUES($1,$2,'RESTORE-PENDING','PENDING')",[event,member]);
 await pool.query("INSERT INTO payment_transactions(merchant_oid,user_id,amount,status,action_type,action_data) VALUES('RESTORE-OWNED',$1,100,'PENDING','event_registration',$2),('RESTORE-UNOWNED',NULL,100,'PENDING','membership','{}')",[member,JSON.stringify({event_id:event,user_id:member})]);
 await pool.query("INSERT INTO direct_messages(sender_id,receiver_id,content,request_key) VALUES($1,$2,'Türkçe mesaj 😀',$3)",[member,other,randomUUID()]);
 const bytes=Buffer.concat([Buffer.from('%PDF-1.4\nSynthetic recovery\n'),Buffer.from([0,255,128,1]),Buffer.from('\n%%EOF')]);
 await pool.query("INSERT INTO invoice_files(id,member_id,uploaded_by,request_key,fingerprint,filename,size_bytes,content,email_state) VALUES($1,$2,$3,$4,$5,'restore.pdf',$6,$7,'UNKNOWN')",[invoice,member,admin,randomUUID(),'a'.repeat(64),bytes.length,bytes]);
 await pool.query('UPDATE users SET subscription_invoice_url=$1,subscription_invoice_issued=true WHERE id=$2',[`/api/invoices/${invoice}`,member]);
 await pool.query("INSERT INTO document_library(id,title,category,filename,mime_type,size_bytes,uploaded_by,allowed_roles,request_key,fingerprint) VALUES($1,'Restore PDF','GENERAL','restore.pdf','application/pdf',$2,$3,ARRAY['MEMBER'],$4,$5)",[document,bytes.length,admin,randomUUID(),'b'.repeat(64)]);
 await pool.query('INSERT INTO document_files(document_id,content) VALUES($1,$2)',[document,bytes]);
 const before=await manifest(pool);assert.equal(before.tables.length,42);
 docker(['exec',container,'pg_dump','-U',dbUser,'-d',dbName,'-Fc','-f','/tmp/fixture.dump']);
 docker(['exec',container,'createdb','-U',dbUser,restoreName]);
 docker(['exec',container,'pg_restore','-U',dbUser,'-d',restoreName,'--exit-on-error','--single-transaction','/tmp/fixture.dump']);
 const config={host:'127.0.0.1',port,user:dbUser,password:'synthetic_fixture_only',database:restoreName};restored=new pg.Pool(config);
 const initialRestore=await manifest(restored);
 mkdirSync(path.resolve(serverDir,'../output'),{recursive:true});
 writeFileSync(path.resolve(serverDir,'../output/restore-catalog-diff.json'),JSON.stringify(before.catalog.filter((row,i)=>JSON.stringify(row)!==JSON.stringify(initialRestore.catalog[i])).map(row=>({before:row,after:initialRestore.catalog.find(r=>r.kind===row.kind&&r.relation_name===row.relation_name&&r.object_name===row.object_name)})),null,2));
 assert.deepEqual(initialRestore,before);
 assert.equal((await applyVersionedSchema({dbPool:restored})).applied.length,0);
 // A real divergent bytea proves count-only reconciliation would miss corruption.
 await restored.query("UPDATE invoice_files SET content=decode(repeat('41',size_bytes),'hex') WHERE id=$1",[invoice]);
 assert.notDeepEqual((await manifest(restored)).tables,before.tables);
 docker(['exec',container,'pg_restore','-U',dbUser,'-d',restoreName,'--clean','--if-exists','--exit-on-error','--single-transaction','/tmp/fixture.dump']);
 assert.deepEqual(await manifest(restored),before);
 for(const role of ['anon','authenticated'])assert.equal((await restored.query("SELECT has_table_privilege($1,'invoice_files','SELECT') allowed",[role])).rows[0].allowed,false);
 // Existing download handler and JWT boundary run against the restored database.
 const {default:express}=await import('express');const {installInvoices}=await import('../src/invoices.js');
 const app=express();app.use(express.json());
 const authenticateToken=(req,res,next)=>{try{req.user=jwt.verify((req.headers.authorization||'').replace(/^Bearer /,''),process.env.JWT_SECRET);next();}catch{res.sendStatus(401);}};
 installInvoices(app,{pool:restored,authenticateToken,sendEmail:async()=>{throw new Error('Rehearsal must never send mail');}});
 appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
 const download=async(id,role='MEMBER')=>fetch(`http://127.0.0.1:${appServer.address().port}/api/invoices/${invoice}`,{headers:id?{Authorization:`Bearer ${jwt.sign({id,role},process.env.JWT_SECRET)}`}:{}});
 const own=await download(member);assert.equal(own.status,200);assert.deepEqual(Buffer.from(await own.arrayBuffer()),bytes);assert.equal(own.headers.get('cache-control'),'private, no-store');
 assert.equal((await download(null)).status,401);assert.equal((await download(other)).status,404);assert.equal((await download(other,'ADMIN')).status,404);assert.equal((await download(admin,'ADMIN')).status,200);
 await restored.query("UPDATE users SET role='MEMBER' WHERE id=$1",[admin]);assert.equal((await download(admin,'ADMIN')).status,404);
 await restored.query("UPDATE users SET role='ADMIN' WHERE id=$1",[admin]);assert.deepEqual(await manifest(restored),before);
 const output=path.resolve(serverDir,'../output');mkdirSync(output,{recursive:true});
 const report={syntheticOnly:true,productionBackup:false,versions:14,applicationTables:41,manifest:before,restoredEqual:true,repeatApplied:0,corruptionDetected:true,cleanRollbackEqual:true,downloadAndOwnerBoundaryPassed:true};
 writeFileSync(path.join(output,'backup-restore-rehearsal.json'),JSON.stringify(report,null,2));
 console.log('Backup/restore PASS: 42 table counts+row hashes, catalog, ACL/RLS/policy/defaults/sequences; bytea corruption detected; clean rollback exact; 14-version repeat0; restored invoice HTTP owner/current-role boundary. Synthetic only; not live Supabase backup.');
}
let code=0;try{await main();}catch(e){code=1;console.error(e.stack);}finally{
 if(appServer)await new Promise(r=>appServer.close(r));if(restored)await restored.end();if(pool)await pool.end();
 if(started)try{docker(['stop','--time','3',container]);}catch(e){code=1;console.error(e.message);}
}process.exit(code);
