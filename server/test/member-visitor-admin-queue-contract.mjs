import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import express from 'express';
import ts from 'typescript';
import {installAdminVisitorQueue} from '../src/admin-visitor-queue.js';

// Actual HTTP handlers and TypeScript DTO; isolated query adapter, no live database.
const owner='10000000-0000-4000-8000-000000000001';
const member='10000000-0000-4000-8000-000000000002';
const group='10000000-0000-4000-8000-000000000003';
const id='10000000-0000-4000-8000-000000000004';
const visitorId='10000000-0000-4000-8000-000000000005';
let row,visitor,dbRole='ADMIN',readsFail=false;
const client={release(){},async query(sql,values=[]){
  if(sql.startsWith('BEGIN')||sql==='COMMIT'||sql==='ROLLBACK')return {rows:[]};
  if(sql.startsWith('SELECT role FROM users'))return {rows:dbRole?[{role:dbRole}]:[]};
  if(sql.startsWith('SELECT id, name, email, phone'))return {rowCount:1,rows:[{id:member,name:'Ayşe Test',email:'ayse@example.invalid',company:'Test Şirketi',phone:'555',profession:'Mimar',account_status:'ACTIVE'}]};
  if(sql.startsWith('SELECT id, name FROM groups'))return {rowCount:1,rows:[{id:group,name:'Test Grubu'}]};
  if(sql.includes('FROM group_members'))return {rowCount:0,rows:[]};
  if(sql.includes('count(*)'))return {rows:[{count:0}]};
  if(sql.startsWith('SELECT 1 FROM visitors'))return {rowCount:0,rows:[]};
  if(sql.startsWith('INSERT INTO public_visitors')){
    row={id,name:values[0],email:values[1],phone:values[2],company:values[3],profession:values[4],source:'free_member_visitor',status:'PENDING',created_at:'2026-10-12T15:00:00.000Z',form_data:JSON.parse(values[5])};
    for(const key of ['event_id','event_title','event_start_at','inviter_name','title','web_linkedin','activity_area','duration','target_customer','why_join','value_add','previous_groups'])row[key]=null;
    return {rows:[]};
  }
  if(sql.startsWith('INSERT INTO visitors')){
    assert.ok(sql.includes("'PENDING'"),'New request must not claim an invitation');
    visitor={id:visitorId,status:'PENDING',group_id:values[6]};return {rows:[visitor]};
  }
  if(sql.startsWith('UPDATE public_visitors')){row.status='CONTACTED';return {rows:[]};}
  if(sql.startsWith('SELECT pv.id')){if(readsFail)throw new Error('isolated read failure');if(sql.includes("AND pv.source='free_member_visitor'"))assert.equal(row.source,'free_member_visitor');return {rows:[row]};}
  throw new Error('Unhandled fixture query: '+sql);
}};
const pool={connect:async()=>client};
const app=express();app.use(express.json());
const authenticateToken=(req,res,next)=>{if(!req.headers.authorization)return res.sendStatus(401);req.user={id:req.headers.authorization==='Bearer member'?member:owner};next();};
const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const start=source.indexOf("app.post('/api/user/request-visitor',");
const end=source.indexOf('// Group Aggregate Stats',start);
vm.runInNewContext(source.slice(start,end),{app,pool,authenticateToken,Date});
const publicStart=source.indexOf("app.post('/api/visitors/apply',");
const publicEnd=source.indexOf("app.get(['/api/admin/public-visitors'",publicStart);
vm.runInNewContext(source.slice(publicStart,publicEnd),{app,pool,Date});
installAdminVisitorQueue(app,{pool,authenticateToken});
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const call=(url,method='GET',body,token='admin')=>fetch(base+url,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
try{
  assert.equal((await call('/api/visitors/apply','POST',{source:'free_member_visitor'},null)).status,400,'Public form must not impersonate member group requests');
  const created=await call('/api/user/request-visitor','POST',{groupId:group,notes:'İlk toplantınızı ziyaret etmek istiyorum.'},'member');
  assert.equal(created.status,201);const result=await created.json();assert.equal(result.request.status,'PENDING');assert.ok(!result.message.includes('davetiyesi'));assert.equal(visitor.group_id,group);
  row.form_data.token='must-not-leak';row.form_data.payment_status='PAID';
  const read=await call('/api/admin/visitor-queue?kind=member-requests');assert.equal(read.status,200);assert.match(read.headers.get('cache-control'),/private.*no-store/);const data=await read.json();
  const request=data.visitors[0];assert.equal(request.source,'free_member_visitor');assert.equal(request.form_data.user_id,member);assert.equal(request.form_data.group_id,group);assert.equal(request.form_data.group_name,'Test Grubu');assert.equal(request.form_data.notes,'İlk toplantınızı ziyaret etmek istiyorum.');assert.ok(!JSON.stringify(data).includes('must-not-leak'));assert.equal(request.form_data.payment_status,undefined);
  const transportSource=readFileSync(new URL('../../src/api/adminVisitorQueue.ts',import.meta.url),'utf8').replace("import {referralTransport} from './api';",'const referralTransport = {};');
  const compiled=ts.transpileModule(transportSource,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
  const {validQueueVisitor}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
  assert.equal(validQueueVisitor(request),true);assert.equal(validQueueVisitor({...request,form_data:{...request.form_data,user_id:'bad'}}),false);
  assert.equal((await call('/api/admin/visitor-queue','GET',undefined,null)).status,401);
  assert.equal((await call('/api/admin/visitor-queue?kind=other')).status,400);assert.equal((await call('/api/admin/visitor-queue?kind=member-requests&userId='+member)).status,400);
  dbRole='MEMBER';assert.equal((await call('/api/admin/visitor-queue')).status,403);dbRole='ADMIN';
  const contacted=await call('/api/admin/visitor-queue/'+id+'/contacted','PUT',{});assert.equal(contacted.status,200);assert.equal((await contacted.json()).visitor.status,'CONTACTED');assert.equal(visitor.status,'PENDING','Contact must not grant attendance or group membership');
  readsFail=true;assert.equal((await call('/api/admin/visitor-queue')).status,500);
  console.log('Member request → admin HTTP queue → typed DTO/contact: PASS; current role/privacy/pending/error verified. Query adapter only; not PostgreSQL.');
}finally{await new Promise(r=>server.close(r));}
