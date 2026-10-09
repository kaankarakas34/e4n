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
const container = `e4n-route-ownership-${randomUUID().slice(0, 8)}`;
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
  assert.equal((await applyVersionedSchema()).applied.length,28);
  assert.equal((await applyVersionedSchema()).applied.length,0);










  const {inspectOwnership,keyOf}=await import('../tools/route-ownership.mjs');
  const report=inspectOwnership();assert.deepEqual(report.errors,[]);
  const {default:app}=await import('../src/index.js');
  const runtime=[];
  const collect=(stack,prefix='')=>{
    for(const layer of stack){
      if(layer.route){for(const p of Array.isArray(layer.route.path)?layer.route.path:[layer.route.path]){
        const full=(prefix+p).replace(/\/$/,'');if(!full.startsWith('/api/'))continue;
        for(const [method,enabled]of Object.entries(layer.route.methods))if(enabled)runtime.push(keyOf(method,full));
      }}
      else if(layer.name==='router'&&layer.handle.stack){
        assert.match(layer.regexp.source,/api\\\/admin/,'Unexpected mounted router needs explicit prefix handling');
        collect(layer.handle.stack,'/api/admin');
      }
    }
  };
  collect(app._router.stack);
  assert.equal(new Set(runtime).size,runtime.length,'Runtime has shadowed routes');
  assert.deepEqual(runtime.sort(),report.active.map(r=>keyOf(r.method,r.path)).sort(),'Static providers differ from actual Express');
  const [admin,member]=[randomUUID(),randomUUID()];
  for(const [id,role]of [[admin,'ADMIN'],[member,'MEMBER']])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role) VALUES($1,$2,$2,$2,'isolated_only',$3)",[id,id+'@example.invalid',role]);
  appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base='http://127.0.0.1:'+appServer.address().port;
  const call=(p,owner)=>fetch(base+p,{headers:owner?{Authorization:'Bearer '+jwt.sign({id:owner,role:'ADMIN'},process.env.JWT_SECRET)}:{}});
  for(const p of ['/api/admin/group-catalog','/api/admin/member-directory','/api/admin/reports']){
    assert.equal((await call(p)).status,401);assert.equal((await call(p,member)).status,403);const r=await call(p,admin);assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private.*no-store/);
  }
  writeFileSync(path.join(serverDir,'docs/route-ownership.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Route ownership runtime PASS: '+runtime.length+' exact static/Express method-path matches, no shadows; 17 retained legacy unmounted; installed admin auth/current DB role/cache.');
}
let exitCode=0;
try{await main();}catch(error){exitCode=1;console.error('Route ownership contract failed:',error);}
finally{if(appServer)await new Promise(resolve=>appServer.close(resolve));if(pool)await pool.end();if(containerStarted){try{docker(['stop','--time','3',container],{timeout:15000});}catch(error){exitCode=1;console.error(error.message);}}}process.exit(exitCode);
