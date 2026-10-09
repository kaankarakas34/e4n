// Disposable full application fixture. Never loads production environment files.
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {once} from 'node:events';
import {createServer as createHttpServer} from 'node:http';
import {mkdirSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import {createServer as createViteServer} from 'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
// Tailwind resolves its config/content from cwd, including when Vite has a root.
// npm --prefix server launches here from server/, so align the fixture with the app.
process.chdir(root);
const container='e4n-web-browser-'+randomUUID().slice(0,8),secret=randomUUID();
const runDir=path.join(root,'output/web-browser',new Date().toISOString().replace(/[:.]/g,'-'));
let pool,appServer,vite,control,timer,closing=false,containerStarted=false,mails=0;
const docker=args=>{const r=spawnSync('docker',args,{encoding:'utf8',windowsHide:true,timeout:60000});if(r.status!==0||r.error)throw Error('Local Docker fixture failed: '+(r.error?.message||r.stderr));return r.stdout.trim();};
async function close(){
  if(closing)return;closing=true;clearTimeout(timer);
  if(control)await new Promise(resolve=>control.close(resolve));
  if(vite)await vite.close();
  if(appServer){appServer.closeAllConnections();await new Promise(resolve=>appServer.close(resolve));}
  if(pool)await pool.end();
  if(containerStarted)docker(['rm','-f',container]);
}
try{
  mkdirSync(runDir,{recursive:true});
  docker(['run','--rm','-d','--pull=never','--name',container,'-e','POSTGRES_USER=e4n_isolated_test','-e','POSTGRES_PASSWORD=local_fixture_only','-e','POSTGRES_DB=e4n_isolated_test','-p','127.0.0.1::5432','postgres:17']);containerStarted=true;
  let ready=false;for(let i=0;i<60;i++){const r=spawnSync('docker',['exec',container,'pg_isready','-U','e4n_isolated_test','-d','e4n_isolated_test'],{encoding:'utf8',windowsHide:true,timeout:5000});if(r.status===0){ready=true;break;}await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('Local PostgreSQL not ready');
  const port=Number(docker(['port',container,'5432/tcp']).match(/127\.0\.0\.1:(\d+)/)?.[1]);if(!port)throw Error('No loopback port');
  for(const key of ['DATABASE_URL','POSTGRES_URL','SUPABASE_DB_URL','SUPABASE_SERVICE_ROLE_KEY','SMTP_PASSWORD','SMTP_PASS'])delete process.env[key];
  Object.assign(process.env,{DB_HOST:'127.0.0.1',DB_PORT:String(port),DB_USER:'e4n_isolated_test',DB_PASSWORD:'local_fixture_only',DB_NAME:'e4n_isolated_test',NODE_ENV:'test',VERCEL:'1',JWT_SECRET:'web_browser_fixture_only',DOTENV_CONFIG_PATH:path.join(root,'server/test/.nonexistent-env'),SMTP_HOST:'127.0.0.1',WEB_JOB_INVOCATION_ENABLED:'true',CRON_SECRET:'isolated_browser_cron_secret_32_chars'});
  nodemailer.createTransport=()=>({sendMail:async()=>{mails++;return{messageId:'local-fake'};}});
  ({default:pool}=await import('../src/config/db.js'));
  let sqlReady=false;
  for(let attempt=0;attempt<30;attempt++){try{await pool.query('SELECT 1');sqlReady=true;break;}catch{await new Promise(resolve=>setTimeout(resolve,500));}}
  if(!sqlReady)throw Error('Disposable fixture did not accept a SQL connection');
  const {applyVersionedSchema}=await import('../src/config/versioned-schema.js');const schema=await applyVersionedSchema();if(schema.applied.length!==26)throw Error('Unexpected schema version count');
  const ids=Object.fromEntries(['admin','member','president','applicant','group','emptyGroup','event','invoice','pastEvent','paidEvent','rosterGuild'].map(k=>[k,randomUUID()]));
  const password='Fixture-browser-123!',hash=await bcrypt.hash(password,10);
  for(const who of ['admin','member','president','applicant'])await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,account_status) VALUES($1,$2,$3,$3,$4,$5,'ACTIVE')",[ids[who],who+'@example.invalid','Browser '+who,hash,who==='admin'?'ADMIN':who==='president'?'PRESIDENT':'MEMBER']);
  await pool.query("INSERT INTO groups(id,name,status) VALUES($1,'Browser Full Group','ACTIVE'),($2,'Browser Vacant Group','ACTIVE')",[ids.group,ids.emptyGroup]);
  await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE'),($3,$2,'ACTIVE'),($4,$2,'REQUESTED')",[ids.member,ids.group,ids.president,ids.applicant]);
  if(process.env.E4N_GUILD_ROSTER_FIXTURE==='1'){
    await pool.query("INSERT INTO power_teams(id,name,status) VALUES($1,'Browser Roster Guild','ACTIVE')",[ids.rosterGuild]);
    await pool.query("INSERT INTO power_team_members(power_team_id,user_id,status,role) VALUES($1,$2,'ACTIVE','PRESIDENT'),($1,$3,'ACTIVE','MEMBER'),($1,$4,'REQUESTED','MEMBER')",[ids.rosterGuild,ids.president,ids.member,ids.applicant]);
  }
  for(let i=0;i<34;i++){const id=randomUUID();await pool.query("INSERT INTO users(id,email,name,profession,password_hash,role,account_status) VALUES($1,$2,$3,$3,$4,'MEMBER','ACTIVE')",[id,'seat-'+i+'@example.invalid','Browser seat '+i,hash]);await pool.query("INSERT INTO group_members(user_id,group_id,status) VALUES($1,$2,'ACTIVE')",[id,ids.group]);}
  // Exercise actual keyset pagination without changing membership status or rights.
  for(let i=0;i<52;i++)await pool.query('UPDATE group_members SET joined_at=$1 WHERE user_id=$2',[new Date(1700000000000+i),ids.member]);
  await pool.query("INSERT INTO events(id,title,start_at,status,is_public,type,price,max_attendees,created_by,group_id) VALUES($1,'Browser Participant Event',now()+interval '2 days','PUBLISHED',true,'social',0,50,$2,$3)",[ids.event,ids.admin,ids.group]);
  await pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'REGISTERED'),($1,$3,'PRESENT')",[ids.event,ids.member,ids.president]);
  await pool.query("INSERT INTO friend_requests(sender_id,receiver_id,status) VALUES($1,$2,'ACCEPTED')",[ids.member,ids.president]);
  await pool.query("UPDATE users SET performance_score=73,performance_color='YELLOW' WHERE id=$1",[ids.member]);
  for(let i=0;i<4;i++)await pool.query("INSERT INTO one_to_ones(requester_id,partner_id,meeting_date) VALUES($1,$2,now()-interval '1 day')",[i%2?ids.president:ids.member,i%2?ids.member:ids.president]);
  await pool.query("UPDATE users SET subscription_plan='LEGACY_PLAN',subscription_end_date=now()-interval '10 days' WHERE id=$1",[ids.member]);
  await pool.query("INSERT INTO payment_transactions(merchant_oid,user_id,amount,status,action_type,action_data) VALUES('browser-owned-membership',$1,120.50,'SUCCESS','membership','{}'),('browser-unowned-payment',NULL,50,'PENDING','membership',$2)",[ids.member,JSON.stringify({user_id:ids.member,receipt_token:'must_not_expose'})]);
  const invoiceBytes=Buffer.from('%PDF-1.7 browser membership fixture');
  await pool.query("INSERT INTO invoice_files(id,member_id,uploaded_by,request_key,fingerprint,filename,size_bytes,content,email_state) VALUES($1,$2,$3,$4,$5,'browser-membership.pdf',$6,$7,'UNKNOWN')",[ids.invoice,ids.member,ids.admin,randomUUID(),'a'.repeat(64),invoiceBytes.length,invoiceBytes]);
  await pool.query("INSERT INTO subscription_reminder_deliveries(user_id,subscription_end_date,trigger_days,delivery_state,completed_at) SELECT id,subscription_end_date,-5,'UNKNOWN',now() FROM users WHERE id=$1",[ids.member]);
  const {default:app}=await import('../src/index.js');appServer=app.listen(0,'127.0.0.1');await once(appServer,'listening');const apiBase='http://127.0.0.1:'+appServer.address().port;
  vite=await createViteServer({root,configFile:path.join(root,'vite.config.ts'),envDir:path.join(root,'server/test/.nonexistent-env-dir'),define:{'import.meta.env.VITE_SUPABASE_URL':JSON.stringify('https://fixture.example.invalid'),'import.meta.env.VITE_SUPABASE_ANON_KEY':JSON.stringify('fixture-public-key')},server:{host:'127.0.0.1',port:0,strictPort:true,open:false}});await vite.listen();const webBase='http://127.0.0.1:'+vite.httpServer.address().port;
  control=createHttpServer(async(req,res)=>{
    if(req.headers['x-fixture-key']!==secret){res.writeHead(403);res.end();return;}
    if(req.url==='/stop'&&req.method==='POST'){res.end('stopping');setImmediate(()=>close().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1);}));return;}
    if(req.url==='/shuffle-stale'&&req.method==='POST'){
      await pool.query("UPDATE users SET profession='Updated fixture profession' WHERE id=$1",[ids.president]);res.end('updated');return;
    }
    if(req.url==='/connections-seed'&&req.method==='POST'){
      await pool.query("INSERT INTO friend_requests(sender_id,receiver_id,status) VALUES($1,$2,'ACCEPTED'),($1,$3,'PENDING') ON CONFLICT(sender_id,receiver_id) DO NOTHING",[ids.member,ids.admin,ids.applicant]);res.end('seeded');return;
    }
    if(req.url==='/connections-revoke'&&req.method==='POST'){
      await pool.query("UPDATE friend_requests SET status='REJECTED' WHERE sender_id=$1 AND receiver_id=$2",[ids.member,ids.admin]);res.end('updated');return;
    }
    if(req.url==='/attendance-seed'&&req.method==='POST'){
      await pool.query("INSERT INTO events(id,title,start_at,status,is_public,type,price,max_attendees,created_by) VALUES($1,'Browser Attendance Event',now()-interval '2 days','COMPLETED',true,'meeting',0,50,$2) ON CONFLICT(id) DO NOTHING",[ids.pastEvent,ids.admin]);
      await pool.query("INSERT INTO attendance(event_id,user_id,status) VALUES($1,$2,'REGISTERED'),($1,$3,'PRESENT') ON CONFLICT(event_id,user_id) DO NOTHING",[ids.pastEvent,ids.member,ids.president]);res.end('seeded');return;
    }
    if(req.url==='/notification-seed'&&req.method==='POST'){
      await pool.query('DELETE FROM notifications WHERE user_id=$1',[ids.member]);
      await pool.query("INSERT INTO notifications(user_id,title,message,type,read)SELECT $1,'Browser notice '||i,'Owned notification body','MESSAGE',false FROM generate_series(1,65)i",[ids.member]);res.end(JSON.stringify({seeded:65}));return;
    }
    if(req.url==='/profile-paid-event'&&req.method==='POST'){
      await pool.query("INSERT INTO events(id,title,start_at,status,is_public,type,price,currency,max_attendees,created_by) VALUES($1,'Browser Paid Profile Event',now()+interval '3 days','PUBLISHED',true,'social',125,'TRY',50,$2) ON CONFLICT(id) DO NOTHING",[ids.paidEvent,ids.admin]);res.end('seeded');return;
    }
    if(req.url!=='/state'||req.method!=='GET'){res.writeHead(404);res.end();return;}
    try{const group=(await pool.query('SELECT user_id,status FROM group_members WHERE group_id=$1 ORDER BY user_id',[ids.group])).rows;const attendance=(await pool.query('SELECT user_id,status FROM attendance WHERE event_id=$1 ORDER BY user_id',[ids.event])).rows;const documents=(await pool.query("SELECT d.title,d.filename,d.size_bytes,encode(f.content,'hex') bytes FROM document_library d JOIN document_files f ON f.document_id=d.id")).rows;const messages=(await pool.query('SELECT sender_id,receiver_id,content FROM direct_messages')).rows;const membershipInvoices=(await pool.query("SELECT id,member_id,filename,encode(content,'hex') bytes FROM invoice_files")).rows;const membershipPayments=(await pool.query('SELECT merchant_oid,user_id,status FROM payment_transactions')).rows;const reminderRecords=(await pool.query('SELECT user_id,delivery_state FROM subscription_reminder_deliveries')).rows;const shuffleHistory=(await pool.query('SELECT id,member_count,before_snapshot,after_snapshot FROM shuffle_execution_history')).rows;const activeMemberships=(await pool.query("SELECT group_id,user_id FROM group_members WHERE status='ACTIVE'")).rows;const membershipHistory=(await pool.query('SELECT user_id,operation,before_state,after_state,operation_context FROM group_membership_history')).rows;const jobs=(await pool.query('SELECT job,source,state,summary FROM web_job_runs')).rows;res.setHeader('Content-Type','application/json');const lifecycleTickets=(await pool.query("SELECT id,user_id,subject,status FROM tickets WHERE subject='Browser lifecycle support'")).rows;const lifecycleReferrals=(await pool.query("SELECT giver_id,receiver_id,status,amount FROM referrals WHERE description='Browser lifecycle referral'")).rows;const lifecycleMeetings=(await pool.query("SELECT requester_id,partner_id,status FROM one_to_one_requests WHERE notes='Browser lifecycle meeting'")).rows;const attendanceObservations=(await pool.query('SELECT event_id,user_id,before_status,after_status,revision,reason FROM event_attendance_verifications ORDER BY revision')).rows;
const observedAttendance=(await pool.query('SELECT user_id,status FROM attendance WHERE event_id=$1 ORDER BY user_id',[ids.pastEvent])).rows;
const externalReferrals=(await pool.query("SELECT giver_id,receiver_id,type,status,description FROM referrals WHERE description='Browser external connection referral'")).rows;
const guildSettings=(await pool.query("SELECT id,name,description,status,visitor_email_subject,visitor_email_template FROM power_teams WHERE name='Browser guild saved'")).rows;
const acknowledgedGuilds=(await pool.query("SELECT id FROM power_teams WHERE name='Browser guild acknowledged'")).rows;
const notificationCounts=(await pool.query('SELECT user_id,count(*)::int AS total,count(*) FILTER(WHERE read IS DISTINCT FROM TRUE)::int AS unread FROM notifications GROUP BY user_id ORDER BY user_id')).rows;
const profileSettings=(await pool.query('SELECT id,name,phone,city,website,bio,company,tax_number,tax_office,billing_address FROM users WHERE id=$1',[ids.member])).rows;
const batchMeetings=(await pool.query("SELECT e.id,e.created_by,(SELECT count(*)::int FROM attendance a WHERE a.event_id=e.id) participants,(SELECT count(*)::int FROM event_attendance_verifications h WHERE h.event_id=e.id) history FROM events e WHERE title IN ('Browser batch observed meeting','Browser batch retry meeting')")).rows;
const rosterGuild=(await pool.query('SELECT user_id,status,role FROM power_team_members WHERE power_team_id=$1',[ids.rosterGuild])).rows;
res.end(JSON.stringify({rosterGuild,batchMeetings,notificationCounts,profileSettings,acknowledgedGuilds,guildSettings,externalReferrals,attendanceObservations,observedAttendance,group,attendance,documents,messages,mails,jobs,shuffleHistory,activeMemberships,membershipInvoices,membershipPayments,reminderRecords,membershipHistory,lifecycleTickets,lifecycleReferrals,lifecycleMeetings}));}catch(e){res.writeHead(500);res.end('Fixture state failed');}
  });control.listen(0,'127.0.0.1');await once(control,'listening');
  const fixture={ids,password,apiBase,webBase,controlBase:'http://127.0.0.1:'+control.address().port,secret,container,runDir,schemaVersions:schema.applied.length,productionWrites:false,realMail:false,realPayment:false};
  writeFileSync(path.join(runDir,'fixture.json'),JSON.stringify(fixture,null,2));writeFileSync(path.join(root,'output/web-browser-current.json'),JSON.stringify(fixture,null,2));console.log('WEB_BROWSER_READY '+path.relative(root,path.join(runDir,'fixture.json')));
  timer=setTimeout(()=>close().then(()=>process.exit(1)),20*60*1000);
  process.once('SIGINT',()=>close().then(()=>process.exit(0)));
}catch(e){console.error(e.message);await close();process.exitCode=1;}

