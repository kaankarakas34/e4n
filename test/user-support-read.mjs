import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor = 0, slots = [], effects = new Map(), user, read, detailRead, calls = 0, stateWrites = 0, detailCalls = 0, write, writes = [];
globalThis.supportListHooks = {
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { stateWrites++; slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  useEffect(fn, dependencies) { const i = cursor++; const old = effects.get(i); if (!old || dependencies.some((value, j) => value !== old.dependencies[j])) effects.set(i, { fn, dependencies, pending: true, cleanup: old?.cleanup }); },
};
globalThis.supportListAuth = () => ({ user });
globalThis.supportListAPI = { replyTicket: (id, message) => { writes.push({ id, message }); return write(); }, updateTicketStatus: (id, status) => { writes.push({ id, status }); return write(); }, getTickets: () => { calls++; return read(); }, getTicketDetails: id => { detailCalls++; return detailRead(id); } };
let code = ts.transpileModule(readFileSync(new URL('../src/pages/SupportTickets.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
code = code.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === 'react') return `const {${names}} = globalThis.supportListHooks;`;
  if (module === '../stores/authStore') return 'const useAuthStore = globalThis.supportListAuth;';
  if (module === '../api/api') return 'const api = globalThis.supportListAPI;';
  if (module === 'react-router-dom') return 'const useNavigate = () => () => {};';
  if (module === '../utils/dateUtils') return 'const formatDate = value => value;';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { SupportTickets } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const fixture = () => ({ id: 'ticket', subject: 'Fixture ticket', user_id: 'member', user_name: 'Fixture member', user_email: 'fixture@example.invalid', status: 'OPEN', created_at: '2026-10-03T10:00:00Z', updated_at: '2026-10-03T10:00:00Z' });
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const text = tree => Array.isArray(tree) ? tree.map(text).join('') : tree && typeof tree === 'object' ? text(tree.props?.children) : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : '';
const render = () => { cursor = 0; return SupportTickets(); };
const settle = () => new Promise(resolve => setImmediate(resolve));
const flush = async () => { for (const effect of effects.values()) if (effect.pending) { effect.cleanup?.(); effect.cleanup = effect.fn(); effect.pending = false; } await settle(); };
const cleanup = () => { for (const effect of effects.values()) effect.cleanup?.(); };
const reset = () => { cleanup(); writes = []; write = async () => ({ success: true }); slots = []; effects = new Map(); user = { id: 'member', role: 'MEMBER' }; read = async () => []; detailRead = async id => ({ ticket: { ...fixture(), id }, messages: [] }); };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };


reset(); assert.ok(nodes(render()).some(node => node.props?.role === 'status')); await flush();
assert.ok(text(render()).includes('Henüz bir destek talebiniz yok.'));
for (const invalid of ['reject', null, {}, [null], [{ ...fixture(), id: '' }], [{ ...fixture(), subject: {} }], [{ ...fixture(), updated_at: 'invalid' }], [{ ...fixture(), user_id: 'another-member' }]]) {
  reset(); read = async () => { if (invalid === 'reject') throw new Error('fixture failure'); return invalid; };
  render(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.equal(text(render()).includes('Henüz bir destek talebiniz yok.'), false);
  read = async () => [fixture()];
  await nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick();
  assert.ok(text(render()).includes('Fixture ticket'));
}
reset(); read = async () => [fixture()]; render(); await flush();
const oldRow = nodes(render()).find(node => node.props?.onClick?.toString().includes('loadTicketDetails(ticket.id)')).props.onClick;
user = { id: 'another-admin', role: 'ADMIN' };
assert.ok(nodes(render()).some(node => node.props?.role === 'status')); assert.equal(text(render()).includes('Fixture ticket'), false);
const beforeDetails = detailCalls; await oldRow(); assert.equal(detailCalls, beforeDetails, 'old-context detail click cannot request');
const late = deferred(); read = () => late.promise; await flush();
user = null; render(); const beforeLate = stateWrites;
late.resolve([fixture()]); await settle(); assert.equal(stateWrites, beforeLate, 'late list ignored before effect cleanup');
const beforeRestricted = calls; await flush(); assert.equal(calls, beforeRestricted); assert.ok(text(render()).includes('Destek talepleri için giriş yapın.'));
reset(); const unmounted = deferred(); read = () => unmounted.promise; render(); await flush(); cleanup();
const beforeUnmount = stateWrites; unmounted.resolve([fixture()]); await settle(); assert.equal(stateWrites, beforeUnmount);
console.log('User support list: initial loading, confirmed empty, owner/network/malformed errors and retry, old-session callback, logout and unmount boundaries passed.');
const message = id => ({ id: 'message', ticket_id: id, sender_id: 'member', sender_role: 'MEMBER', sender_name: 'Fixture member', message: 'Fixture message', created_at: '2026-10-03T10:00:00Z' });
const row = id => nodes(render()).find(node => node.key === id && node.props?.onClick);
const mountList = async () => { reset(); read = async () => [fixture(), { ...fixture(), id: 'other', subject: 'Other ticket' }]; render(); await flush(); };
for (const invalid of ['reject', null, {}, { ticket: { ...fixture(), id: 'wrong' }, messages: [] }, { ticket: { ...fixture(), user_id: 'wrong-owner' }, messages: [] }, { ticket: fixture(), messages: null }, { ticket: fixture(), messages: [null] }, { ticket: fixture(), messages: [{ ...message('ticket'), ticket_id: 'other' }] }, { ticket: fixture(), messages: [{ ...message('ticket'), message: {} }] }]) {
  await mountList(); detailRead = async () => { if (invalid === 'reject') throw new Error('fixture detail failure'); return invalid; };
  await row('ticket').props.onClick();
  assert.ok(text(render()).includes('Talep detayları yüklenemedi.'));
  assert.equal(text(render()).includes('Bu talepte henüz mesaj bulunmuyor.'), false);
  detailRead = async id => ({ ticket: { ...fixture(), id }, messages: [] });
  await nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick();
  assert.ok(text(render()).includes('Bu talepte henüz mesaj bulunmuyor.'));
}
await mountList(); detailRead = async id => ({ ticket: { ...fixture(), id }, messages: [message(id)] });
await row('ticket').props.onClick(); assert.ok(text(render()).includes('Fixture message'));
const oldDetail = deferred(); detailRead = id => id === 'ticket' ? oldDetail.promise : Promise.resolve({ ticket: { ...fixture(), id }, messages: [] });
const pendingOld = row('ticket').props.onClick();
assert.ok(text(render()).includes('Talep detayları yükleniyor...')); assert.equal(text(render()).includes('Fixture message'), false);
await row('other').props.onClick();
oldDetail.resolve({ ticket: fixture(), messages: [message('ticket')] }); await pendingOld;
assert.equal(text(render()).includes('Fixture message'), false);
assert.ok(text(render()).includes('Bu talepte henüz mesaj bulunmuyor.'));
const closed = deferred(); detailRead = () => closed.promise;
const pendingClosed = row('ticket').props.onClick();
nodes(render()).find(node => node.props?.children === 'Listeye dön').props.onClick();
closed.resolve({ ticket: fixture(), messages: [message('ticket')] }); await pendingClosed;
assert.equal(text(render()).includes('Fixture message'), false);
assert.ok(text(render()).includes('Görüntülemek için bir talep seçin'));
await mountList(); const changed = deferred(); detailRead = () => changed.promise;
const pendingChanged = row('ticket').props.onClick();
user = { id: 'new-admin', role: 'ADMIN' }; render(); const beforeDetailResult = stateWrites;
changed.resolve({ ticket: fixture(), messages: [message('ticket')] }); await pendingChanged;
assert.equal(stateWrites, beforeDetailResult);
await mountList(); const detached = deferred(); detailRead = () => detached.promise;
const pendingDetached = row('ticket').props.onClick(); cleanup(); const beforeDetached = stateWrites;
detached.resolve({ ticket: fixture(), messages: [message('ticket')] }); await pendingDetached; assert.equal(stateWrites, beforeDetached);
console.log('User support details: reject/malformed/wrong-ticket/wrong-owner/message target rejected, retry/confirmed empty, loading hides old messages, switched/closed/session/unmounted responses ignored.');


await mountList(); await row('ticket').props.onClick();
const oldMemberRow = row('ticket').props.onClick;
user = null; render(); const requestsBeforeLogout = calls + detailCalls;
await oldMemberRow(); assert.equal(calls + detailCalls, requestsBeforeLogout);
console.log('User support reads: actual MEMBER owner validation, list/detail errors and retry, target switching/closing, logout/session/unmount boundaries passed.');
