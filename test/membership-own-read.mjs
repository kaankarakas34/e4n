import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

let user = { id: 'member-a', role: 'MEMBER' }, cursor = 0, pendingEffect, cleanup, calls = 0;
const state = [], deps = [];
let response = async () => { throw new Error('Fixture unavailable'); };
globalThis.ownMembershipHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in state)) state[i] = initial;
    return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value; }];
  },
  useEffect(callback, next) {
    const i = cursor++;
    if (!deps[i] || next.some((value, j) => value !== deps[i][j])) {
      pendingEffect = callback;
      deps[i] = next;
    }
  },
};
globalThis.ownMembershipAuth = () => ({ user });
// A persisted ADMIN collection must never be used for the displayed member record.
globalThis.ownMembershipStore = () => ({ items: [{ user_id: 'member-a', plan: 'CACHE_ONLY_PLAN', status: 'ACTIVE', end_date: '2099-01-01' }] });
globalThis.ownMembershipApi = { getMe: () => { calls++; return response(); } };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/Membership.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.ownMembershipHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, source) => {
  if (source === 'react/jsx-runtime') return line.replace(source, import.meta.resolve(source));
  if (source === '../stores/authStore') return 'const useAuthStore = globalThis.ownMembershipAuth;';
  if (source === '../stores/membershipStore') return 'const useMembershipStore = globalThis.ownMembershipStore;';
  if (source === '../api/api') return 'const api = globalThis.ownMembershipApi;';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { MembershipPage } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return MembershipPage(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const hasText = text => nodes(render()).some(node => {
  const children = node.props?.children;
  return (Array.isArray(children) ? children.flat(Infinity) : [children]).some(value => typeof value === 'string' && value.trim() === text);
});
const flush = () => new Promise(resolve => setImmediate(resolve));
const commitEffect = () => { if (pendingEffect) { cleanup?.(); const effect = pendingEffect; pendingEffect = undefined; cleanup = effect(); } };
const retry = async () => {
  nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick();
  render(); commitEffect(); await flush();
};

render();
assert.ok(nodes(render()).some(node => node.props?.role === 'status'));
assert.equal(hasText('CACHE ONLY_PLAN'), false);
assert.equal(hasText('Kayıtlı Üyelik Bilgileri'), false);
commitEffect(); await flush();
assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
for (const bad of [null, {}, { id: 'other-member', subscription_plan: 'OTHER_PLAN' }, { id: user.id, subscription_plan: 123 }, { id: user.id, subscription_end_date: {} }]) {
  response = async () => bad;
  await retry();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.equal(hasText('Kayıtlı Üyelik Bilgileri'), false);
}
response = async () => ({ id: user.id, subscription_plan: '4_MONTHS', subscription_end_date: '2030-04-01', account_status: 'ACTIVE' });
await retry();
assert.ok(hasText('Kayıtlı Üyelik Bilgileri'));
assert.ok(hasText('4 Aylık Paket'));
assert.equal(hasText('Aktif'), false); // Account status is not a confirmed subscription entitlement.
assert.ok(hasText('Veri yok'));
const alerts = [];
globalThis.alert = text => alerts.push(text);
const select = nodes(render()).find(node => node.type === 'Button' && node.props?.onClick?.toString().includes('handleSelectPlan'));
await select.props.onClick();
const modal = nodes(render()).find(node => node.type === 'PaymentModal');
assert.equal(modal.props.action.type, 'membership');
assert.equal(modal.props.action.data.user_id, user.id);
modal.props.onSuccess({ finalAmount: 0, invoiceId: 'fixture-notification' });
assert.equal(hasText('Kayıtlı Üyelik Bilgileri'), false);
assert.deepEqual(alerts, ['Ödeme bildirimi alındı. Güncel üyelik bilgilerinizi kontrol edin.']);
response = async () => { throw new Error('Fixture refresh failure after notification'); };
render(); commitEffect(); await flush();
assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
assert.equal(hasText('Kayıtlı Üyelik Bilgileri'), false);
response = async () => ({ id: user.id, subscription_plan: '1_MONTH', subscription_end_date: '2031-01-01' });
await retry();
assert.ok(hasText('Kayıtlı Üyelik Bilgileri'));
user = { id: 'member-b', role: 'PRESIDENT' };
assert.equal(hasText('Kayıtlı Üyelik Bilgileri'), false); // Hide A before B's effect runs.
let resolveOld;
response = () => new Promise(resolve => { resolveOld = resolve; });
commitEffect();
user = { id: 'member-c', role: 'ADMIN' };
response = async () => ({ id: 'member-c', subscription_plan: null, subscription_end_date: 'invalid' });
render(); commitEffect(); await flush();
resolveOld({ id: 'member-b', subscription_plan: 'STALE_PLAN', subscription_end_date: '2099-01-01' });
await flush();
assert.ok(hasText('Kayıtlı Üyelik Bilgileri'));
assert.equal(hasText('STALE PLAN'), false);
assert.ok(hasText('Veri yok'));
assert.equal(hasText('Invalid Date'), false);
const beforeLogout = calls;
user = null; render(); commitEffect(); await flush();
assert.equal(calls, beforeLogout);
assert.ok(hasText('Lütfen giriş yapın.'));
cleanup?.();
console.log('Own membership read: loading/error/retry, malformed/foreign profile, fresh plan/date, unknown status, null/invalid date, auth switch and stale response isolation; no admin list/payment/network calls.');
