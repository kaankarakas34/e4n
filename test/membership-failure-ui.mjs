import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const states = [];
let cursor = 0, effect, fail = true, readFail = false, fetchCalls = 0, writeCalls = 0, role = 'ADMIN';
const fixture = { id: 'fixture', user_id: 'fixture', name: 'Fixture User', plan: '1_MONTH', status: 'ACTIVE', end_date: '2099-01-01T00:00:00Z' };
const membership = { items: [fixture], error: null, fetchAll: async () => { fetchCalls++; membership.error = readFail ? 'Fixture read failure' : null; },
  create: async () => { writeCalls++; if (fail) throw new Error('Fixture create failure'); },
  renew: async () => { writeCalls++; if (fail) throw new Error('Fixture renew failure'); },
  expire: async () => { writeCalls++; if (fail) throw new Error('Fixture expire failure'); },
};
globalThis.failureMembership = Object.assign(() => membership, { getState: () => membership });
globalThis.failureAuth = () => ({ user: { id: 'fixture', role } });
globalThis.failureHooks = {
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
  useEffect(callback) { effect ??= callback; },
};
const alerts = [];
globalThis.alert = text => alerts.push(text);
async function load(path, exportName) {
  let compiled = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
    `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.failureHooks;`);
  compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
    if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
    if (module === 'react') return `const {${names}} = globalThis.failureHooks;`;
    if (module === '../stores/authStore') return 'const useAuthStore = globalThis.failureAuth;';
    if (module === '../stores/membershipStore') return 'const useMembershipStore = globalThis.failureMembership;';
    if (module === '../api/api') return 'const api = { getUserById: async () => ({ id: "fixture", name: "Fixture User", role: "MEMBER" }) };';
    if (module === 'react-router-dom') return 'const useParams = () => ({ id: "fixture" });';
    return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
  });
  return (await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`))[exportName];
}
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const flush = () => new Promise(resolve => setImmediate(resolve));
const MembershipPage = await load('../src/pages/Membership.tsx', 'MembershipPage');
const renderPayment = () => { cursor = 0; return MembershipPage(); };
const originalError = console.error;
console.error = () => {};
try {
  for (const scenario of ['ADMIN', 'MEMBER', 'PRESIDENT'].flatMap(role => [[fixture], []].map(items => ({ role, items })))) {
    const { items } = scenario;
    role = scenario.role;
    states.length = 0; membership.items = items; alerts.length = 0;
    const planButton = nodes(renderPayment()).find(node => node.type === 'Button' && node.props?.onClick?.toString().includes('handleSelectPlan'));
    assert.ok(planButton);
    await planButton.props.onClick();
    const modal = nodes(renderPayment()).find(node => node.type === 'PaymentModal');
    assert.ok(modal);
    const beforeWrites = writeCalls, beforeFetch = fetchCalls;
    await modal.props.onSuccess({ finalAmount: 125 });
    assert.equal(writeCalls, beforeWrites);
    assert.equal(fetchCalls, beforeFetch);
    assert.deepEqual(alerts, ['Ödeme bildirimi alındı. Güncel üyelik bilgilerinizi kontrol edin.']);
    assert.equal(nodes(renderPayment()).some(node => node.type === 'PaymentModal'), false);
  }
  role = 'ADMIN';
  const MemberProfile = await load('../src/pages/MemberProfile.tsx', 'MemberProfile');
  const renderProfile = () => { cursor = 0; return MemberProfile(); };
  for (const items of [[fixture], []]) {
    states.length = 0; effect = undefined; membership.items = items; alerts.length = 0;
    renderProfile(); effect(); await flush();
    const open = nodes(renderProfile()).find(node => node.type === 'Button' && node.props?.onClick?.toString().includes('setShowSubscriptionModal'));
    assert.ok(open);
    open.props.onClick();
    const confirm = nodes(renderProfile()).find(node => node.props?.children === 'Onayla ve Başlat');
    assert.ok(confirm);
    await confirm.props.onClick(); await flush();
    assert.deepEqual(alerts, ['Hata oluştu.']);
  }
  states.length = 0; effect = undefined; membership.items = [fixture]; alerts.length = 0;
  renderProfile(); effect(); await flush();
  await nodes(renderProfile()).find(node => node.props?.children === 'İptal Et').props.onClick();
  assert.deepEqual(alerts, ['Abonelik iptal edilemedi.']);
  // A failed refresh must not make a persisted subscription look verified or empty.
  states.length = 0; effect = undefined; membership.items = [fixture]; readFail = true;
  assert.equal(nodes(renderProfile()).some(node => node.props?.children === 'İptal Et'), false);
  effect(); await flush();
  let profileNodes = nodes(renderProfile());
  assert.ok(profileNodes.some(node => node.props?.role === 'alert'));
  assert.equal(profileNodes.some(node => node.props?.children === 'İptal Et'), false);
  assert.equal(profileNodes.some(node => node.props?.children === 'Aktif abonelik yok'), false);
  readFail = false;
  await profileNodes.find(node => node.props?.children === 'Tekrar dene').props.onClick();
  assert.ok(nodes(renderProfile()).some(node => node.props?.children === 'İptal Et'));
  // Non-admin profiles neither request the admin collection nor expose cached controls.
  for (role of ['MEMBER', 'PRESIDENT']) {
    states.length = 0; effect = undefined; membership.items = [fixture];
    const before = fetchCalls;
    renderProfile(); effect(); await flush();
    profileNodes = nodes(renderProfile());
    assert.equal(fetchCalls, before);
    assert.ok(profileNodes.some(node => node.props?.children === 'Abonelik yönetimi için yönetici yetkisi gerekiyor.'));
    assert.equal(profileNodes.some(node => node.props?.children === 'İptal Et'), false);
    assert.equal(profileNodes.some(node => node.type === 'Button' && node.props?.onClick?.toString().includes('setShowSubscriptionModal')), false);
  }
  role = 'ADMIN'; states.length = 0; effect = undefined; membership.items = [];
  renderProfile(); effect(); await flush();
  assert.ok(nodes(renderProfile()).some(node => node.type === 'Button' && node.props?.onClick?.toString().includes('setShowSubscriptionModal')));
  console.log('Membership UI: payment notification never writes membership or fetches admin collection, cache present/absent; profile write failures remain caught. No provider/mail/network calls.');
  console.log('Profile subscription read: failed refresh hides cached controls; retry restores them; MEMBER/PRESIDENT skip admin collection; successful empty response permits admin creation.');
} finally { console.error = originalError; }
