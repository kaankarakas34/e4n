import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {randomUUID} from 'node:crypto';
const root=process.argv[2];if(!root)throw new Error('Pass mobile source root');
const compile=file=>ts.transpileModule(readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const module=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
let response,calls=[];globalThis.meetingTransport={get:async()=>response,post:async(...args)=>{calls.push(args);return response;},put:async(...args)=>{calls.push(args);return response;}};
const actual=await module(compile('utils/meetings-api.ts').replace(/import \{ apiClient \} from ['"]\.\/api-client['"];?/,'const apiClient=globalThis.meetingTransport;'));
const fixture={id:'request',requester_id:'sender',partner_id:'member',notes:'Fixture',status:'PENDING',meeting_date:'2026-10-06T10:00:00Z',created_at:'2026-10-03T10:00:00Z',record_kind:'REQUEST'};
response=[fixture];assert.equal((await actual.meetingsApi.list('member')).length,1);await assert.rejects(actual.meetingsApi.list('foreign'));
for(const bad of [null,{},[null],[{...fixture,meeting_date:'invalid'}]]){response=bad;await assert.rejects(actual.meetingsApi.list('member'));}
response=[{id:'member',name:'Self'},{id:'sender',name:'Partner'}];assert.deepEqual(await actual.meetingsApi.people('member'),[{id:'sender',name:'Partner'}]);
response=fixture;await actual.meetingsApi.request('sender','member','Fixture',fixture.meeting_date,'request');
response={...fixture,id:'wrong'};await assert.rejects(actual.meetingsApi.request('sender','member','Fixture',fixture.meeting_date,'request'));
response={...fixture,status:'ACCEPTED'};await actual.meetingsApi.decide('member','request','ACCEPTED');await assert.rejects(actual.meetingsApi.decide('foreign','request','ACCEPTED'));
response={...fixture,status:'REJECTED'};await assert.rejects(actual.meetingsApi.decide('member','request','ACCEPTED'));
for(const [date,time] of [['2026-02-30','10:00'],['2026-13-01','10:00'],['2026-10-06','25:00'],['','10:00']])assert.throws(()=>actual.meetingTime(date,time));
assert.ok(actual.meetingTime('2026-10-06','10:30').endsWith('Z'));assert.ok(actual.meetingCalendar(fixture).includes('20261006T100000Z/20261006T110000Z'));

let cursor=0,slots=[],effects=new Map(),user,rowsRead,peopleRead,write,requests=[],stateWrites=0,calendarCalls=[];
globalThis.meetingHooks={
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>{stateWrites++;slots[i]=typeof value==='function'?value(slots[i]):value;}];},
 useRef(initial){const i=cursor++;return slots[i]??={current:initial};},
 useEffect(fn,deps){const i=cursor++,old=effects.get(i);if(!old || deps.some((x,j)=>x!==old.deps[j]))effects.set(i,{fn,deps,pending:true,cleanup:old?.cleanup});}
};
globalThis.meetingAuth=()=>({user});globalThis.meetingUUID=randomUUID;globalThis.meetingCalendar=actual.meetingCalendar;globalThis.meetingTime=actual.meetingTime;
globalThis.meetingApi={list:()=>rowsRead(),people:()=>peopleRead(),request:(...args)=>{requests.push({kind:'request',args});return write();},decide:(...args)=>{requests.push({kind:'decide',args});return write();}};
globalThis.meetingLinking={openURL:async url=>calendarCalls.push(url)};
let code=compile('app/features/meeting-requests.tsx').replace(/import React, \{([^}]+)\} from ['"]react['"];?/,(_,names)=>`import React from '${import.meta.resolve('react')}';const {${names}}=globalThis.meetingHooks;`);
code=code.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g,(line,names,source)=>{
 if(source==='react/jsx-runtime')return line.replace(source,import.meta.resolve(source));
 if(source==='@/hooks/use-auth')return 'const useAuth=globalThis.meetingAuth;';
 if(source==='@/utils/meetings-api')return 'const meetingsApi=globalThis.meetingApi,meetingTime=globalThis.meetingTime,meetingCalendar=globalThis.meetingCalendar;';
 if(source==='expo-modules-core')return 'const uuid={v4:globalThis.meetingUUID};';
 return names.split(',').map(s=>s.trim()==='StyleSheet'?'const StyleSheet={create:value=>value};':s.trim()==='Linking'?'const Linking=globalThis.meetingLinking;':`const ${s.trim()}='${s.trim()}';`).join('\n');
});
const {default:Screen}=await module(code);
const nodes=tree=>Array.isArray(tree)?tree.flatMap(nodes):tree&&typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[];
const text=tree=>Array.isArray(tree)?tree.map(text).join(''):tree&&typeof tree==='object'?text(tree.props?.children):typeof tree==='string'?tree:'';
const render=()=>{cursor=0;return Screen();};
const flush=async()=>{for(const effect of effects.values())if(effect.pending){effect.cleanup?.();effect.cleanup=effect.fn();effect.pending=false;}await new Promise(r=>setImmediate(r));};
const cleanup=()=>{for(const effect of effects.values())effect.cleanup?.();};
const reset=()=>{cleanup();slots=[];effects=new Map();requests=[];user={id:'member',role:'MEMBER'};rowsRead=async()=>[fixture];peopleRead=async()=>[{id:'sender',name:'Partner'}];write=async()=>fixture;};
const button=label=>nodes(render()).find(n=>n.props?.accessibilityRole==='button' && n.props.accessibilityLabel===label);
const input=(label,value)=>nodes(render()).find(n=>n.props?.accessibilityLabel===label).props.onChangeText(value);
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return{promise,resolve,reject};};
const mount=async()=>{reset();render();await flush();};
const form=()=>{button('Üye: Partner').props.onPress();input('Toplantı konusu','Meeting');input('Toplantı tarihi','2026-10-06');input('Toplantı saati','10:30');};
await mount();assert.ok(button('Kabul et: request'));assert.ok(text(render()).includes('Toplantı talebi'));
await button('Kabul et: request').props.onPress();assert.equal(requests[0].kind,'decide');assert.ok(text(render()).includes('Talep onaylandı.'));
form();input('Toplantı tarihi','2026-02-30');await button('Toplantı talebi gönder').props.onPress();assert.equal(requests.length,1);assert.ok(text(render()).includes('tarih ve saati'));
input('Toplantı tarihi','2026-10-06');write=async()=>{throw new Error('Lost ACK');};await button('Toplantı talebi gönder').props.onPress();const key=requests.at(-1).args.at(-1);assert.equal(nodes(render()).find(n=>n.props?.accessibilityLabel==='Toplantı konusu').props.value,'Meeting');
write=async()=>fixture;await button('Toplantı talebi gönder').props.onPress();assert.equal(requests.at(-1).args.at(-1),key);assert.equal(nodes(render()).find(n=>n.props?.accessibilityLabel==='Toplantı konusu').props.value,'');
form();const waiting=deferred();write=()=>waiting.promise;const press=button('Toplantı talebi gönder').props.onPress,count=requests.length;const writing=press();await press();assert.equal(requests.length,count+1);assert.ok(button('Toplantı talebi gönder').props.disabled);waiting.resolve(fixture);await writing;
await mount();rowsRead=async()=>{throw new Error('Offline');};await button('Talepleri yenile').props.onPress();assert.ok(text(render()).includes('Talepleri')||text(render()).includes('talepleri'));assert.ok(text(render()).includes('yüklenemedi'));assert.ok(!button('Kabul et: request'));assert.ok(!text(render()).includes('bulunmuyor.'));
rowsRead=async()=>[];await button('Talepleri yenile').props.onPress();assert.ok(text(render()).includes('Henüz toplantı talebi'));
await mount();peopleRead=async()=>{throw new Error('Offline');};await button('Üyeleri yenile').props.onPress();assert.ok(text(render()).includes('Üyeler yüklenemedi'));assert.ok(button('Toplantı talebi gönder').props.disabled);
await mount();rowsRead=async()=>[{...fixture,partner_id:'sender',requester_id:'member',status:'PENDING'},{...fixture,id:'activity',status:'COMPLETED',record_kind:'ACTIVITY'},{...fixture,id:'unknown',status:'OTHER'}];await button('Talepleri yenile').props.onPress();assert.ok(!button('Kabul et: request'));assert.ok(!button('Kabul et: activity'));assert.ok(!button('Kabul et: unknown'));assert.ok(text(render()).includes('Görüşme kaydı'));assert.ok(text(render()).includes('Bilinmeyen durum'));
rowsRead=async()=>[{...fixture,status:'ACCEPTED'}];await button('Talepleri yenile').props.onPress();await button('Takvime ekle: request').props.onPress();assert.equal(calendarCalls.length,1);
await mount();const late=deferred();rowsRead=()=>late.promise;const reading=button('Talepleri yenile').props.onPress();rowsRead=async()=>[];user={id:'other',role:'PRESIDENT'};render();await flush();const before=stateWrites;late.resolve([fixture]);await reading;assert.equal(stateWrites,before);
// An old A callback remains invalid after A→B→A, even if strings match again.
await mount();const old=button('Kabul et: request').props.onPress;user={id:'other',role:'MEMBER'};render();await flush();user={id:'member',role:'MEMBER'};render();await flush();await old();assert.equal(requests.length,0);
await mount();form();const lateWrite=deferred();write=()=>lateWrite.promise;const saving=button('Toplantı talebi gönder').props.onPress();cleanup();const beforeUnmount=stateWrites;lateWrite.resolve(fixture);await saving;assert.equal(stateWrites,beforeUnmount);
assert.ok(readFileSync(path.join(root,'app/(tabs)/menu.tsx'),'utf8').includes("route: '/features/meeting-requests'"));
console.log('Actual mobile meeting screen/service: incoming/outgoing/activity separation, date/no-write, keyed retry, pending lock, read errors, target/owner ACK, calendar URL, session ABA/unmount and menu route passed. Controlled RN; no device/network.');
