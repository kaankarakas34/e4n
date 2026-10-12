import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import express from 'express';
import {installAdminMemberDirectory} from '../src/admin-member-directory.js';
const src=readFileSync(new URL('../../src/api/adminMemberDirectory.ts',import.meta.url),'utf8').replace("import {referralTransport} from './api';",'const referralTransport={};');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {sortMembersNewestFirst,filterDirectory,recentlyJoined,validMemberDirectory}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const owner='10000000-0000-4000-8000-000000000001',asOf='2026-10-12T17:00:00.000Z';
const make=(n,name,date)=>({id:'10000000-0000-4000-8000-'+String(n).padStart(12,'0'),name,email:name+'@example.invalid',phone:'555 1234',city:'İstanbul',profession:'Mimar',company:'Test Şirketi',role:'MEMBER',account_status:'ACTIVE',created_at:date,position:null,linkedin_profile:null,groups:[]});
const members=[make(2,'A Eski','2026-10-01T12:00:00.000Z'),make(3,'Z Yeni','2026-10-12T16:00:00.000Z'),make(4,'B Dün','2026-10-11T12:00:00.000Z'),make(5,'C Tarihsiz',null)];
const original=JSON.stringify(members);
assert.deepEqual(sortMembersNewestFirst(members).map(m=>m.name),['Z Yeni','B Dün','A Eski','C Tarihsiz']);assert.equal(JSON.stringify(members),original);
assert.deepEqual(filterDirectory(members,{search:'',role:'ALL',status:'ALL',group:'ALL'}).map(m=>m.name),['Z Yeni','B Dün','A Eski','C Tarihsiz']);
assert.equal(filterDirectory(members,{search:'555',role:'ALL',status:'ALL',group:'ALL'}).length,4);
assert.equal(members.filter(m=>recentlyJoined(m,asOf)).length,2);
assert.equal(recentlyJoined({created_at:'2026-10-05T17:00:00.000Z'},asOf),true);assert.equal(recentlyJoined({created_at:'2026-10-05T16:59:59.999Z'},asOf),false);assert.equal(recentlyJoined({created_at:'2026-10-13T00:00:00.000Z'},asOf),false);assert.equal(recentlyJoined({created_at:null},asOf),false);
const ties=[make(9,'Z','2026-10-12T16:00:00Z'),make(8,'A','2026-10-12T16:00:00Z')];assert.equal(sortMembersNewestFirst(ties)[0].id,ties[1].id);
let role='ADMIN';const client={release(){},async query(sql){
 if(sql.startsWith('BEGIN')||sql==='COMMIT'||sql==='ROLLBACK')return {rows:[]};
 if(sql.startsWith('SELECT role'))return {rows:[{role,as_of:asOf}]};
 if(sql.includes('FROM users ORDER BY')){assert.ok(sql.includes('ORDER BY created_at DESC NULLS LAST,id'));return {rows:sortMembersNewestFirst(members).map(({groups,...m})=>m)};}
 if(sql.includes('FROM group_members'))return {rows:[]};throw Error('Unhandled query');
}};
const app=express();installAdminMemberDirectory(app,{pool:{connect:async()=>client},authenticateToken:(req,res,next)=>{if(!req.headers.authorization)return res.sendStatus(401);req.user={id:owner};next();}});
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const url='http://127.0.0.1:'+server.address().port+'/api/admin/member-directory';
try{let response=await fetch(url,{headers:{Authorization:'Bearer fixture'}});assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private.*no-store/);const data=await response.json();assert.equal(validMemberDirectory(data,owner),true);assert.equal(data.members[0].name,'Z Yeni');assert.equal((await fetch(url)).status,401);role='MEMBER';assert.equal((await fetch(url,{headers:{Authorization:'Bearer fixture'}})).status,403);console.log('Member management newest-first/date bounds/phone search/HTTP authority DTO: PASS. Isolated query adapter, not PostgreSQL.');}finally{await new Promise(r=>server.close(r));}
