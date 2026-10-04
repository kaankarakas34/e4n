import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
let slots=[],cursor=0,effects=new Map(),user={id:'admin',role:'ADMIN'},token='token-a',read,reads=0,writes=0;
globalThis.adminHooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{writes++;slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=cursor++;return slots[i]??={current:initial};},useEffect(fn,deps){const i=cursor++,old=effects.get(i);if(!old||deps.some((v,j)=>v!==old.deps[j]))effects.set(i,{fn,deps,pending:true,cleanup:old?.cleanup});}};
globalThis.adminAuth=()=>({user,token});
globalThis.adminApi={get:(owner,range)=>{reads++;return read(owner,range);}};
const compile=file=>ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const mod=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const source=compile('../src/pages/AdminReports.tsx').replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g,(line,names,path)=>{
  if(path==='react')return `const {${names}}=globalThis.adminHooks;`;
  if(path==='react/jsx-runtime')return line.replace(path,import.meta.resolve(path));
  if(path.includes('authStore'))return 'const useAuthStore=globalThis.adminAuth;';
  if(path.includes('adminReports'))return 'const adminReportsApi=globalThis.adminApi;';
  return names.split(',').map(n=>`const ${n.trim()}='${n.trim()}';`).join('\n');
});
const {default:Reports}=await mod(source);
const nodes=t=>Array.isArray(t)?t.flatMap(nodes):t&&typeof t==='object'?[t,...nodes(typeof t.type==='function'?t.type(t.props):t.props?.children)]:[];
const text=t=>Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(typeof t.type==='function'?t.type(t.props):t.props?.children):typeof t==='string'||typeof t==='number'?String(t):'';
const render=()=>{cursor=0;return Reports();};
const flush=async()=>{for(const e of effects.values())if(e.pending){e.cleanup?.();e.cleanup=e.fn();e.pending=false;}await new Promise(r=>setImmediate(r));};
const cleanup=()=>{for(const e of effects.values())e.cleanup?.();};
const zero=()=>({count:0,successful:0,missingAmounts:0,knownVolume:'0',volume:'0'});
const fixture=(owner='admin',range='30d')=>{
 const end='2026-10-04T00:00:00Z',start=new Date(Date.parse(end)-({'7d':7,'30d':30,'90d':90,'1y':365}[range]*86400000)).toISOString();
 const months=[],m=new Date(start);m.setUTCDate(1);
 while(m<new Date(end)){months.push({month:m.toISOString().slice(0,7),newAccounts:0,referrals:zero()});m.setUTCMonth(m.getUTCMonth()+1);}
 return{version:1,ownerId:owner,dateRange:range,period:{start,end},stock:{accounts:1,active_groups:0,active_teams:0},
 activity:{new_accounts:0,events:0,meetings:0,visitor_records:0,joined_visitors:0,attended_visitors:0},
 volumes:{total:zero(),internal:zero(),external:zero(),unclassified:zero()},monthly:months,
 performance:[{id:owner,name:'Fixture',profession:'Test',score:null,color:null}],attendance:[{id:owner,name:'Fixture',present:0,absent:0,late:0,medical:0,substitute:0}]};
};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const change=range=>nodes(render()).find(n=>n.type==='select').props.onChange({target:{value:range}});
const click=label=>nodes(render()).find(n=>(n.type==='button'||n.type==='Button')&&text(n)===label).props.onClick();
read=async(o,r)=>fixture(o,r);assert.ok(text(render()).includes('yükleniyor'));await flush();assert.ok(text(render()).includes('Aylık kayıt özeti'));assert.equal(reads,1);
click('Trafik Işıkları');assert.ok(text(render()).includes('Bilinmiyor'));click('Katılım Raporu');assert.ok(text(render()).includes('devamsızlık sayılmaz'));assert.ok(nodes(render()).some(n=>n.type==='td'&&n.props.children===0));
read=async()=>{throw new Error('Offline');};change('7d');assert.ok(text(render()).includes('yükleniyor'));await flush();assert.ok(text(render()).includes('yüklenemedi'));assert.ok(!text(render()).includes('Kaydedilmiş yoklama'));
read=async(o,r)=>fixture(o,r);click('Raporu tekrar yükle');render();await flush();assert.ok(text(render()).includes('Kaydedilmiş yoklama'));
click('Genel Bakış');const missing=fixture();missing.volumes.total={count:1,successful:1,missingAmounts:1,knownVolume:'0',volume:null};
read=async()=>missing;change('30d');render();await flush();assert.ok(text(render()).includes('Bilinmiyor (1 eksik tutar'));
const late=deferred(),next=deferred();read=o=>o==='admin'?late.promise:next.promise;change('90d');render();await flush();
user={id:'other',role:'ADMIN'};render();await flush();const before=writes;late.resolve(fixture('admin','90d'));await new Promise(r=>setImmediate(r));assert.equal(writes,before);assert.ok(text(render()).includes('yükleniyor'));
const aba=deferred();read=()=>aba.promise;change('30d');render();await flush();change('7d');render();await flush();change('30d');assert.ok(text(render()).includes('yükleniyor'));await flush();
token='token-b';assert.ok(text(render()).includes('yükleniyor'));await flush();cleanup();const unmount=writes;aba.resolve(fixture());await new Promise(r=>setImmediate(r));assert.equal(writes,unmount);
user={id:'other',role:'MEMBER'};assert.ok(text(render()).includes('yalnız yönetici'));const deniedReads=reads;await flush();assert.equal(reads,deniedReads);
globalThis.adminReportTransport={get:async()=>fixture()};const apiSource=compile('../src/api/adminReports.ts').replace(/import \{ referralTransport \} from ['"]\.\/api['"];?/,'const referralTransport=globalThis.adminReportTransport;');
const {adminReportsApi}=await mod(apiSource);await adminReportsApi.get('admin','30d');
for(const mutate of [r=>({...r,ownerId:'foreign'}),r=>({...r,dateRange:'7d'}),r=>({...r,stock:{...r.stock,accounts:'1'}}),r=>({...r,monthly:[]}),r=>({...r,monthly:[...r.monthly,r.monthly[0]]}),r=>({...r,attendance:[]}),r=>({...r,volumes:{...r.volumes,total:{...zero(),knownVolume:'NaN'}}}),r=>({...r,activity:{...r.activity,new_accounts:1}}),()=>null]){
 globalThis.adminReportTransport.get=async()=>mutate(fixture());await assert.rejects(adminReportsApi.get('admin','30d'));
}
console.log('Admin report actual TSX/typed API PASS: 3 tabs, zero/unknown, read/error/retry, role/owner/token/range/ABA/unmount, malformed/cohort/totals. Controlled hooks; no DOM.');
