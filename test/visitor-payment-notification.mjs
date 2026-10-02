import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor = 0, effect, writes = 0, lastPayload, cleanup, lastDeps, verifyResponse = async () => ({ valid: true, inviter_name: 'Fixture', email: data.email });
const state = [];
const data = { name: 'Fixture Visitor', email: 'fixture@example.invalid', phone: '1111111111', company: 'Fixture', profession: 'Fixture', taxOffice: 'Fixture', taxNumber: '1111111111', address: 'Fixture address', kvkk: true };
globalThis.visitorPaymentHooks = {
  useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }]; },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(callback, deps) { if (!lastDeps || deps.some((value, i) => value !== lastDeps[i])) { lastDeps = deps; effect = callback; } },
};
globalThis.visitorPaymentForm = () => ({ register: () => ({}), handleSubmit: callback => () => callback(data), setValue() {}, formState: { errors: {} } });
globalThis.visitorPaymentApi = {
  submitPublicVisitorApplication: async payload => { writes++; lastPayload = payload; return { id: 'fixture-visitor' }; },
  verifyVisitorInvite: token => verifyResponse(token),
};
globalThis.window = { location: { search: '' } };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/VisitorPaymentPage.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) => `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.visitorPaymentHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, source) => {
  if (['react/jsx-runtime', 'zod', '@hookform/resolvers/zod'].includes(source)) return line.replace(source, import.meta.resolve(source));
  if (source === '../api/api') return 'const api = globalThis.visitorPaymentApi;';
  if (source === 'react-hook-form') return 'const useForm = globalThis.visitorPaymentForm;';
  if (source === 'react-router-dom') return 'const useNavigate = () => () => {}; const useLocation = () => ({ search: window.location.search });';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { VisitorPaymentPage } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return VisitorPaymentPage(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const hasText = text => nodes(render()).some(node => node.props?.children === text);
const submit = () => nodes(render()).find(node => node.type === 'form').props.onSubmit();
const commit = () => { render(); if (effect) { cleanup?.(); const callback = effect; effect = undefined; cleanup = callback(); } };
commit();
await submit();
const modal = nodes(render()).find(node => node.type === 'PaymentModal');
assert.ok(modal); assert.equal(modal.props.action.type, 'visitor_registration');
assert.equal(modal.props.action.data.email, data.email);
const before = writes;
await modal.props.onSuccess({ finalAmount: 1000, invoiceId: 'fixture' });
assert.equal(writes, before);
assert.equal(nodes(render()).some(node => node.type === 'PaymentModal'), false);
assert.ok(hasText('Ödeme bildirimi alındı'));
assert.equal(hasText('Başvurunuz Alındı!'), false);
assert.ok(nodes(render()).some(node => node.props?.role === 'status'));
// A verified invitation still follows the existing explicit free submission path.
cleanup?.(); state.length = 0; effect = undefined; lastDeps = undefined; window.location.search = '?token=fixture';
commit(); await new Promise(resolve => setImmediate(resolve));
await submit();
assert.equal(writes, before + 1);
assert.equal(lastPayload.source, 'visitor_invite');
assert.equal(lastPayload.form_data.payment_status, 'FREE');
assert.equal(lastPayload.form_data.payment_amount, 0);
assert.ok(hasText('Başvurunuz Alındı!'));
// Transport/malformed results never turn an invitation into a payment obligation.
const flush = () => new Promise(resolve => setImmediate(resolve));
function reset(search = '?token=fixture') {
  cleanup?.(); state.length = 0; effect = undefined; lastDeps = undefined; cleanup = undefined;
  window.location.search = search;
}
for (const failure of [async () => { throw new Error('Fixture unavailable'); }, async () => null, async () => ({ valid: 'true' }), async () => ({ valid: true }), async () => ({ valid: false, error: {} }), async () => ({ valid: true, email: data.email, inviter_name: {} })]) {
  reset(); verifyResponse = failure;
  render(); await submit();
  assert.equal(nodes(render()).some(node => node.type === 'PaymentModal'), false);
  commit(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.equal(nodes(render()).find(node => node.type === 'Button' && node.props?.type === 'submit').props.disabled, true);
  await submit(); assert.equal(nodes(render()).some(node => node.type === 'PaymentModal'), false);
  verifyResponse = async () => ({ valid: true, email: data.email });
  await nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick();
  assert.equal(nodes(render()).find(node => node.type === 'Button' && node.props?.type === 'submit').props.disabled, false);
}
reset(); verifyResponse = async () => ({ valid: false, error: 'Fixture invalid' }); commit(); await flush();
await submit(); assert.ok(nodes(render()).some(node => node.type === 'PaymentModal'));
reset('?token=old'); let resolveOld;
verifyResponse = () => new Promise(resolve => { resolveOld = resolve; }); commit();
window.location.search = '?token=new'; verifyResponse = async () => ({ valid: false }); commit(); await flush();
resolveOld({ valid: true, email: 'old@example.invalid' }); await flush();
await submit(); assert.ok(nodes(render()).some(node => node.type === 'PaymentModal'));
cleanup?.();
console.log('Visitor payment notification: no second PAID application; neutral unverified notice, modal closed; explicit verified-invitation FREE submission preserved. Controlled hooks/form/API; no payment/network/mail calls.');
console.log('Visitor invite: pending/failure/malformed blocks submit; successful retry, explicit valid=false, route token change and late response isolation.');
