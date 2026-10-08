import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const serverDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const container=`e4n-reminder-job-${randomUUID().slice(0,8)}`;
const dbName='e4n_isolated_test',dbUser='e4n_isolated_test',dbPassword='local_fixture_only';
let pool,appServer,containerStarted=false;
function docker(args,{timeout=30000}={}){const result=spawnSync('docker',args,{cwd:serverDir,encoding:'utf8',timeout,maxBuffer:16*1024*1024,windowsHide:true});if(result.error||result.status!==0)throw Error(`Docker ${args[0]} failed: ${(result.stderr||result.error?.message||'').trim()}`);return result.stdout.trim();}
async function waitForPostgres(){for(let i=0;i<60;i++){const r=spawnSync('docker',['exec',container,'pg_isready','-U',dbUser,'-d',dbName],{encoding:'utf8',timeout:5000,windowsHide:true});if(r.status===0)return;await new Promise(resolve=>setTimeout(resolve,500));}throw Error('PostgreSQL readiness timeout');}

async function main(){
  docker(['run','--rm','-d','--pull=never','--name',container,'-e',`POSTGRES_USER=${dbUser}`,'-e',`POSTGRES_PASSWORD=${dbPassword}`,'-e',`POSTGRES_DB=${dbName}`,'-p','127.0.0.1::5432','postgres:17'],{timeout:60000});containerStarted=true;await waitForPostgres();
  const port=Number(docker(['port',container,'5432/tcp']).match(/127\.0\.0\.1:(\d+)/)?.[1]);assert.ok(port>0);
  for(const key of ['DATABASE_URL','POSTGRES_URL','SUPABASE_DB_URL'])delete process.env[key];
  Object.assign(process.env,{DOTENV_CONFIG_PATH:path.join(serverDir,'test','.nonexistent-env'),DB_HOST:'127.0.0.1',DB_PORT:String(port),DB_USER:dbUser,DB_PASSWORD:dbPassword,DB_NAME:dbName,NODE_ENV:'test',VERCEL:'1',JWT_SECRET:'isolated_fixture_signing_key'});
  ({default:pool}=await import('../src/config/db.js'));for(let i=0;i<20;i++){try{await pool.query('SELECT 1');break;}catch{if(i===19)throw Error('Database connection failed');await new Promise(r=>setTimeout(r,500));}}
  const {applyVersionedSchema}=await import('../src/config/versioned-schema.js');assert.equal((await applyVersionedSchema()).applied.length,22);assert.equal((await applyVersionedSchema()).applied.length,0);
  const {runSubscriptionReminders,scheduleSubscriptionReminders,subscriptionReminderLock}=await import('../src/cron/subscription-reminders.js');
  const reference=new Date('2026-01-10T12:00:00Z'),ids=[];
  for(const [i,days] of [3,1,-1,-3,-5].entries()){
    const id=randomUUID();ids.push(id);const email=i===4?'':`reminder-${days}@example.invalid`;
    await pool.query("INSERT INTO users(id,email,name,profession,role,account_status,subscription_end_date) VALUES($1,$2,$3,'Fixture','MEMBER','ACTIVE',$4::timestamptz)",[id,email,`Member ${days}`,new Date(reference.getTime()+days*86400000).toISOString()]);
  }
  const inactive=randomUUID(),offDay=randomUUID();
  await pool.query("INSERT INTO users(id,email,name,profession,role,account_status,subscription_end_date) VALUES($1,'inactive@example.invalid','Inactive','Fixture','MEMBER','PENDING',$3),($2,'offday@example.invalid','Off day','Fixture','MEMBER','ACTIVE',$4)",[inactive,offDay,new Date(reference.getTime()+3*86400000),new Date(reference.getTime()+2*86400000)]);
  const mailCalls=[];const sendMail=async(to,subject)=>{mailCalls.push({to,subject});return{success:!to.includes('--1@')}};const logs=[];
  const first=await runSubscriptionReminders(pool,{now:reference,sendMail,log:r=>logs.push(r)});
  assert.deepEqual({claimed:first.claimed,notifications:first.notifications,emailsSent:first.emailsSent,emailsUnknown:first.emailsUnknown,noEmail:first.noEmail},{claimed:5,notifications:5,emailsSent:3,emailsUnknown:1,noEmail:1});
  assert.equal(mailCalls.length,4);
  const stored=(await pool.query('SELECT user_id,trigger_days,delivery_state,notification_id IS NOT NULL AS has_notification FROM subscription_reminder_deliveries ORDER BY trigger_days DESC')).rows;
  assert.equal(stored.length,5);assert.ok(stored.every(row=>row.has_notification));assert.deepEqual(stored.map(row=>row.trigger_days),[3,1,-1,-3,-5]);assert.deepEqual(stored.map(row=>row.delivery_state).sort(),['NO_EMAIL','SENT','SENT','SENT','UNKNOWN']);
  assert.equal((await pool.query('SELECT count(*)::int AS count FROM notifications')).rows[0].count,5);
  assert.deepEqual((await pool.query('SELECT last_reminder_trigger FROM users WHERE id=ANY($1::uuid[]) ORDER BY last_reminder_trigger DESC',[ids])).rows.map(row=>row.last_reminder_trigger),[3,1,-1,-3,-5]);
  const replay=await runSubscriptionReminders(pool,{now:reference,sendMail});assert.equal(replay.claimed,0);assert.equal(mailCalls.length,4);assert.equal((await pool.query('SELECT count(*)::int AS count FROM notifications')).rows[0].count,5);

  const lock=await pool.connect();await lock.query('BEGIN');await lock.query('SELECT pg_advisory_xact_lock($1,$2)',subscriptionReminderLock);
  try{const skipped=await runSubscriptionReminders(pool,{now:reference,sendMail});assert.equal(skipped.status,'SKIPPED');assert.equal(skipped.reason,'ALREADY_RUNNING');}finally{await lock.query('ROLLBACK');lock.release();}

  const retryUser=randomUUID();await pool.query("INSERT INTO users(id,email,name,profession,role,account_status,subscription_end_date) VALUES($1,'retry@example.invalid','Retry member','Fixture','MEMBER','ACTIVE',$2)",[retryUser,new Date(reference.getTime()+86400000)]);
  await pool.query("CREATE FUNCTION fixture_reminder_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.user_id=$q$"+retryUser+"$q$::uuid THEN RAISE EXCEPTION 'Synthetic private reminder detail'; END IF; RETURN NEW; END; $$; CREATE TRIGGER fixture_reminder_failure BEFORE INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION fixture_reminder_failure()");
  try{await assert.rejects(runSubscriptionReminders(pool,{now:reference,sendMail,log:r=>logs.push(r)}),error=>error.code==='P0001');assert.equal(logs.at(-1).status,'FAILED');assert.ok(!JSON.stringify(logs).includes('private reminder detail'));assert.equal((await pool.query('SELECT count(*)::int AS count FROM subscription_reminder_deliveries WHERE user_id=$1',[retryUser])).rows[0].count,0);assert.equal((await pool.query('SELECT last_reminder_trigger FROM users WHERE id=$1',[retryUser])).rows[0].last_reminder_trigger,null);}finally{await pool.query('DROP TRIGGER fixture_reminder_failure ON notifications; DROP FUNCTION fixture_reminder_failure()');}
  assert.equal((await runSubscriptionReminders(pool,{now:reference,sendMail})).claimed,1);

  const raceUser=randomUUID();await pool.query("INSERT INTO users(id,email,name,profession,role,account_status,subscription_end_date) VALUES($1,'race@example.invalid','Race member','Fixture','MEMBER','ACTIVE',$2)",[raceUser,new Date(reference.getTime()-3*86400000)]);
  const races=await Promise.all(Array.from({length:10},()=>runSubscriptionReminders(pool,{now:reference,sendMail})));assert.equal(races.reduce((sum,result)=>sum+result.claimed,0),1);assert.equal((await pool.query('SELECT count(*)::int AS count FROM subscription_reminder_deliveries WHERE user_id=$1',[raceUser])).rows[0].count,1);

  let callback;const task={fixture:true};assert.equal(scheduleSubscriptionReminders((expression,fn)=>{assert.equal(expression,'0 9 * * *');callback=fn;return task;},pool,{now:reference,sendMail}),task);assert.equal((await callback()).claimed,0);
  await pool.query('CREATE ROLE anon; CREATE ROLE authenticated');
  assert.equal((await pool.query("SELECT has_table_privilege('anon','subscription_reminder_deliveries','SELECT') AS allowed")).rows[0].allowed,false);assert.equal((await pool.query("SELECT has_table_privilege('authenticated','subscription_reminder_deliveries','SELECT') AS allowed")).rows[0].allowed,false);

  const {default:nodemailer}=await import('nodemailer');nodemailer.createTransport=()=>({sendMail:async()=>{throw Error('No real mail allowed');}});
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const base=`http://127.0.0.1:${appServer.address().port}/api`;
  const response=await fetch(`${base}/notifications`,{headers:{Authorization:`Bearer ${jwt.sign({id:ids[0],role:'MEMBER'},process.env.JWT_SECRET)}`}});assert.equal(response.status,200);const notifications=await response.json();assert.equal(notifications.length,1);assert.match(notifications[0].title,/Hatırlatması/);assert.ok(!('delivery_state' in notifications[0]));
  console.log('Subscription reminder PASS: PG17 fresh22/repeat0, five existing trigger days, atomic claim+notification+marker, replay and 10-run race single claim, DB rollback/retry, SMTP unknown/no-email persisted without resend, held-lock skip, schedule callback, private delivery ledger and actual web notification read. No live DB/mail/payment.');
}
let code=0;try{await main();}catch(error){code=1;console.error(error.stack);}finally{if(appServer)await new Promise(resolve=>appServer.close(resolve));if(pool)await pool.end();if(containerStarted)docker(['stop','--time','3',container]);}process.exit(code);
