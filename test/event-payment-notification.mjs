import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor = 0, id = 'event-a', role = 'MEMBER', calls = 0, writes = 0, stateWrites = 0, response, registrationResponse = async () => ({ success: true, ticket_needed: false });
const state = [], dependencies = [], cleanups = [], effects = [], alerts = [];
const fixture = (attendees = [], price = 100) => ({ id, title: 'Fixture Event', price, currency: 'TRY', is_public: true, start_at: '2030-01-01', end_at: '2030-01-02', attendees });
globalThis.eventPaymentHooks = {
  useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { stateWrites++; state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(callback, deps) { const i = cursor++; if (!dependencies[i] || deps.some((value, j) => value !== dependencies[i][j])) { dependencies[i] = deps; effects.push(() => { cleanups[i]?.(); cleanups[i] = callback(); }); } },
};
let user = { id: 'fixture-member', role };
globalThis.eventPaymentAuth = () => ({ user });
globalThis.eventPaymentRouter = { useParams: () => ({ id }), useNavigate: () => () => {} };
globalThis.eventPaymentApi = { getEvent: () => { calls++; return response(); }, registerForEvent: async () => { writes++; return registrationResponse(); } };
globalThis.alert = text => alerts.push(text);
globalThis.window = { confirm: () => true };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/EventDetail.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) => `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.eventPaymentHooks;`);
const priceCode = ts.transpileModule(readFileSync(new URL('../src/utils/eventPrice.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const priceModule = `data:text/javascript;base64,${Buffer.from(priceCode).toString('base64')}`;
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, source) => {
  if (source === 'react/jsx-runtime') return line.replace(source, import.meta.resolve(source));
  if (source === '../utils/eventPrice') return line.replace(source, priceModule);
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
for (const bad of [null, { id: 'other-event' }, { id: 'event-a', attendees: {} },
  { ...fixture(), attendees: [null] }, { ...fixture(), attendees: [{ id: '' }] },
  { ...fixture(), title: null }, { ...fixture(), start_at: 'not-a-date' },
  { ...fixture(), is_public: 'true' }, { ...fixture(), description: {} }, { ...fixture(), location: 1 }]) {
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
const clickRegister = () => nodes(render()).find(node => node.type === 'Button' && node.props?.onClick?.name === 'handleRegister').props.onClick();
async function freeMount() { await mount(); response = async () => fixture([], 0); await notify(); commit(); alerts.length = 0; }
for (const bad of [null, {}, { success: false }, { success: 'true' }]) {
  await freeMount(); registrationResponse = async () => bad;
  await clickRegister();
  assert.equal(registered(), false);
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.deepEqual(alerts, []);
}
await freeMount(); registrationResponse = async () => { throw new Error('Fixture registration rejected'); };
await clickRegister(); assert.equal(registered(), false);
assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
registrationResponse = async () => ({ success: true, ticket_needed: true });
await clickRegister(); assert.equal(registered(), true);
assert.deepEqual(alerts, ['Etkinlik kaydınız doğrulandı.']);
await freeMount(); registrationResponse = async () => ({ success: true, message: 'Already registered' });
await clickRegister(); assert.equal(registered(), true);
await freeMount(); let resolveRegistration;
registrationResponse = () => new Promise(resolve => { resolveRegistration = resolve; });
const beforeDouble = writes, firstSubmit = clickRegister();
await clickRegister(); assert.equal(writes, beforeDouble + 1);
resolveRegistration({ success: true }); await firstSubmit; assert.equal(registered(), true);
for (const change of ['route', 'user', 'role']) {
  await freeMount(); const pending = clickRegister();
  if (change === 'route') id = 'event-b';
  if (change === 'user') user = { id: 'other-member', role: 'MEMBER' };
  if (change === 'role') user = { ...user, role: 'PRESIDENT' };
  response = async () => fixture([], 0); commit(); await flush(); commit();
  const beforeResult = alerts.length;
  resolveRegistration({ success: true }); await pending; commit();
  assert.equal(registered(), false); assert.equal(alerts.length, beforeResult);
}
await freeMount(); const pendingUnmount = clickRegister();
for (const cleanup of cleanups) cleanup?.();
const beforeUnmountedResult = stateWrites;
resolveRegistration({ success: true }); await pendingUnmount;
assert.equal(stateWrites, beforeUnmountedResult);
for (const cleanup of cleanups) cleanup?.();
// Render context changes must hide the old record before effect cleanup runs.
for (const change of ['route', 'user', 'role']) {
  await freeMount();
  const oldTree = nodes(render());
  const oldRegister = oldTree.find(node => node.props?.onClick?.name === 'handleRegister').props.onClick;
  const oldPayment = oldTree.find(node => node.type === 'PaymentModal').props.onSuccess;
  if (change === 'route') id = 'event-b';
  if (change === 'user') user = { id: 'other-member', role: 'MEMBER' };
  if (change === 'role') user = { ...user, role: 'PRESIDENT' };
  const changed = nodes(render());
  assert.ok(changed.some(node => node.props?.role === 'status'));
  assert.equal(changed.some(node => node.type === 'PaymentModal'), false);
  const beforeCalls = calls, beforeWrites = writes;
  await oldRegister(); await oldPayment();
  assert.equal(calls, beforeCalls); assert.equal(writes, beforeWrites);
}
await mount(); let resolveRead;
response = () => new Promise(resolve => { resolveRead = resolve; });
const pendingRead = notify();
user = { id: 'changed-before-cleanup', role: 'MEMBER' }; render();
const beforeLateRead = stateWrites;
resolveRead(fixture([{ id: 'fixture-member' }])); await pendingRead;
assert.equal(stateWrites, beforeLateRead, 'read and payment finally ignored before effect cleanup');
await mount(); response = async () => ({ ...fixture([], 0), attendees: undefined });
await notify(); commit();
assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
const unknownButton = nodes(render()).find(node => node.props?.onClick?.name === 'handleRegister');
assert.equal(unknownButton.props.disabled, true);
const beforeUnknownWrite = writes; await unknownButton.props.onClick(); assert.equal(writes, beforeUnknownWrite);
response = async () => fixture([], 0);
await nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick(); commit();
assert.equal(nodes(render()).find(node => node.props?.onClick?.name === 'handleRegister').props.disabled, false);
const text = tree => Array.isArray(tree) ? tree.map(text).join('') : tree && typeof tree === 'object' ? text(tree.props?.children) : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : '';
for (const badPrice of [undefined, null, '', ' ', true, -1, '-1', 'abc', '1e3', Infinity, NaN]) {
  await mount(); response = async () => ({ ...fixture(), price: badPrice }); await notify(); commit();
  assert.ok(text(render()).includes('Ücret bilgisi doğrulanamadı.'));
  assert.equal(text(render()).includes('Ücretsiz'), false);
  assert.equal(nodes(render()).some(node => node.type === 'PaymentModal'), false);
  const button = nodes(render()).find(node => node.props?.onClick?.name === 'handleRegister');
  assert.equal(button.props.disabled, true);
  const before = writes; await button.props.onClick(); assert.equal(writes, before);
}
for (const badCurrency of [undefined, '', 'try', 'USD']) {
  await mount(); response = async () => ({ ...fixture(), currency: badCurrency }); await notify(); commit();
  assert.equal(nodes(render()).some(node => node.type === 'PaymentModal'), false);
  assert.equal(nodes(render()).find(node => node.props?.onClick?.name === 'handleRegister').props.disabled, true);
  if (badCurrency === 'USD') assert.ok(text(render()).includes('100 USD'), 'source currency displayed without conversion');
}
for (const validPrice of [0, '0.00', 125.5, '125.50']) {
  await mount(); response = async () => ({ ...fixture([], validPrice), max_attendees: 20 }); await notify(); commit();
  assert.ok(text(render()).includes('20 kişi'));
  const modal = nodes(render()).find(node => node.type === 'PaymentModal');
  assert.equal(modal.props.amount, Number(validPrice));
  if (Number(validPrice) > 0) {
    assert.ok(text(render()).includes('125,5 TRY')); assert.equal(text(render()).includes('Ücretsiz'), false);
    const before = writes; await clickRegister();
    assert.equal(writes, before); assert.equal(nodes(render()).find(node => node.type === 'PaymentModal').props.isOpen, true);
  } else assert.ok(text(render()).includes('Ücretsiz'));
}
for (const invalidCapacity of [undefined, null, 0, -1, 1.5, '20']) {
  await mount(); response = async () => ({ ...fixture(), max_attendees: invalidCapacity }); await notify(); commit();
  assert.ok(text(render()).includes('KontenjanBilinmiyor')); assert.equal(text(render()).includes('Sınırlı Sayıda'), false);
}
for (const cleanup of cleanups) cleanup?.();
console.log('Event payment notification: three roles, no second registration write, fresh attendees only, read error/retry, malformed/wrong-id response, stale route read ignored; explicit free registration preserved. No payment/network/mail calls.');
console.log('FREE event registration: explicit success true including repeat, malformed/rejected result never registered; no email claim, duplicate submit one call, old route/user/role and unmounted results ignored.');
console.log('Detail reads: malformed row/text/date rejected; old route/user/role hidden before cleanup and old callbacks inert; late read ignored; unknown attendance blocks repeat until confirmed retry.');
console.log('Detail price/capacity: unknown never free or zero modal; paid TRY numeric/decimal strings open exact amount without free write; unsupported currency blocked, valid capacity displayed.');
