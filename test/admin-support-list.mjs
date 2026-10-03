import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor = 0, slots = [], effects = new Map(), user, read, calls = 0, stateWrites = 0, detailCalls = 0;
globalThis.supportListHooks = {
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { stateWrites++; slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
  useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  useEffect(fn, dependencies) { const i = cursor++; const old = effects.get(i); if (!old || dependencies.some((value, j) => value !== old.dependencies[j])) effects.set(i, { fn, dependencies, pending: true, cleanup: old?.cleanup }); },
};
globalThis.supportListAuth = () => ({ user });
globalThis.supportListAPI = { getTickets: () => { calls++; return read(); }, getTicketDetails: async () => { detailCalls++; return { ticket: fixture(), messages: [] }; } };
let code = ts.transpileModule(readFileSync(new URL('../src/pages/AdminSupportTickets.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
code = code.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === 'react') return `const {${names}} = globalThis.supportListHooks;`;
  if (module === '../stores/authStore') return 'const useAuthStore = globalThis.supportListAuth;';
  if (module === '../api/api') return 'const api = globalThis.supportListAPI;';
  if (module === 'react-router-dom') return 'const useNavigate = () => () => {};';
  if (module === '../utils/dateUtils') return 'const formatDate = value => value;';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { AdminSupportTickets } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const fixture = () => ({ id: 'ticket', subject: 'Fixture ticket', user_id: 'member', user_name: 'Fixture member', user_email: 'fixture@example.invalid', status: 'OPEN', created_at: '2026-10-03T10:00:00Z', updated_at: '2026-10-03T10:00:00Z' });
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const text = tree => Array.isArray(tree) ? tree.map(text).join('') : tree && typeof tree === 'object' ? text(tree.props?.children) : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : '';
const render = () => { cursor = 0; return AdminSupportTickets(); };
const settle = () => new Promise(resolve => setImmediate(resolve));
const flush = async () => { for (const effect of effects.values()) if (effect.pending) { effect.cleanup?.(); effect.cleanup = effect.fn(); effect.pending = false; } await settle(); };
const cleanup = () => { for (const effect of effects.values()) effect.cleanup?.(); };
const reset = () => { cleanup(); slots = []; effects = new Map(); user = { id: 'admin', role: 'ADMIN' }; read = async () => []; };
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const count = () => nodes(render()).find(node => node.type === 'span' && node.props?.className?.startsWith('bg-gray-200')).props.children;

reset(); assert.ok(nodes(render()).some(node => node.props?.role === 'status')); await flush();
assert.equal(count(), 0); assert.ok(text(render()).includes('Talep bulunamadı.'));
for (const invalid of ['reject', null, {}, [null], [{ ...fixture(), id: '' }], [{ ...fixture(), subject: {} }], [{ ...fixture(), updated_at: 'invalid' }]]) {
  reset(); read = async () => { if (invalid === 'reject') throw new Error('fixture failure'); return invalid; };
  render(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.equal(count(), 'Bilinmiyor'); assert.equal(text(render()).includes('Talep bulunamadı.'), false);
  read = async () => [fixture()];
  await nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick();
  assert.equal(count(), 1); assert.ok(text(render()).includes('Fixture ticket'));
}
reset(); read = async () => [fixture()]; render(); await flush();
const oldRow = nodes(render()).find(node => node.props?.onClick?.toString().includes('loadTicketDetails(ticket.id)')).props.onClick;
user = { id: 'another-admin', role: 'ADMIN' };
assert.ok(nodes(render()).some(node => node.props?.role === 'status')); assert.equal(text(render()).includes('Fixture ticket'), false);
const beforeDetails = detailCalls; await oldRow(); assert.equal(detailCalls, beforeDetails, 'old-context detail click cannot request');
const late = deferred(); read = () => late.promise; await flush();
user = { id: 'member', role: 'MEMBER' }; render(); const beforeLate = stateWrites;
late.resolve([fixture()]); await settle(); assert.equal(stateWrites, beforeLate, 'late list ignored before effect cleanup');
const beforeRestricted = calls; await flush(); assert.equal(calls, beforeRestricted); assert.ok(text(render()).includes('Erişim reddedildi.'));
reset(); const unmounted = deferred(); read = () => unmounted.promise; render(); await flush(); cleanup();
const beforeUnmount = stateWrites; unmounted.resolve([fixture()]); await settle(); assert.equal(stateWrites, beforeUnmount);
console.log('Real admin support list: initial loading, confirmed empty/count, network/malformed errors and retry, old-admin view/callback, role-change and unmount response boundaries passed.');
