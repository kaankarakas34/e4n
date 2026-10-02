import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = process.argv[2];
if (!source) throw new Error('Pass mobile app/admin/subscriptions.tsx path');
const states = [];
let cursor = 0, effect, response = async () => { throw new Error('Fixture 403'); };
globalThis.paymentHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = value; }];
  },
  useEffect(callback) { effect ??= callback; },
};
globalThis.paymentApi = { get: async path => { assert.equal(path, '/payments/history'); return response(); } };
let compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.paymentHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '@/utils/api-client') return 'const apiClient = globalThis.paymentApi;';
  return names.split(',').map(item => {
    const name = item.trim();
    if (name === 'StyleSheet') return 'const StyleSheet = { create: value => value };';
    if (name === 'useRouter') return 'const useRouter = () => ({ back() {} });';
    return `const ${name} = '${name}';`;
  }).join('\n');
});
const { default: Screen } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return Screen(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const find = text => nodes(render()).find(node => node.props?.children === text);
const flush = () => new Promise(resolve => setImmediate(resolve));
render(); effect(); await flush();
assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
assert.ok(!find('Henüz ödeme kaydı bulunmuyor.'));
response = async () => [
  { id: 'linked', amount: 0, status: 'SUCCESS', created_at: '2026-02-03T10:00:00Z', member: { full_name: 'Fixture User' } },
  { id: 'unlinked', amount: null, status: 'PENDING', created_at: null, member: null },
];
nodes(render()).find(node => node.props?.accessibilityRole === 'button').props.onPress();
await flush();
assert.ok(find('₺0'));
assert.ok(find('Fixture User'));
assert.ok(find('Tutar bilgisi yok'));
assert.ok(find('Tarih bilgisi yok'));
assert.ok(find('Kullanıcı bağlantısı yok'));
assert.equal(find('PENDING').props.style.at(-1).color, '#64748b');
response = async () => [{ id: 'failed', amount: 125, status: 'FAILED', created_at: 'invalid' }];
effect(); await flush();
assert.ok(find('₺125'));
assert.equal(find('FAILED').props.style.at(-1).color, '#dc2626');
assert.ok(find('Tarih bilgisi yok'));
response = async () => { throw new Error('Fixture 503'); };
effect(); await flush();
assert.ok(!find('₺125'));
assert.ok(!find('Henüz ödeme kaydı bulunmuyor.'));
for (const malformed of [null, {}, [null], [{ amount: 125 }]]) {
  response = async () => malformed;
  effect(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
}
response = async () => [];
effect(); await flush();
assert.ok(find('Henüz ödeme kaydı bulunmuyor.'));
console.log('Mobile payment history: error/retry, real zero, missing amount/date/owner, neutral pending, failed status, stale hiding and true empty verified.');
