import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

let cursor = 0, props, response, calls = 0, opens = 0, successes = 0, popup;
const state = [], dependencies = [], cleanups = [], effects = [], listeners = new Set(), timers = new Map();
globalThis.paymentHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in state)) state[i] = initial;
    return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
  },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(callback, deps) {
    const i = cursor++;
    if (!dependencies[i] || deps.some((value, j) => value !== dependencies[i][j])) {
      dependencies[i] = deps;
      effects.push(() => { cleanups[i]?.(); cleanups[i] = callback(); });
    }
  },
};
globalThis.paymentApi = {
  payWithSipay: () => { calls++; return response(); },
  updateMe: () => { throw new Error('Unexpected profile write'); },
};
globalThis.paymentAuth = () => ({ user: null, updateUser: () => {} });
globalThis.window = {
  open: () => { opens++; return popup; },
  addEventListener: (type, callback) => { assert.equal(type, 'message'); listeners.add(callback); },
  removeEventListener: (type, callback) => listeners.delete(callback),
  setInterval: callback => { const id = Symbol(); timers.set(id, callback); return id; },
  clearInterval: id => timers.delete(id),
};
let compiled = ts.transpileModule(readFileSync(new URL('../src/components/PaymentModal.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.paymentHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, source) => {
  if (source === 'react/jsx-runtime') return line.replace(source, import.meta.resolve(source));
  if (source === '../api/api') return 'const api = globalThis.paymentApi;';
  if (source === '../stores/authStore') return 'const useAuthStore = globalThis.paymentAuth;';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { PaymentModal } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return PaymentModal(props); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const commit = () => { render(); while (effects.length) effects.shift()(); };
const flush = () => new Promise(resolve => setImmediate(resolve));
const hasText = text => nodes(render()).some(node => node.props?.children === text);
const submit = () => nodes(render()).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
const emit = (status, source = popup) => { for (const callback of [...listeners]) callback({ source, data: { status, invoice_id: 'fixture-invoice' } }); };
const idle = () => assert.equal(nodes(render()).find(node => node.type === 'Modal').props.onClose, props.onClose);
const clean = () => { assert.equal(listeners.size, 0); assert.equal(timers.size, 0); };
const unmount = () => { for (const cleanup of cleanups) cleanup?.(); cleanups.length = 0; clean(); };
async function setup(onSuccess = async () => { successes++; }) {
  unmount(); state.length = 0; dependencies.length = 0; effects.length = 0;
  popup = { closed: false, document: { write() {}, close() {} } };
  response = async () => ({ success: true, is3D: true, html: '<p>Fixture</p>' });
  props = { isOpen: true, onClose() {}, onSuccess, amount: 100, planTitle: 'Fixture', action: { type: 'membership', data: {} },
    initialBillingData: { company: 'Fixture', tax_number: 'Fixture', tax_office: 'Fixture', billing_address: 'Fixture' } };
  commit(); await submit(); // Billing step, no logged-in profile write.
  for (const [name, value] of Object.entries({ cardName: 'Fixture', cardNumber: '1111111111111111', expiryDate: '1230', cvv: '111' })) {
    nodes(render()).find(node => node.props?.name === name).props.onChange({ target: { name, value } });
  }
}

await setup(); await submit();
assert.equal(listeners.size, 1); assert.equal(timers.size, 1);
const before = successes;
emit('success', {}); assert.equal(successes, before); assert.equal(listeners.size, 1);
emit('success'); emit('success'); await flush(); clean(); idle();
assert.equal(successes, before + 1);

await setup(); await submit(); emit('fail'); clean(); idle();
assert.ok(hasText('Ödeme banka tarafından reddedildi.'));

await setup(); await submit(); popup.closed = true;
for (const tick of [...timers.values()]) tick();
clean(); idle();
assert.ok(hasText('Doğrulama penceresi kapandı. Ödeme sonucu doğrulanamadı; tekrar ödeme yapmadan işlem durumunu kontrol edin.'));

await setup(); popup = null; await submit(); clean(); idle();
assert.ok(hasText('3D Secure doğrulama penceresi engellendi. Lütfen tarayıcınızın popup engelleyicisini kaldırıp tekrar deneyin.'));

await setup(); popup.document.write = () => { throw new Error('Fixture popup write failure'); };
const savedError = console.error; console.error = () => {};
try { await submit(); } finally { console.error = savedError; }
clean(); idle(); assert.ok(hasText('Fixture popup write failure'));

await setup(); await submit(); props = { ...props, isOpen: false }; commit(); clean();
props = { ...props, isOpen: true }; commit(); idle();

await setup(); await submit(); unmount(); emit('success');

await setup(); let resolvePay;
response = () => new Promise(resolve => { resolvePay = resolve; });
const beforeCalls = calls, beforeOpens = opens;
const first = submit(); await submit(); assert.equal(calls, beforeCalls + 1);
props = { ...props, isOpen: false }; commit();
resolvePay({ success: true, is3D: true, html: '<p>Stale</p>' }); await first;
assert.equal(opens, beforeOpens); clean();

for (const is3D of [false, true]) {
  await setup(async () => { throw new Error('Fixture consumer failure'); });
  response = async () => ({ success: true, is3D, html: '<p>Fixture</p>' });
  await submit(); if (is3D) emit('success'); await flush();
  clean(); idle();
  assert.ok(hasText('Ödeme bildirimi işlenemedi. Tekrar ödeme yapmadan işlem durumunu kontrol edin.'));
}
unmount();
console.log('Payment modal: one pending submit, popup blocked/closed/fail/success, source separation, close/reopen/unmount cleanup, stale API response ignored, async consumer rejection caught. Controlled hooks/window/API only; no payment/network calls.');
