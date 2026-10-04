import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
let slots=[],cursor=0,effects=new Map(),user={id:'owner',role:'MEMBER'},read,reads=0,writes=0;
globalThis.reportHooks={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],v=>{writes++;slots[i]=typeof v==='function'?v(slots[i]):v;}];},useRef(initial){const i=cursor++;return slots[i]??={current:initial};},useEffect(fn,deps){const i=cursor++,old=effects.get(i);if(!old||deps.some((v,j)=>v!==old.deps[j]))effects.set(i,{fn,deps,pending:true,cleanup:old?.cleanup});}};
globalThis.reportAuth=()=>({user});
globalThis.reportApi={get:(owner,range)=>{reads++;return read(owner,range);}};
const compile=file=>ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const mod=code=>import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const source=compile('../src/pages/Reports.tsx').replace(/import AdminReports from [^;]+;/,"const AdminReports='AdminReports';").replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g,(line,names,path)=>{
  if(path==='react')return `const {${names}}=globalThis.reportHooks;`;
  if(path==='react/jsx-runtime')return line.replace(path,import.meta.resolve(path));
  if(path.includes('authStore'))return 'const useAuthStore=globalThis.reportAuth;';
  if(path.includes('personalReports'))return 'const personalReportsApi=globalThis.reportApi;';
  return names.split(',').map(n=>`const ${n.trim()}='${n.trim()}';`).join('\n');
});
const {Reports}=await mod(source);
const nodes=t=>Array.isArray(t)?t.flatMap(nodes):t&&typeof t==='object'?[t,...nodes(t.props?.children)]:[];
const text=t=>Array.isArray(t)?t.map(text).join(''):t&&typeof t==='object'?text(t.props?.children):typeof t==='string'||typeof t==='number'?String(t):'';
const render=()=>{cursor=0;return Reports();};
const flush=async()=>{for(const e of effects.values())if(e.pending){e.cleanup?.();e.cleanup=e.fn();e.pending=false;}await new Promise(r=>setImmediate(r));};
const cleanup=()=>{for(const e of effects.values())e.cleanup?.();};
const fixture=(owner='owner',range='30d')=>({version:1,ownerId:owner,dateRange:range,period:{start:'2026-09-01T00:00:00Z',end:'2026-10-01T00:00:00Z'},referralsGiven:{count:0,successful:0,missingAmounts:0,knownVolume:'0',volume:'0'},referralsReceived:{count:0,successful:0,missingAmounts:0,knownVolume:'0',volume:'0'},meetingsCompleted:0,visitorsHosted:0,educationHours:'0',performance:{score:null,color:null}});
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
const change=range=>nodes(render()).find(n=>n.type==='select').props.onChange({target:{value:range}});
read=async(o,r)=>fixture(o,r);assert.ok(text(render()).includes('yükleniyor'));await flush();assert.ok(text(render()).includes('Bilinmiyor'));assert.ok(!text(render()).includes('PDF'));assert.equal(reads,1);
read=async()=>{throw new Error('Offline');};change('7d');assert.ok(text(render()).includes('yükleniyor'));await flush();assert.ok(text(render()).includes('yüklenemedi'));assert.ok(!text(render()).includes('Bilinen toplam'));
read=async(o,r)=>({...fixture(o,r),referralsGiven:{count:2,successful:2,missingAmounts:1,knownVolume:'12.34',volume:null}});
nodes(render()).find(n=>n.type==='Button').props.onClick();render();await flush();assert.ok(text(render()).includes('Eksik tutar: 1 kayıt'));assert.ok(text(render()).includes('12.34'));
const late=deferred(),otherPending=deferred();read=o=>o==='owner'?late.promise:otherPending.promise;change('90d');render();await flush();user={id:'other',role:'MEMBER'};render();await flush();const before=writes;late.resolve(fixture('owner','90d'));await new Promise(r=>setImmediate(r));
// Injected transport bypasses validation here; the old-owner promise must be ignored.
assert.equal(writes,before);assert.ok(text(render()).includes('yükleniyor'));
const a=deferred();read=()=>a.promise;change('30d');render();await flush();change('7d');render();await flush();change('30d');assert.ok(text(render()).includes('yükleniyor'));await flush();cleanup();const unmount=writes;a.resolve(fixture());await new Promise(r=>setImmediate(r));assert.equal(writes,unmount);
user={id:'admin',role:'ADMIN'};assert.equal(render().type,'AdminReports');const adminReads=reads;await flush();assert.equal(reads,adminReads);
globalThis.reportTransport={get:async()=>fixture()};const apiSource=compile('../src/api/personalReports.ts').replace(/import \{ referralTransport \} from ['"]\.\/api['"];?/,'const referralTransport=globalThis.reportTransport;');
const {personalReportsApi}=await mod(apiSource);await personalReportsApi.get('owner','30d');
for(const bad of [{...fixture(),ownerId:'foreign'},{...fixture(),dateRange:'7d'},{...fixture(),period:{start:'2026-09-25T00:00:00Z',end:'2026-10-01T00:00:00Z'}},{...fixture(),educationHours:'NaN'},{...fixture(),performance:{score:101,color:'GREEN'}},null]){globalThis.reportTransport.get=async()=>bad;await assert.rejects(personalReportsApi.get('owner','30d'));}
console.log('Personal report TSX/API PASS: real zero, unknown, loading/error/retry, range/owner/ABA/unmount, ADMIN, malformed replies. Controlled hooks, no browser DOM.');
