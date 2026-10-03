import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor=0,slots=[],effects=new Map(),user,read,write,calls=0,writes=[],stateWrites=0;
globalThis.supportListHooks = {
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { stateWrites++; slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  useEffect(fn, dependencies) { const i = cursor++; const old = effects.get(i); if (!old || dependencies.some((value, j) => value !== old.dependencies[j])) effects.set(i, { fn, dependencies, pending: true, cleanup: old?.cleanup }); },
};
globalThis.supportListAuth = () => ({ user });
globalThis.supportListAPI = {getMyMeetingRequests:()=>{calls++;return read();},updateMeetingStatus:(id,status)=>{writes.push({id,status});return write(id,status);},requestMeeting:payload=>{writes.push(payload);return write(payload);}};
const compile = async (file) => {
  let code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  code=code.replace(/import React from ['"]react['"];?/g, '');
  code=code.replace(/import (?:React, )?\{([^}]+)\} from ['"]([^'"]+)['"];?/g,(line,names,module)=>{
    if(module==='react/jsx-runtime')return line.replace(module,import.meta.resolve(module));
    if(module==='react')return `const {${names}}=globalThis.supportListHooks;`;
    if(module==='../api/api')return 'const api=globalThis.supportListAPI;';
    if(module==='../stores/authStore')return 'const useAuthStore=globalThis.supportListAuth;';
    if(module==='../hooks/useMeetingRequests')return `const {${names}}=globalThis.meetingHooks;`;
    return names.split(',').map(n=>`const ${n.trim()}='${n.trim()}';`).join('\n');
  });return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
};
globalThis.meetingHooks=await compile('../src/hooks/useMeetingRequests.ts');
const {useMeetingRequests,meetingStatusLabel}=globalThis.meetingHooks;
const nodes=t=>Array.isArray(t)?t.flatMap(nodes):t&&typeof t==='object'?[t,...nodes(t.props?.children)]:[];
const text=t=>Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(t.props?.children):typeof t==='string'||typeof t==='number'?String(t):'';
const settle=()=>new Promise(r=>setImmediate(r));
const cleanup=()=>{for(const e of effects.values())e.cleanup?.();};
const flush=async()=>{for(const e of effects.values())if(e.pending){e.cleanup?.();e.cleanup=e.fn();e.pending=false;}await settle();};
const fixture=()=>({id:'meeting',senderId:'sender',receiverId:'member',topic:'Fixture topic',status:'PENDING',created_at:'2026-10-03T10:00:00Z',proposedTime:'2026-10-06T10:00:00Z',senderName:'Sender',receiverName:'Member'});
const reset=()=>{cleanup();slots=[];effects=new Map();user={id:'member',role:'MEMBER'};calls=0;writes=[];read=async()=>[fixture()];write=async(id,status)=>({success:true,data:{id,status,partner_id:'member'}});};
const render=()=>{cursor=0;return useMeetingRequests();};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const mount=async()=>{reset();render();await flush();};
for(const bad of ['reject',null,{},[null],[{...fixture(),receiverId:'other'}],[{...fixture(),proposedTime:'bad'}]]){
 reset();read=async()=>{if(bad==='reject')throw new Error('Fixture');return bad;};render();await flush();assert.ok(render().error);assert.deepEqual(render().requests,[]);
 read=async()=>[];await render().loadRequests();assert.equal(render().error,null);assert.deepEqual(render().requests,[]);
}
for(const bad of [null,{success:false},{success:true,data:{id:'other'}},{success:true,data:{id:'meeting',status:'ACCEPTED',partner_id:'other'}}]){
 await mount();write=async()=>bad;await render().handleAction('meeting','ACCEPTED');assert.ok(render().notice.includes('doğrulanamadı'));assert.equal(render().requests[0].status,'PENDING');
}
await mount();const delayed=deferred();write=()=>delayed.promise;const oldAction=render().handleAction;
const deciding=oldAction('meeting','ACCEPTED');await oldAction('meeting','REJECTED');assert.equal(writes.length,1);assert.equal(render().pending,true);
read=async()=>{throw new Error('Refresh fixture');};delayed.resolve({success:true,data:{id:'meeting',status:'ACCEPTED',partner_id:'member'}});await deciding;
assert.ok(render().notice.includes('onaylandı'));assert.ok(render().error);read=async()=>[{...fixture(),status:'ACCEPTED'}];await render().loadRequests();assert.equal(writes.length,1);
await mount();read=async()=>[{...fixture(),senderId:'member',receiverId:'other'}];await render().loadRequests();await render().handleAction('meeting','ACCEPTED');assert.equal(writes.length,0);
for(const boundary of ['session','unmount']){await mount();const delayed=deferred();write=()=>delayed.promise;const acting=render().handleAction('meeting','ACCEPTED');
 if(boundary==='session'){user={id:'other',role:'MEMBER'};render();}else cleanup();const before=stateWrites;delayed.resolve({success:true,data:{id:'meeting',status:'ACCEPTED',partner_id:'member'}});await acting;assert.equal(stateWrites,before);}
reset();user=null;render();await flush();assert.equal(calls,0);
assert.equal(meetingStatusLabel('COMPLETED'),'Tamamlandı');assert.equal(meetingStatusLabel('FUTURE_STATUS'),'Bilinmeyen durum');
for(const file of ['../src/pages/MeetingRequests.tsx','../src/components/MeetingRequestsList.tsx']){
 const component=Object.values(await compile(file)).find(v=>typeof v==='function');const view=()=>{cursor=0;return component();};
 reset();read=async()=>[{...fixture(),status:'COMPLETED'}];view();await flush();assert.ok(text(view()).includes('Tamamlandı'));assert.equal(text(view()).includes('Reddedildi'),false);
 read=async()=>{throw new Error('Read fixture');};await useLoad(view);assert.ok(text(view()).includes('Toplantı talepleri yüklenemedi.'));assert.equal(text(view()).includes('Talebi Yok'),false);
}
async function useLoad(view){ // Flush a new user context to trigger the actual shared loader.
 user={id:'member',role:'PRESIDENT'};view();await flush();view();
}
const {MeetingRequestModal}=await compile('../src/components/MeetingRequestModal.tsx');
let target={id:'recipient',name:'Recipient'},closed=0;
const modal=()=>{cursor=0;return MeetingRequestModal({targetUser:target,onClose:()=>closed++});};
const input=(type)=>nodes(modal()).find(n=>n.type==='Input'&&n.props.type===type);
const fill=()=>{input(undefined).props.onChange({target:{value:'Topic fixture'}});input('date').props.onChange({target:{value:'2026-10-06'}});input('time').props.onChange({target:{value:'12:30'}});};
const submit=()=>nodes(modal()).find(n=>n.type==='form').props.onSubmit({preventDefault(){}});
reset();closed=0;modal();await flush();fill();write=async()=>{throw new Error('Uncertain fixture');};await submit();const key=writes[0].requestId;await submit();assert.equal(writes[1].requestId,key);assert.equal(closed,0);assert.ok(text(modal()).includes('doğrulanamadı'));
write=async p=>({id:p.requestId,requester_id:p.senderId,partner_id:p.receiverId});await submit();assert.equal(closed,1);
reset();closed=0;target={id:'recipient'};modal();await flush();fill();const delayedModal=deferred();write=()=>delayedModal.promise;const submitting=submit();await submit();assert.equal(writes.length,1);
target={id:'new-recipient'};modal();delayedModal.resolve({id:writes[0].requestId,requester_id:'member',partner_id:'recipient'});await submitting;assert.equal(closed,0);
reset();target={id:'recipient'};modal();await flush();fill();input('date').props.onChange({target:{value:'2026-02-31'}});await submit();assert.equal(writes.length,0);
console.log('Real shared hook, both meeting views and request modal: read/error/retry/status truth, same-tick lock, ACK/refresh separation, recipient/session/unmount boundaries, stable retry key and valid dates passed.');
