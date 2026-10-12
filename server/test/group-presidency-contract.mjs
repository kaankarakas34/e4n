import assert from 'node:assert/strict';
import express from 'express';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {installGroupPresidency,clearGroupPresident,handoffGroupApplications} from '../src/group-presidency.js';
import {installGroupApplications} from '../src/group-applications.js';
import {beginGroupMutation,requireGroupManager,isUuid,groupError,sendGroupMutationError} from '../src/group-capacity.js';
import {setMembershipOperationContext} from '../src/membership-operation-context.js';

const admin='10000000-0000-4000-8000-000000000001',target='10000000-0000-4000-8000-000000000002',group='10000000-0000-4000-8000-000000000003';
let state,before;
const reset=()=>{state={role:'PRESIDENT',title:'PRESIDENT',member:true,localRole:'MEMBER',adminRole:'ADMIN',count:11,other:false,notification:false,pending:true,assigned:target};};reset();
const client={release(){},async query(sql,values=[]){
  if(sql.startsWith('BEGIN')){before=structuredClone(state);return {rows:[]};}
  if(sql==='ROLLBACK'){state=before;return {rows:[]};}
  if(sql==='COMMIT'||sql.startsWith('SET ')||sql.includes('pg_advisory_xact_lock')||sql.includes('set_config'))return {rows:[]};
  if(sql.startsWith('SELECT role,to_jsonb'))return {rows:[{role:state.adminRole,group_title:null}]};
  if(sql.startsWith('SELECT role FROM users'))return {rows:[{role:values[0]===admin?state.adminRole:state.role}]};
  if(sql.startsWith('SELECT name FROM users'))return {rows:[{name:'Fixture admin'}]};
  if(sql.startsWith('SELECT role,group_title'))return {rows:[{role:state.role,group_title:state.title}]};
  if(sql.startsWith('SELECT gm.id FROM group_members')&&sql.includes('group_id<>'))return {rows:state.other?[{id:'other'}]:[]};
  if(sql.startsWith('SELECT id FROM group_members')&&sql.includes('group_id<>'))return {rows:state.other?[{id:'other'}]:[]};
  if(sql.startsWith('SELECT id FROM group_members'))return {rows:state.member?[{id:target}]:[]};
  if(sql.startsWith('UPDATE group_members SET role')){state.localRole='MEMBER';return {rows:[]};}
  if(sql.startsWith('UPDATE users SET role=CASE')){if(sql.includes("role='VICE_PRESIDENT'")){if(state.role==='VICE_PRESIDENT')state.role='MEMBER';state.title=null;}else{if(state.role==='PRESIDENT')state.role='MEMBER';if(state.title==='PRESIDENT')state.title=null;}return {rows:[]};}
  if(sql.startsWith('SELECT g.id,')&&sql.includes('active_records'))return {rows:[{id:group,active_records:state.count,president_records:state.member&&(state.role==='PRESIDENT'||state.localRole==='PRESIDENT')?1:0}]};
  if(sql.startsWith('SELECT id FROM group_applications'))return {rowCount:sql.includes('president_id')&&state.pending&&state.assigned===target?1:0,rows:[]};
  if(sql.startsWith('SELECT u.id,u.name FROM group_members'))return {rows:[]};
  if(sql.startsWith('UPDATE group_applications SET president_id')){state.assigned=values[2];return {rows:[]};}
  if(sql.startsWith('DELETE FROM group_members')){if(!state.member)return {rowCount:0,rows:[]};state.member=false;state.count--;return {rowCount:1,rows:[{user_id:target}]};}
  if(sql.startsWith('SELECT name FROM groups'))return {rows:[{name:'Fixture group'}]};
  if(sql.startsWith('INSERT INTO notifications')){assert.ok(sql.includes("'GROUP_UPDATE'"),'Use a type accepted by production notifications_type_check');state.notification=true;return {rows:[]};}
  if(sql.startsWith('SELECT account_status'))return {rows:[{account_status:'ACTIVE',subscription_plan:null,subscription_end_date:null}]};
  if(sql.includes('last_removed_at'))return {rows:[{removal_count:0,last_removed_at:null}]};
  if(sql.startsWith('SELECT g.id,g.name'))return {rows:[{id:group,name:'Fixture group',members:[],meeting_dates:[],own_status:null,application_state:null}]};
  if(sql.includes("FROM users WHERE role='ADMIN'"))return {rows:state.adminRole==='ADMIN'?[{id:admin,name:'Fixture admin'}]:[]};
  if(sql.startsWith('SELECT id FROM users WHERE id='))return {rowCount:1,rows:[{id:admin}]};
  throw Error('Unhandled fixture query: '+sql);
}};
const pool={connect:async()=>client};const app=express();app.use(express.json());
const authenticateToken=(req,res,next)=>{if(!req.headers.authorization)return res.sendStatus(401);req.user={id:admin};next();};
installGroupPresidency(app,{pool,authenticateToken});installGroupApplications(app,{pool,authenticateToken});
const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const start=source.indexOf("app.delete('/api/groups/:id/members/:userId',");
const end=source.indexOf('// Remove Power Team Member',start);
vm.runInNewContext(source.slice(start,end),{app,pool,authenticateToken,isUuid,beginGroupMutation,requireGroupManager,setMembershipOperationContext,groupError,sendGroupMutationError,clearGroupPresident,handoffGroupApplications});
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const base='http://127.0.0.1:'+server.address().port;
const call=(url,method='GET',body,auth=true)=>fetch(base+url,{method,headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer fixture'}:{})},...(body?{body:JSON.stringify(body)}:{})});
const clear=()=>call('/api/admin/groups/'+group+'/president','DELETE',{userId:target});
try{
  assert.equal((await call('/api/admin/groups/'+group+'/president','DELETE',{userId:target},false)).status,401);
  state.adminRole='MEMBER';assert.equal((await clear()).status,403);assert.equal(state.role,'PRESIDENT');reset();
  assert.equal((await clear()).status,200);assert.equal(state.member,true);assert.equal(state.role,'MEMBER');assert.equal(state.title,null);assert.equal(state.notification,false);assert.equal(state.assigned,admin,'Pending applications must leave the former president');
  assert.equal((await clear()).status,200,'Clearing twice must be safe');
  state.member=false;assert.equal((await clear()).status,404);reset();
  state.localRole='PRESIDENT';assert.equal((await clear()).status,200);assert.equal(state.localRole,'MEMBER');reset();
  state.count=36;assert.equal((await clear()).status,409);assert.equal(state.role,'PRESIDENT','Capacity failure must roll back role clearing');reset();
  state.other=true;assert.equal((await clear()).status,409);assert.equal(state.role,'PRESIDENT');reset();
  const removed=await call('/api/groups/'+group+'/members/'+target,'DELETE',{reason_category:'VOLUNTARY'});assert.equal(removed.status,200);assert.equal((await removed.json()).removed,true);assert.equal(state.member,false);assert.equal(state.role,'MEMBER');assert.equal(state.notification,true);assert.equal(state.assigned,admin);
  const discovery=await call('/api/group-discovery');assert.equal(discovery.status,200);const dto=await discovery.json();assert.equal(dto.groups[0].president,null);assert.equal(dto.groups[0].president_ready,true,'Admin must manage an unassigned group');
  state.adminRole='MEMBER';const unavailable=await call('/api/group-discovery');assert.equal((await unavailable.json()).groups[0].president_ready,false);
  const titles=['MEMBERSHIP_PRESIDENT','VISITOR_PRESIDENT','ONE_TO_ONE_COORD','EDUCATION_COORD','EVENT_COORDINATOR'];
  const dismiss=title=>call('/api/admin/groups/'+group+'/leadership','DELETE',{userId:target,groupTitle:title});
  for(const title of titles){reset();state.pending=false;state.role=title.endsWith('PRESIDENT')?'VICE_PRESIDENT':'MEMBER';state.title=title;
    assert.equal((await dismiss(title)).status,200);assert.equal(state.member,true);assert.equal(state.role,'MEMBER');assert.equal(state.title,null);assert.equal((await dismiss(title)).status,200);
  }
  reset();state.title='VISITOR_PRESIDENT';state.role='ADMIN';assert.equal((await dismiss(state.title)).status,200);assert.equal(state.role,'ADMIN','Clearing a task must preserve admin authority');
  reset();state.title='VISITOR_PRESIDENT';assert.equal((await dismiss(state.title)).status,200);assert.equal(state.role,'PRESIDENT','Clearing a committee task must preserve separate presidency');
  reset();state.title='VISITOR_PRESIDENT';assert.equal((await dismiss('EDUCATION_COORD')).status,409);assert.equal(state.title,'VISITOR_PRESIDENT');
  reset();state.title='VISITOR_PRESIDENT';state.other=true;assert.equal((await dismiss(state.title)).status,409);assert.equal(state.title,'VISITOR_PRESIDENT');
  reset();state.title='VISITOR_PRESIDENT';state.adminRole='MEMBER';assert.equal((await dismiss(state.title)).status,403);assert.equal(state.title,'VISITOR_PRESIDENT');
  console.log('Group presidency/real remove HTTP handlers: PASS (admin-only, clear/replay, capacity rollback, other scope, GROUP_UPDATE, admin fallback). Isolated query adapter; not PostgreSQL.');
}finally{await new Promise(r=>server.close(r));}
