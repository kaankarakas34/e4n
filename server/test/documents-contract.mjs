import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import pg from 'pg';
import jwt from 'jsonwebtoken';


const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const container = `e4n-documents-${randomUUID().slice(0, 8)}`;
const dbName = 'e4n_isolated_test';
const dbUser = 'e4n_isolated_test';
const dbPassword = 'local_fixture_only';
let appServer;
let pool;
let containerStarted = false;

function docker(args, { input, timeout = 30_000 } = {}) {
  const result = spawnSync('docker', args, {
    cwd: serverDir,
    encoding: 'utf8',
    input,
    timeout,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Docker ${args[0]} failed: ${(result.stderr || result.error?.message || '').trim()}`);
  }
  return result.stdout.trim();
}

async function waitForPostgres() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = spawnSync('docker', ['exec', container, 'pg_isready', '-U', dbUser, '-d', dbName], {
      encoding: 'utf8', timeout: 5_000, windowsHide: true,
    });
    if (result.status === 0) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Isolated PostgreSQL did not become ready within 30 seconds');
}

async function main() {
  docker([
    'run', '--rm', '-d', '--pull=never', '--name', container,
    '-e', `POSTGRES_USER=${dbUser}`,
    '-e', `POSTGRES_PASSWORD=${dbPassword}`,
    '-e', `POSTGRES_DB=${dbName}`,
    '-p', '127.0.0.1::5432', 'postgres:17',
  ], { timeout: 60_000 });
  containerStarted = true;
  await waitForPostgres();

  const portOutput = docker(['port', container, '5432/tcp']);
  const port = Number(portOutput.match(/127\.0\.0\.1:(\d+)/)?.[1]);
  if (!Number.isInteger(port) || port <= 0) throw new Error('Could not determine isolated loopback port');

  // Override every database setting before loading application modules. Never use a .env file here.
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
  delete process.env.SUPABASE_DB_URL;
  process.env.DOTENV_CONFIG_PATH = path.join(serverDir, 'test', '.nonexistent-env');
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = String(port);
  process.env.DB_USER = dbUser;
  process.env.DB_PASSWORD = dbPassword;
  process.env.DB_NAME = dbName;
  process.env.NODE_ENV = 'test';
  process.env.VERCEL = '1'; // Prevent automatic migrations and network listening on module import.
  process.env.JWT_SECRET = 'isolated_fixture_signing_key';

  ({ default: pool } = await import('../src/config/db.js'));
  let databaseReady = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      databaseReady = true;
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  if (!databaseReady) throw new Error('Isolated PostgreSQL did not accept a SQL connection');
  const { applyVersionedSchema } = await import('../src/config/versioned-schema.js');
  assert.equal((await applyVersionedSchema()).applied.length,14);
  assert.equal((await applyVersionedSchema()).applied.length,0);




  const [admin,president,member,third]=Array.from({length:4},()=>randomUUID());
  for(const [i,id] of [admin,president,member,third].entries())await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,'Fixture','Fixture','secret',$3)",[id,`document-${i}@example.invalid`,['ADMIN','PRESIDENT','MEMBER','VICE_PRESIDENT'][i]]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');
  const base=`http://127.0.0.1:${appServer.address().port}/api`;
  const token=(id,role='ADMIN')=>jwt.sign({id,role},process.env.JWT_SECRET);
  const call=(url,id=admin,method='GET',body)=>fetch(base+url,{method,headers:id?{Authorization:`Bearer ${token(id)}`}:{},body,signal:AbortSignal.timeout(10000)});
  const bytes=Buffer.from('%PDF-1.4\nFixture private document\n%%EOF');
  const form=(key=randomUUID(),title='Private guide',allowed=['MEMBER'],data=bytes,name='guide.pdf')=>{const f=new FormData();f.set('file',new Blob([data]),name);f.set('title',title);f.set('description','Stored bytes');f.set('category','LEGAL');f.set('allowed_roles',JSON.stringify(allowed));f.set('requestKey',key);return f;};
  assert.equal((await call('/documents',null)).status,401);
  assert.equal((await call('/documents',randomUUID())).status,401);
  assert.equal((await call('/documents',member,'POST',form())).status,403);
  assert.equal((await call('/documents',admin,'POST',form(randomUUID(),'bad',[],Buffer.from('fake'),'fake.pdf'))).status,400);
  assert.equal((await call('/documents',admin,'POST',form(randomUUID(),'large',[],Buffer.alloc(3145729),'large.pdf'))).status,400);
  const key=randomUUID();const race=await Promise.all(Array.from({length:8},()=>call('/documents',president,'POST',form(key))));assert(race.every(r=>r.status===200));const receipts=await Promise.all(race.map(r=>r.json()));assert.equal(new Set(receipts.map(r=>r.document.id)).size,1);assert.equal(receipts.filter(r=>!r.replay).length,1);
  const doc=receipts[0].document;assert.equal((await call('/documents',president,'POST',form(key,'Different'))).status,409);
  assert.equal((await pool.query('SELECT count(*)::int n FROM document_files')).rows[0].n,1);
  assert.equal((await call('/documents',third)).status,200);assert.equal((await (await call('/documents',third)).json()).documents.length,0);
  assert.equal((await call(`/documents/${doc.id}/download`,third)).status,404);
  for(const id of [admin,president,member]){const response=await call(`/documents/${doc.id}/download`,id);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);}
  assert.equal((await call(`/documents/${doc.id}`,member,'DELETE')).status,403);
  await pool.query("UPDATE users SET role='MEMBER' WHERE id=$1",[president]);assert.equal((await call('/documents',president,'POST',form())).status,403);assert.equal((await (await call('/documents',president)).json()).canUpload,false);
  // Inject a database error after metadata insertion: no orphan metadata or partial file commit.
  await pool.query("CREATE FUNCTION fail_document_file() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'isolated failure'; END $$; CREATE TRIGGER fail_document_file BEFORE INSERT ON document_files FOR EACH ROW EXECUTE FUNCTION fail_document_file()");
  const rollbackKey=randomUUID();assert.equal((await call('/documents',admin,'POST',form(rollbackKey))).status,500);assert.equal((await pool.query('SELECT count(*)::int n FROM document_library')).rows[0].n,1);await pool.query('DROP TRIGGER fail_document_file ON document_files; DROP FUNCTION fail_document_file()');
  assert.equal((await call('/documents',admin,'POST',form(rollbackKey))).status,200);
  assert.equal((await call(`/documents/${doc.id}`,president,'DELETE')).status,200);assert.equal((await (await call(`/documents/${doc.id}`,president,'DELETE')).json()).replay,true);
  assert.equal((await call(`/documents/${doc.id}/download`,admin)).status,404);assert.equal((await call('/documents',president,'POST',form(key))).status,403);
  await pool.query("UPDATE users SET role='PRESIDENT' WHERE id=$1",[president]);assert.equal((await call('/documents',president,'POST',form(key))).status,409);
  assert.equal((await pool.query('SELECT count(*)::int n FROM document_files')).rows[0].n,2);await assert.rejects(pool.query('DELETE FROM users WHERE id=$1',[president]),e=>e.code==='23503');
  await pool.query('CREATE ROLE anon; CREATE ROLE authenticated; ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO anon,authenticated');
  const before=(await pool.query('SELECT id FROM users ORDER BY id')).rows;
  await pool.query("DROP TABLE invoice_files; DELETE FROM schema_migrations WHERE version='0013_invoice_files'");
  await pool.query("DROP TABLE document_files,document_library;DELETE FROM schema_migrations WHERE version='0012_document_library'");assert.deepEqual((await applyVersionedSchema()).applied,['0012_document_library','0013_invoice_files']);assert.equal((await applyVersionedSchema()).applied.length,0);assert.deepEqual((await pool.query('SELECT id FROM users ORDER BY id')).rows,before);
  for(const table of ['document_library','document_files']){assert.equal((await pool.query('SELECT has_table_privilege(\'anon\',$1,\'SELECT\') allowed',[table])).rows[0].allowed,false);assert.equal((await pool.query('SELECT relrowsecurity FROM pg_class WHERE oid=$1::regclass',[table])).rows[0].relrowsecurity,true);}
  await pool.query('GRANT SELECT,INSERT ON document_library,document_files TO anon,authenticated');
  const unprivileged=await pool.connect();for(const role of ['anon','authenticated']){await unprivileged.query('BEGIN');await unprivileged.query(`SET LOCAL ROLE ${role}`);assert.equal((await unprivileged.query('SELECT * FROM document_files')).rows.length,0);await assert.rejects(unprivileged.query('INSERT INTO document_files(document_id,content) VALUES($1,$2)',[randomUUID(),bytes]),e=>e.code==='42501');await unprivileged.query('ROLLBACK');}unprivileged.release();
  // Exercise the actual TypeScript transport with bearer and multipart through Express/PG.
  const root=path.join(serverDir,'..');const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const transportSource=readFileSync(path.join(root,'src/api/api.ts'),'utf8').replace("import { emailService } from '../services/emailService';","const emailService={};").replace('import.meta.env.PROD','false').replace('http://localhost:4005/api',base);
  globalThis.localStorage={getItem:()=>JSON.stringify({state:{token:token(admin)}})};
  globalThis.__documentsTransport=(await import('data:text/javascript;base64,'+Buffer.from(compile(transportSource)).toString('base64'))).documentTransport;
  const serviceSource=readFileSync(path.join(root,'src/api/documents.ts'),'utf8').replace("import {documentTransport} from './api';",'const documentTransport=globalThis.__documentsTransport;');
  const {documentsApi}=await import('data:text/javascript;base64,'+Buffer.from(compile(serviceSource)).toString('base64'));
  const saved=await documentsApi.upload(admin,form());assert.deepEqual(Buffer.from(await (await documentsApi.download(saved)).arrayBuffer()),bytes);assert.equal((await documentsApi.list(admin)).documents.length,1);await documentsApi.archive(admin,saved.id);assert.equal((await documentsApi.list(admin)).documents.length,0);
  const saved2=await documentsApi.upload(admin,form(randomUUID(),'Browser guide',[]));writeFileSync(path.join(root,'output/documents-browser.json'),JSON.stringify({owner:admin,library:await documentsApi.list(admin),document:saved2}));
  console.log('Documents PASS: fresh 13/repeat/11→13, multipart bytes, role/owner boundary, demotion, race/replay/conflict, rollback/retry, archive retention, RLS/revoked default grants, actual typed web bearer transport.');
}
let exitCode = 0;
try {
  await main();
} catch (error) {
  exitCode = 1;
  console.error(`Documents contract failed: ${error.message}`);
} finally {
  if (appServer) await new Promise(resolve => appServer.close(resolve));
  if (pool) await pool.end();
  if (containerStarted) {
    try { docker(['stop', '--time', '3', container], { timeout: 15_000 }); }
    catch (error) { console.error(`Could not stop isolated container: ${error.message}`); exitCode = 1; }
  }
}
process.exit(exitCode);
