import assert from 'node:assert/strict';
import express from 'express';
import {retiredGuildRequest} from '../src/retired-guilds.js';
import fs from 'node:fs';
const app=express();let reached=0;
app.use(express.json());app.use(express.urlencoded({extended:true}));app.use(retiredGuildRequest);app.use((req,res)=>{reached++;res.json({ok:true});});
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
try{
 const retired=['/api/power-teams','/api/power-teams/','/api/power-teams/old/members','/api/power-teams/old/join','/API/POWER-TEAMS','/API/ADMIN/POWER-TEAM-SETTINGS/','/api/user/power-teams?userId=old','/api/user/power-team-requests','/api/admin/power-team-settings'];
 for(const path of retired)for(const method of ['GET','POST','PUT','PATCH','DELETE']){
  const res=await fetch(base+path,{method});assert.equal(res.status,410,`${method} ${path}`);assert.equal((await res.json()).code,'INTERNAL_GUILDS_RETIRED');
 }
 for(const [path,body] of [['/api/admin/assign-role',{type:'POWER_TEAM'}],['/api/events',{power_team_id:'old'}]]){
  const res=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(res.status,410);
 }
 assert.equal((await fetch(base+'/api/admin/assign-role',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'type=POWER_TEAM'})).status,410);
 assert.equal(reached,0,'No retired request reaches authentication, database, or business handlers');
 for(const path of ['/api/groups','/api/groups/old/members','/api/user/groups','/api/group-applications/mine'])assert.equal((await fetch(base+path)).status,200);
 assert.equal((await fetch(base+'/api/admin/assign-role',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'GROUP'})})).status,200);
 const entry=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');assert.ok(entry.indexOf('app.use(retiredGuildRequest)')<entry.indexOf("app.use('/api/admin'"));
 console.log('Guild retirement PASS: 48 retired requests blocked before handlers; 5 group requests preserved.');
}finally{await new Promise(resolve=>server.close(resolve));}
