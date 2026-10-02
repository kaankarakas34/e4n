import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const states = [];
let cursor = 0, effect, fail = true;
const fixture = { id: 'fixture', name: 'Fixture Member', email: 'fixture@example.invalid', plan: '1_MONTH', status: 'ACTIVE', end_date: '2099-01-01T00:00:00Z' };
const membership = { items: [fixture], loading: false, error: null, fetchAll: async () => {
  membership.loading = true; membership.error = null;
  await Promise.resolve();
  membership.error = fail ? 'Fixture unavailable' : null;
  membership.loading = false;
} };
globalThis.subscriptionMembership = membership;
globalThis.subscriptionHooks = {
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
  useEffect(callback) { effect ??= callback; },
};
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/AdminSubscriptions.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === 'react') return `const {${names}} = globalThis.subscriptionHooks;`;
  if (module === '../stores/authStore') return 'const useAuthStore = () => ({ user: { role: "ADMIN" } });';
  if (module === '../stores/membershipStore') return 'const useMembershipStore = () => globalThis.subscriptionMembership;';
  if (module === '../api/api') return 'const api = {};';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { AdminSubscriptions } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return AdminSubscriptions(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const has = text => nodes(render()).some(node => node.props?.children === text);
const flush = () => new Promise(resolve => setImmediate(resolve));
assert.ok(nodes(render()).some(node => node.props?.role === 'status'));
assert.ok(!has('Fixture Member'));
effect(); await flush();
assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
assert.ok(!has('Toplam Üye'));
fail = false;
nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick();
assert.ok(nodes(render()).some(node => node.props?.role === 'status'));
await flush();
assert.ok(has('Veri yok'));
assert.ok(!has('₺7200'));
assert.ok(has('Fixture Member'));
membership.items = [];
assert.ok(has('Veri yok'));
assert.ok(has('Toplam Üye'));
fail = true; effect(); await flush();
assert.ok(!has('Toplam Üye'));
assert.ok(!has('Veri yok'));
console.log('Subscriptions: cached/failed/loading data hidden; retry shows real list; MRR unavailable with rows or empty list.');
