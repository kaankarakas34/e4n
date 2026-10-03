import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor = 0, user = { id: 'fixture-president', role: 'PRESIDENT' }, mode = 'ok', submits = [], meetingsFail = false, meetingRows = [];
let readFailure, readMalformed, withTeam = false, noGroups = false, delayedGroups, readCalls = [];
const state = [], effects = new Map();
globalThis.managerHooks = {
  useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], v => { state[i] = typeof v === 'function' ? v(state[i]) : v; }]; },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(fn, deps) { const i = cursor++; const old = effects.get(i); if (!old || deps.some((v, j) => v !== old.deps[j])) effects.set(i, { fn, deps, pending: true, cleanup: old?.cleanup }); },
};
globalThis.managerAuth = () => ({ user });
const group = { id: 'fixture-group', name: 'Fixture Group' };
globalThis.managerApi = new Proxy({}, { get: (_, method) => async payload => {
  if (method === 'submitAttendance') {
    submits.push(payload);
    if (mode === 'fail') throw new Error('Fixture unavailable');
    if (mode === 'null') return null;
    if (mode === 'bad') return { success: true, eventId: '' };
    if (mode instanceof Promise) return mode;
    return { success: true, eventId: 'fixture-event' };
  }
  readCalls.push(method);
  if (readFailure === method) throw new Error('Fixture dashboard unavailable');
  if (readMalformed === method) return null;
  if (method === 'getGroupMeetings' && meetingsFail) throw new Error('Fixture refresh unavailable');
  if (method === 'getGroupMeetings') return meetingRows;
  if (method === 'getUserGroups') return delayedGroups ?? (noGroups ? [] : [group]);
  if (method === 'getGroups') return [group];
  if (method === 'getUserPowerTeams') return withTeam ? [{ id: 'fixture-team', name: 'Fixture Team' }] : [];
  if (method === 'getGroupMembers') return [{ id: 'fixture-active', full_name: 'Active Fixture', status: 'ACTIVE' }, { id: 'fixture-requested', full_name: 'Requested Fixture', status: 'REQUESTED' }];
  return [];
} });
globalThis.confirm = () => true;
globalThis.document = { getElementById: () => ({ value: 'Fixture Topic' }) };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/GroupManagerDashboard.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === 'react') return `const {${names}} = globalThis.managerHooks;`;
  if (module === '../api/api') return 'const api = globalThis.managerApi;';
  if (module === '../stores/authStore') return 'const useAuthStore = globalThis.managerAuth;';
  if (module === 'react-router-dom') return "const useNavigate = () => () => {}; const Link = 'Link';";
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { GroupManagerDashboard } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return GroupManagerDashboard(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const has = text => nodes(render()).some(n => n.props?.children === text);
const flush = () => new Promise(done => setImmediate(done));
const runEffects = async () => { for (const e of effects.values()) if (e.pending) { e.cleanup?.(); e.cleanup = e.fn(); e.pending = false; } await flush(); };
const setup = async (navigateToAttendance = true) => {
  for (const e of effects.values()) e.cleanup?.();
  state.length = 0; effects.clear(); submits = []; mode = 'ok'; meetingsFail = false; user = { id: 'fixture-president', role: 'PRESIDENT' };
  render(); await runEffects(); render(); await runEffects();
  if (!navigateToAttendance) return;
  // Navigate through the real handlers.
  nodes(render()).find(n => n.type === 'button' && n.key === 'ATTENDANCE').props.onClick();
  nodes(render()).find(n => n.props?.onClick?.toString().includes("setActiveTab('TAKE_ATTENDANCE')")).props.onClick();
};
const save = () => nodes(render()).find(n => n.props?.children === 'Yoklamayı Kaydet');
for (const failure of ['fail', 'null', 'bad']) {
  await setup(); mode = failure; await save().props.onClick();
  assert.ok(has('Kayıt sonucu doğrulanamadı. Yeniden göndermeden önce toplantı kayıtlarını kontrol edin.'));
  assert.equal(has('Yoklama kaydı sunucu tarafından onaylandı.'), false); assert.equal(save().props.disabled, false);
}
await setup(); let resolve; mode = new Promise(done => { resolve = done; });
const handler = save().props.onClick; const first = handler(); await handler();
assert.equal(submits.length, 1); assert.equal(save().props.disabled, true);
assert.deepEqual(submits[0].items, [{ user_id: 'fixture-active', status: 'PRESENT' }]);
assert.equal(submits[0].topic, 'Fixture Topic'); assert.equal(submits[0].group_id, group.id);
resolve({ success: true, eventId: 'fixture-event' }); await first;
assert.ok(has('Yoklama kaydı sunucu tarafından onaylandı.'));
await setup(); meetingsFail = true; await save().props.onClick();
assert.ok(has('Yoklama kaydı onaylandı; toplantı listesi yenilenemedi. Yeniden kayıt göndermeyin.')); assert.equal(submits.length, 1);
await setup(); mode = new Promise(done => { resolve = done; }); const staleHandler = save().props.onClick; const pending = staleHandler();
user = { id: 'different-user', role: 'MEMBER' }; render(); await staleHandler(); assert.equal(submits.length, 1);
resolve({ success: true, eventId: 'fixture-event' }); await pending; assert.equal(has('Yoklama kaydı sunucu tarafından onaylandı.'), false);
await setup(); mode = new Promise(done => { resolve = done; }); const unmounted = save().props.onClick();
for (const e of effects.values()) e.cleanup?.();
const stateSnapshot = () => JSON.stringify(state.filter(value => !(value && typeof value === 'object' && 'current' in value)));
const snapshot = stateSnapshot(); resolve({ success: true, eventId: 'fixture-event' }); await unmounted;
assert.equal(stateSnapshot(), snapshot);
console.log('Manager attendance real component: strict ACK, reject/null/malformed, one pending request, only displayed ACTIVE rows, confirmed write vs refresh error, changed-user/role and unmount stale results. No network.');
for (const [present, total, expected] of [[null, null, 'Veri yok'], [0, 0, 'Veri yok'], [3, 2, 'Veri yok'], [0, 2, '%0'], [1, 2, '%50']]) {
  meetingRows = [{ id: 'fixture-meeting', date: '2026-10-03', topic: 'Fixture Count', attendees_count: present, total_members: total }];
  await setup(); await save().props.onClick(); assert.ok(has(expected));
  assert.equal(has('%NaN'), false); assert.equal(has('%Infinity'), false); assert.equal(has('%150'), false);
}
console.log('Manager attendance rates: null/0 denominator/inconsistent counts unknown; real zero and half preserved.');
withTeam = true;
for (const method of ['getUserGroups', 'getGroups', 'getGroupMembers', 'getGroupMeetings', 'getGroupVisitors', 'getGroupActivities', 'getAttendanceSubstitutes', 'getGroupReferrals', 'getUserPowerTeams', 'getPowerTeamMembers', 'getPowerTeamSynergy']) {
  for (const kind of ['reject', 'null']) {
    readFailure = kind === 'reject' ? method : undefined; readMalformed = kind === 'null' ? method : undefined;
    await setup(false); assert.ok(nodes(render()).some(n => n.props?.role === 'alert'));
    assert.equal(has('Yönetici olduğunuz bir grup bulunamadı.'), false);
    assert.equal(nodes(render()).some(n => n.type === 'button' && n.key === 'ATTENDANCE'), false);
    readFailure = readMalformed = undefined;
    nodes(render()).find(n => n.props?.children === 'Tekrar dene').props.onClick(); render(); await runEffects(); render(); await runEffects();
    assert.ok(nodes(render()).some(n => n.type === 'button' && n.key === 'ATTENDANCE'));
  }
}
withTeam = false; noGroups = true; await setup(false); assert.ok(has('Yönetici olduğunuz bir grup bulunamadı.'));
noGroups = false; await setup(false);
user = { id: 'changed-president', role: 'PRESIDENT' }; render(); assert.equal(nodes(render()).some(n => n.type === 'button' && n.key === 'ATTENDANCE'), false);
await runEffects(); render(); await runEffects(); assert.ok(nodes(render()).some(n => n.type === 'button' && n.key === 'ATTENDANCE'));
delayedGroups = new Promise(done => { resolve = done; }); await setup(false);
user = { id: 'fresh-president', role: 'PRESIDENT' }; delayedGroups = undefined; render(); await runEffects(); render(); await runEffects();
resolve([]); await flush(); assert.equal(has('Yönetici olduğunuz bir grup bulunamadı.'), false);
user = null; readCalls = []; render(); await runEffects(); assert.equal(readCalls.length, 0);
console.log('Manager read: every source reject/null/retry, no false empty or partial metrics, true empty, changed session hides old panel, delayed old empty ignored, unauthenticated zero reads.');
