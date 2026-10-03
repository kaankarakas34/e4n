import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const state = [];
let cursor = 0, callback, cleanup, dependencies, pendingEffect;
let user = { id: 'admin-fixture', role: 'ADMIN' }, id = 'group-fixture', team = false;
let fail, malformed, deferred, emptyMembers = false, calls = [];
globalThis.groupHooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
  },
  useEffect(fn, deps) {
    callback = fn;
    if (!dependencies || deps.some((value, i) => value !== dependencies[i])) {
      dependencies = deps; pendingEffect = true;
    }
  },
};
globalThis.groupAuth = () => ({ user });
globalThis.groupParams = () => ({ id });
globalThis.groupLocation = () => ({ pathname: team ? '/admin/power-teams/detail' : '/admin/groups/detail' });
globalThis.groupApi = new Proxy({}, { get: (_, method) => async requestedId => {
  calls.push(method);
  if (fail === method) throw new Error('Unavailable fixture');
  if (malformed === method) return null;
  if (method === 'getGroup') return deferred ? deferred : { id: requestedId, name: 'Fixture detail', status: 'ACTIVE' };
  if (method === 'getPowerTeams') return [{ id, name: 'Fixture detail', status: 'ACTIVE' }];
  if (/Members$/.test(method)) return emptyMembers ? [] : [{ id: 'active-fixture', full_name: 'Active Fixture', status: 'ACTIVE' }, { id: 'pending-fixture', full_name: 'Pending Fixture', status: 'REQUESTED' }];
  return [];
} });
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/AdminGroupDetail.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === 'react') return `const {${names}} = globalThis.groupHooks;`;
  if (module === '../api/api') return 'const api = globalThis.groupApi;';
  if (module === '../stores/authStore') return 'const useAuthStore = globalThis.groupAuth;';
  if (module === 'react-router-dom') return 'const useParams = globalThis.groupParams; const useLocation = globalThis.groupLocation; const useNavigate = () => () => {};';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { AdminGroupDetail } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return AdminGroupDetail(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const has = text => nodes(render()).some(node => node.props?.children === text || (Array.isArray(node.props?.children) && node.props.children.includes(text)));
const flush = () => new Promise(resolve => setImmediate(resolve));
const effects = async () => { if (pendingEffect) { cleanup?.(); cleanup = callback(); pendingEffect = false; } await flush(); };
const reset = () => { cleanup?.(); state.length = 0; dependencies = undefined; pendingEffect = false; fail = malformed = deferred = undefined; emptyMembers = false; calls = []; };
for (team of [false, true]) {
  const methods = team ? ['getPowerTeams', 'getPowerTeamMembers', 'getGroupMeetings', 'getGroupVisitors', 'getPowerTeamReferrals', 'getPowerTeamSynergy'] : ['getGroup', 'getGroupMembers', 'getGroupMeetings', 'getGroupVisitors', 'getGroupReferrals'];
  for (const method of methods) {
    reset(); fail = method; render(); await effects();
    assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
    assert.equal(has('Toplam Ciro'), false);
    fail = undefined;
    nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick(); render(); await effects();
    assert.ok(has('Fixture detail')); assert.ok(has('Veri yok'));
    const activeCard = nodes(render()).find(node => Array.isArray(node.props?.children) && node.props.children[0]?.props?.children === 'Aktif Üyeler');
    assert.equal(activeCard.props.children[1].props.children, 1);
    malformed = method; cleanup?.(); cleanup = callback(); await flush();
    assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
    assert.equal(has('Fixture detail'), false);
  }
}
team = false; reset(); render(); await effects(); assert.ok(has('Fixture detail'));
user = { id: 'next-admin-fixture', role: 'ADMIN' }; assert.equal(has('Fixture detail'), false); await effects(); assert.ok(has('Fixture detail'));
id = 'new-fixture'; assert.equal(has('Fixture detail'), false); await effects(); assert.ok(has('Fixture detail'));
reset(); emptyMembers = true; render(); await effects();
const emptyCard = nodes(render()).find(node => Array.isArray(node.props?.children) && node.props.children[0]?.props?.children === 'Aktif Üyeler');
assert.equal(emptyCard.props.children[1].props.children, 0); assert.ok(has('Veri yok'));
let resolve;
reset(); deferred = new Promise(done => { resolve = done; }); render(); await effects(); cleanup();
resolve({ id, name: 'Late fixture' }); await flush(); assert.equal(has('Late fixture'), false);
reset(); deferred = new Promise(done => { resolve = done; }); render(); await effects();
id = 'newer-fixture'; deferred = undefined; render(); await effects(); assert.ok(has('Fixture detail'));
resolve({ id: 'new-fixture', name: 'Late fixture' }); await flush(); assert.equal(has('Late fixture'), false);
for (const role of ['MEMBER', 'VISITOR']) { reset(); user = { id: 'other-fixture', role }; render(); await effects(); assert.equal(calls.length, 0); assert.ok(has('Erişim Kısıtlı')); }
for (const role of ['ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY_TREASURER']) { reset(); user = { id: 'allowed-fixture', role }; render(); await effects(); assert.ok(has('Fixture detail')); }
user = null; reset(); render(); await effects(); assert.equal(calls.length, 0);
user = { id: 'admin-fixture', role: 'ADMIN' }; id = undefined; reset(); render(); await effects(); assert.equal(calls.length, 0); assert.ok(has('Geçersiz detay bağlantısı.'));
console.log('Web group/team detail: per-source error/null/retry, unknown event metric, ACTIVE count, route/unmount stale results and existing role read guards verified. No network/writes.');
