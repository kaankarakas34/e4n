import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {randomUUID} from 'node:crypto';
const root=process.argv[2];if(!root)throw new Error('Pass mobile source root');
const compile=file=>ts.transpileModule(readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const module=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
let cursor=0,slots=[],effects=new Map(),user,rowsRead,detailRead,write,requests=[],stateWrites=0;
globalThis.mobileSupportHooks={
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>{stateWrites++;slots[i]=typeof value==='function'?value(slots[i]):value;}];},
 useRef(initial){const i=cursor++;return slots[i]??={current:initial};},
 useEffect(fn,deps){const i=cursor++,old=effects.get(i);if(!old || deps.some((x,j)=>x!==old.deps[j]))effects.set(i,{fn,deps,pending:true,cleanup:old?.cleanup});}
};
globalThis.mobileSupportAuth=()=>({user});
globalThis.mobileSupportApi={list:()=>rowsRead(),detail:()=>detailRead(),create:(...args)=>{requests.push({kind:'create',args});return write();},reply:(...args)=>{requests.push({kind:'reply',args});return write();},status:(...args)=>{requests.push({kind:'status',args});return write();}};
let code=compile('components/support-workspace.tsx').replace(/import React, \{([^}]+)\} from ['"]react['"];?/,(_,names)=>`import React from '${import.meta.resolve('react')}';const {${names}}=globalThis.mobileSupportHooks;`);
code=code.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g,(line,names,source)=>{
 if(source==='react/jsx-runtime')return line.replace(source,import.meta.resolve(source));
 if(source==='@/hooks/use-auth')return 'const useAuth=globalThis.mobileSupportAuth;';
 if(source==='@/utils/support-api')return 'const supportApi=globalThis.mobileSupportApi;';
 if(source==='expo-modules-core')return 'const uuid={v4:globalThis.mobileSupportUUID};';
 return names.split(',').map(s=>s.trim()==='StyleSheet'?'const StyleSheet={create:value=>value};':`const ${s.trim()}='${s.trim()}';`).join('\n');
});
globalThis.mobileSupportUUID=randomUUID;
const {SupportWorkspace}=await module(code);
const fixture={id:'ticket',user_id:'member',subject:'Fixture',status:'OPEN',created_at:'2026-10-03T10:00:00Z',updated_at:'2026-10-03T10:00:00Z'};
const nodes=tree=>Array.isArray(tree)?tree.flatMap(nodes):tree&&typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[];
const text=tree=>Array.isArray(tree)?tree.map(text).join(''):tree&&typeof tree==='object'?text(tree.props?.children):typeof tree==='string'?tree:'';
let props={};const render=()=>{cursor=0;return SupportWorkspace(props);};
const flush=async()=>{for(const effect of effects.values())if(effect.pending){effect.cleanup?.();effect.cleanup=effect.fn();effect.pending=false;}await new Promise(r=>setImmediate(r));};
const cleanup=()=>{for(const effect of effects.values())effect.cleanup?.();};
const reset=()=>{cleanup();slots=[];effects=new Map();requests=[];props={};user={id:'member',role:'MEMBER'};rowsRead=async()=>[fixture];detailRead=async()=>({ticket:fixture,messages:[]});write=async()=>({success:true});};
const button=label=>nodes(render()).find(n=>n.props?.accessibilityRole==='button' && n.props.accessibilityLabel===label);
const input=(label,value)=>nodes(render()).find(n=>n.props?.accessibilityLabel===label).props.onChangeText(value);
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return{promise,resolve,reject};};
const mount=async()=>{reset();render();await flush();};
await mount();assert.ok(button('Talep: Fixture'));await button('Talep: Fixture').props.onPress();await flush();assert.ok(text(render()).includes('Bu talepte henüz mesaj yok.'));
input('Yanıt','Reply');write=async()=>{throw new Error('Lost response');};await button('Yanıt gönder').props.onPress();assert.ok(text(render()).includes('İşlem sonucu doğrulanamadı.'));const key=requests[0].args.at(-1);
write=async()=>({success:true});await button('Yanıt gönder').props.onPress();assert.equal(requests[1].args.at(-1),key);assert.equal(nodes(render()).find(n=>n.props?.accessibilityLabel==='Yanıt').props.value,'');
input('Konu','Subject');input('Mesaj','Message');const pending=deferred();write=()=>pending.promise;const press=button('Talep oluştur').props.onPress;const saving=press();await press();assert.equal(requests.length,3);assert.equal(button('Talep oluştur').props.disabled,true);pending.resolve(fixture);await saving;assert.equal(nodes(render()).find(n=>n.props?.accessibilityLabel==='Konu').props.value,'');
await mount();rowsRead=async()=>{throw new Error('Offline');};await button('Talepleri tekrar yükle').props.onPress();assert.ok(text(render()).includes('Destek talepleri yüklenemedi.'));assert.ok(!text(render()).includes('Destek talebi bulunmuyor.'));assert.ok(!button('Talep: Fixture'));
rowsRead=async()=>[];await button('Talepleri tekrar yükle').props.onPress();assert.ok(text(render()).includes('Destek talebi bulunmuyor.'));
await mount();const late=deferred();detailRead=()=>late.promise;const reading=button('Talep: Fixture').props.onPress();user={id:'other',role:'MEMBER'};render();const before=stateWrites;late.resolve({ticket:fixture,messages:[]});await reading;assert.equal(stateWrites,before);assert.ok(!button('Yanıt gönder'));
await mount();props={adminOnly:true};assert.ok(text(render()).includes('Erişim reddedildi.'));user={id:'admin',role:'ADMIN'};render();await flush();await button('Talep: Fixture').props.onPress();assert.ok(button('Talebi kapat'));input('Yanıt','Admin reply');await button('Yanıt gönder').props.onPress();assert.equal(requests.at(-1).kind,'reply');
detailRead=async()=>({ticket:{...fixture,status:'CLOSED'},messages:[]});await button('Talebi kapat').props.onPress();assert.equal(requests.at(-1).kind,'status');assert.ok(button('Tekrar aç'));
await mount();detailRead=async()=>({ticket:{...fixture,status:'CLOSED'},messages:[]});await button('Talep: Fixture').props.onPress();assert.ok(!button('Yanıt gönder'));
await mount();await button('Talep: Fixture').props.onPress();input('Yanıt','Late');const lateWrite=deferred();write=()=>lateWrite.promise;const writing=button('Yanıt gönder').props.onPress();cleanup();const writesBefore=stateWrites;lateWrite.resolve({success:true});await writing;assert.equal(stateWrites,writesBefore);
// Run actual mobile API validation with controlled transport, separately from hook fixtures.
let response;globalThis.supportTransport={get:async()=>response,post:async()=>response,put:async()=>response};
const service=await module(compile('utils/support-api.ts').replace(/import \{ apiClient \} from ['"]\.\/api-client['"];?/,'const apiClient=globalThis.supportTransport;'));
response=[{...fixture,user_id:'foreign'}];await assert.rejects(service.supportApi.list('member',false));assert.equal((await service.supportApi.list('admin',true)).length,1);
for(const bad of [null,{},[null]]){response=bad;await assert.rejects(service.supportApi.list('member',false));}
response={ticket:fixture,messages:[{id:'m',ticket_id:'wrong',sender_id:'member',sender_role:'MEMBER',message:'text',created_at:fixture.created_at}]};await assert.rejects(service.supportApi.detail('ticket','member'));
response={success:true,ticket_id:'other',message_id:'m',status:'OPEN'};await assert.rejects(service.supportApi.reply('ticket','text','key'));
response={success:true,ticket_id:'ticket',status:'OPEN'};await assert.rejects(service.supportApi.status('ticket','CLOSED','key'));
response={...fixture,user_id:'foreign'};await assert.rejects(service.supportApi.create('member','Fixture','text','key'));
console.log('Actual mobile support workspace/service: member/admin lifecycle, list failure vs empty, closed member, same-key retry, one pending, foreign/malformed/target ACK, late session/unmount passed. Controlled RN hooks/transport; no device/network.');
