import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {randomUUID} from 'node:crypto';
const root=process.argv[2];if(!root)throw new Error('Pass mobile root');
const compile=file=>ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const mod=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const fixture={id:'referral',giver_id:'sender',receiver_id:'member',type:'INTERNAL',temperature:'HOT',status:'PENDING',description:'Fixture',amount:null,created_at:'2026-10-04T10:00:00Z',giver_name:'Sender',receiver_name:'Member'};
let response,calls=[];
globalThis.referralFixtureTransport={get:async(...args)=>{calls.push(args);return response;},post:async(...args)=>{calls.push(args);return response;},put:async(...args)=>{calls.push(args);return response;}};
for(const file of [path.join(root,'utils/referrals-api.ts'),'src/api/referrals.ts']){
 let source=compile(file).replace(/import \{ (?:referralTransport as )?apiClient \} from ['"][^'"]+['"];?/,'const apiClient=globalThis.referralFixtureTransport;');
 const {referralsApi:api,referralRevenue}=await mod(source);
 response=[fixture];assert.equal((await api.list('member')).length,1);await assert.rejects(api.list('foreign'));
 for(const bad of [null,{},[null],[{...fixture,status:'UNKNOWN'}],[{...fixture,amount:'bad'}],[{...fixture,created_at:'bad'}]]){response=bad;await assert.rejects(api.list('member'));}
 response=[{id:'member',name:'Self'},{id:'sender',full_name:'Partner'},{id:'sender',name:'Partner'}];assert.deepEqual(await api.people('member'),[{id:'sender',name:'Partner'}]);assert.equal(calls.at(-1)[0],'/user/friends');
 await api.people('member',{kind:'group',id:'g',name:'Group'});assert.equal(calls.at(-1)[0],'/groups/g/members');
 response=[];assert.deepEqual(await api.scopes('member'),[]);response=null;await assert.rejects(api.scopes('member'));
 const input={receiverId:'member',type:'INTERNAL',temperature:'HOT',description:' Fixture '};response=fixture;await api.create('sender',input,'referral');assert.equal(calls.at(-1)[1].receiverId,'member');
 for(const fields of [{id:'wrong'},{giver_id:'wrong'},{receiver_id:'wrong'},{type:'EXTERNAL'},{description:'wrong'},{amount:10}]){response={...fixture,...fields};await assert.rejects(api.create('sender',input,'referral'));}
 response={...fixture,status:'SUCCESSFUL',amount:'12.34'};await api.decide('member','referral','SUCCESSFUL',12.34);await assert.rejects(api.decide('foreign','referral','SUCCESSFUL',12.34));await assert.rejects(api.decide('member','referral','SUCCESSFUL',12));
 for(const v of ['','NaN','Infinity','-1','1.001','1,50','0'])assert.throws(()=>referralRevenue(v));assert.equal(referralRevenue('0',false),0);assert.equal(referralRevenue('12.34'),12.34);
}

const nodes=tree=>Array.isArray(tree)?tree.flatMap(nodes):tree&&typeof tree==='object'?[tree,...nodes(tree.props?.children)]:[];
const text=tree=>Array.isArray(tree)?tree.map(text).join(''):tree&&typeof tree==='object'?text(tree.props?.children):typeof tree==='string'?tree:'';
const deferred=()=>{let resolve,reject;const promise=new Promise((r,j)=>{resolve=r;reject=j;});return{promise,resolve,reject};};
for(const platform of ['mobile','web']){
 let cursor=0,slots=[],effects=new Map(),user,rowsRead,peopleRead,scopesRead,write,requests=[],stateWrites=0;
 globalThis.referralHooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return[slots[i],value=>{stateWrites++;slots[i]=typeof value==='function'?value(slots[i]):value;}];},useRef(initial){const i=cursor++;return slots[i]??={current:initial};},useEffect(fn,deps){const i=cursor++,old=effects.get(i);if(!old||deps.some((x,j)=>x!==old.deps[j]))effects.set(i,{fn,deps,pending:true,cleanup:old?.cleanup});}};
 globalThis.referralAuth=()=>({user});globalThis.referralScreenApi={list:()=>rowsRead(),scopes:()=>scopesRead(),people:(...args)=>peopleRead(...args),create:(...args)=>{requests.push({kind:'create',args});return write();},decide:(...args)=>{requests.push({kind:'decide',args});return write();}};
 globalThis.referralRevenue=value=>{if(!/^\d+(?:\.\d{1,2})?$/.test(value)||!(Number(value)>0))throw new Error('Pozitif ciro');return Number(value);};
 let code=compile(platform==='mobile'?path.join(root,'app/features/referrals.tsx'):'src/components/ReferralWorkspace.tsx');
 code=code.replace(/import React, \{([^}]+)\} from ['"]react['"];?/,(_,names)=>`import React from '${import.meta.resolve('react')}';const {${names}}=globalThis.referralHooks;`);
 code=code.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g,(line,names,source)=>{
  if(source==='react/jsx-runtime')return line.replace(source,import.meta.resolve(source));
  if(source.includes('use-auth')||source.includes('authStore'))return 'const useAuth=globalThis.referralAuth;';
  if(source.includes('referrals'))return 'const referralsApi=globalThis.referralScreenApi,referralRevenue=globalThis.referralRevenue;';
  if(source==='expo-modules-core')return `const uuid={v4:()=>crypto.randomUUID()};`;
  return names.split(',').map(s=>s.trim()==='StyleSheet'?'const StyleSheet={create:v=>v};':`const ${s.trim()}='${s.trim()}';`).join('\n');
 });
 const loaded=await mod(code),Screen=platform==='mobile'?loaded.default:loaded.ReferralWorkspace;
 let incomingOnly=false;const render=()=>{cursor=0;return Screen({incomingOnly});};
 const tick=()=>new Promise(r=>setImmediate(r));
 const flush=async()=>{for(let pass=0;pass<4;pass++){render();for(const effect of effects.values())if(effect.pending){effect.cleanup?.();effect.cleanup=effect.fn();effect.pending=false;}await tick();}};
 const cleanup=()=>{for(const effect of effects.values())effect.cleanup?.();};
 const reset=()=>{cleanup();slots=[];effects=new Map();requests=[];user={id:'member',role:'MEMBER'};rowsRead=async()=>[fixture];peopleRead=async()=>[{id:'sender',name:'Partner'}];scopesRead=async()=>[{id:'group',kind:'group',name:'Group'}];write=async()=>fixture;};
 const button=label=>nodes(render()).find(n=>platform==='mobile'?(n.props?.accessibilityLabel===label||n.props?.accessibilityLabel===label+' ✓'):n.type==='button'&&(n.props?.['aria-label']===label||text(n)===label));
 const press=async label=>{assert.ok(button(label),`${platform} button missing: ${label}`);const r=(platform==='mobile'?button(label).props.onPress:button(label).props.onClick)();await r;await tick();};
 const input=(label,value)=>{const n=nodes(render()).find(n=>(n.props?.accessibilityLabel||n.props?.['aria-label'])===label);assert.ok(n,`${platform} input missing: ${label}`);platform==='mobile'?n.props.onChangeText(value):n.props.onChange({target:{value}});};
 const mount=async()=>{reset();await flush();};
 const form=async()=>{if(platform==='web')await press('Yeni referans');if(platform==='web')input('Grup veya lonca','group:group');else await press('Grup/lonca: Group');await flush();if(platform==='web')input('Alıcı','sender');else await press('Üye: Partner');input('Referans açıklaması','Referral');};
 await mount();if(platform==='web')await press('Aldıklarım');assert.ok(button('Başarılı: referral'));input('Ciro: referral','0');await press('Başarılı: referral');assert.equal(requests.length,0);
 rowsRead=async()=>[{...fixture,status:'SUCCESSFUL',amount:'12.34'},{...fixture,id:'second',status:'SUCCESSFUL',amount:'7.66'}];await press('Referansları yenile');assert.ok(text(render()).includes('20 ₺'),'decimal strings must sum numerically');
 rowsRead=async()=>[{...fixture,status:'SUCCESSFUL',amount:null}];await press('Referansları yenile');assert.ok(text(render()).includes('Bilinmiyor'),'missing legacy revenue cannot become zero volume');
 rowsRead=async()=>[fixture];await press('Referansları yenile');
 input('Ciro: referral','12.34');await press('Başarılı: referral');assert.equal(requests[0].kind,'decide');assert.equal(requests[0].args[3],12.34);
 await form();write=async()=>{throw new Error('Lost ACK');};await press('Referansı gönder');const key=requests.at(-1).args.at(-1);assert.ok(text(render()).includes('doğrulanamadı'));
 write=async()=>fixture;await press('Referansı gönder');assert.equal(requests.at(-1).args.at(-1),key);assert.ok(text(render()).includes('Referans kaydedildi.'));
 await form();const waiting=deferred();write=()=>waiting.promise;const count=requests.length;const handler=platform==='mobile'?button('Referansı gönder').props.onPress:button('Referansı gönder').props.onClick;const saving=handler();await handler();assert.equal(requests.length,count+1);assert.ok(button('Referansı gönder').props.disabled);waiting.resolve(fixture);await saving;await tick();
 await mount();if(platform==='web')await press('Aldıklarım');rowsRead=async()=>{throw new Error('Offline');};await press('Referansları yenile');assert.ok(text(render()).includes('yüklenemedi'));assert.ok(!button('Başarılı: referral'));assert.ok(!text(render()).includes('Henüz referans kaydı yok.'));
 rowsRead=async()=>[];await press('Referansları yeniden yükle');assert.ok(text(render()).includes(platform==='mobile'?'Henüz referans kaydı yok.':'referans bulunmuyor.'));
 await mount();await form();peopleRead=async()=>{throw new Error('Offline');};await press('Üyeleri yeniden yükle');assert.ok(button('Referansı gönder').props.disabled);assert.ok(text(render()).includes('Üyeler yüklenemedi'));
 await mount();await form();const late=deferred();peopleRead=()=>late.promise;const readHandler=platform==='mobile'?button('Üyeleri yeniden yükle').props.onPress:button('Üyeleri yeniden yükle').props.onClick;const reading=readHandler();peopleRead=async()=>[];
 if(platform==='web')input('Yönlendirme türü','EXTERNAL');else await press('Grup dışı');await flush();const before=stateWrites;late.resolve([{id:'sender',name:'Old Partner'}]);await reading;await tick();assert.equal(stateWrites,before);assert.ok(!text(render()).includes('Old Partner'));
 await mount();if(platform==='web')await press('Aldıklarım');const old=platform==='mobile'?button('Olumsuz: referral').props.onPress:button('Olumsuz: referral').props.onClick;user={id:'other',role:'MEMBER'};await flush();user={id:'member',role:'MEMBER'};await flush();await old();assert.equal(requests.length,0);
 await mount();await form();const lateWrite=deferred();write=()=>lateWrite.promise;const unmountHandler=platform==='mobile'?button('Referansı gönder').props.onPress:button('Referansı gönder').props.onClick;const unmountSaving=unmountHandler();cleanup();const beforeUnmount=stateWrites;lateWrite.resolve(fixture);await unmountSaving;await tick();assert.equal(stateWrites,beforeUnmount);
 await mount();await form();rowsRead=async()=>{throw new Error('Refresh failed');};await press('Referansı gönder');assert.ok(text(render()).includes('Referans kaydedildi.'));assert.ok(!text(render()).includes('İşlem sonucu doğrulanamadı'));
 if(platform==='web')await press('Aldıklarım');assert.ok(text(render()).includes('Bilinmiyor'),'read failure cannot show zero stats');
 if(platform==='web'){await mount();incomingOnly=true;assert.ok(button('Başarılı: referral'));assert.ok(!button('Yeni referans'));}
 console.log(`${platform} actual TSX: list/form/receiver/revenue, scoped people, keyed retry/one lock, read errors, confirmed-save refresh failure, ABA/unmount passed.`);
}
