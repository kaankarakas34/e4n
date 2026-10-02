import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor = 0, id = 'event-a', role = 'MEMBER', calls = 0, writes = 0, response;
const state = [], dependencies = [], cleanups = [], effects = [], alerts = [];
const fixture = (attendees = [], price = 100) => ({ id, title: 'Fixture Event', price, is_public: true, start_at: '2030-01-01', end_at: '2030-01-02', attendees });
globalThis.eventPaymentHooks = {
  useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(callback, deps) { const i = cursor++; if (!dependencies[i] || deps.some((value, j) => value !== dependencies[i][j])) { dependencies[i] = deps; effects.push(() => { cleanups[i]?.(); cleanups[i] = callback(); }); } },
};
let user = { id: 'fixture-member', role };
globalThis.eventPaymentAuth = () => ({ user });
globalThis.eventPaymentRouter = { useParams: () => ({ id }), useNavigate: () => () => {} };
globalThis.eventPaymentApi = { getEvent: () => { calls++; return response(); }, registerForEvent: async () => { writes++; return { ticket_needed: false }; } };
globalThis.alert = text => alerts.push(text);
globalThis.window = { confirm: () => true };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/EventDetail.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) => `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.eventPaymentHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, source) => {
  if (source === 'react/jsx-runtime') return line.replace(source, import.meta.resolve(source));
  if (source === '../api/api') return 'const api = globalThis.eventPaymentApi;';
  if (source === '../stores/authStore') return 'const useAuthStore = globalThis.eventPaymentAuth;';
  if (source === 'react-router-dom') return 'const { useParams, useNavigate } = globalThis.eventPaymentRouter;';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { EventDetail } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return EventDetail(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const commit = () => { render(); while (effects.length) effects.shift()(); };
const flush = () => new Promise(resolve => setImmediate(resolve));
const registered = () => nodes(render()).some(node => node.type === 'CheckCircle');
const notify = () => nodes(render()).find(node => node.type === 'PaymentModal').props.onSuccess();
async function mount(nextRole = 'MEMBER') {
  for (const cleanup of cleanups) cleanup?.();
  state.length = dependencies.length = cleanups.length = effects.length = alerts.length = 0;
  id = 'event-a'; role = nextRole; user = { id: 'fixture-member', role };
  response = async () => fixture(); commit(); await flush(); commit();
}
for (const nextRole of ['MEMBER', 'PRESIDENT', 'ADMIN']) {
  await mount(nextRole);
  const beforeWrites = writes, beforeReads = calls;
  await notify(); commit();
  assert.equal(writes, beforeWrites);
  assert.equal(calls, beforeReads + 1);
  assert.equal(registered(), false);
  assert.deepEqual(alerts, ['Ödeme bildirimi alındı. Güncel etkinlik kaydınızı kontrol edin.']);
  response = async () => fixture([{ id: user.id }]);
  await notify(); commit(); assert.equal(registered(), true);
  response = async () => { throw new Error('Fixture unavailable'); };
  await notify(); commit();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.equal(registered(), false);
  response = async () => fixture();
  await nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick(); commit();
  assert.equal(registered(), false);
}
for (const bad of [null, { id: 'other-event' }, { id: 'event-a', attendees: {} }]) {
  await mount(); response = async () => bad; await notify(); commit();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
}
await mount(); let resolveOld;
response = () => new Promise(resolve => { resolveOld = resolve; });
const old = notify(); commit();
id = 'event-b'; response = async () => fixture(); commit(); await flush(); commit();
resolveOld({ ...fixture([{ id: user.id }]), id: 'event-a' }); await old; commit();
assert.equal(registered(), false);
assert.equal(nodes(render()).find(node => node.type === 'PaymentModal').props.action.data.event_id, 'event-b');
// Free registration remains an explicit user action, not a payment notification.
await mount(); response = async () => fixture([], 0); await notify(); commit();
const beforeFree = writes;
await nodes(render()).find(node => node.type === 'Button' && node.props?.onClick?.name === 'handleRegister').props.onClick();
assert.equal(writes, beforeFree + 1);
for (const cleanup of cleanups) cleanup?.();
console.log('Event payment notification: three roles, no second registration write, fresh attendees only, read error/retry, malformed/wrong-id response, stale route read ignored; explicit free registration preserved. No payment/network/mail calls.');
