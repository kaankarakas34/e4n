import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = process.argv[2];
if (!source) throw new Error('Pass mobile app/admin/reports.tsx path');
const states = [];
let cursor = 0, effect, response = async () => { throw new Error('Fixture 503'); };
globalThis.mobileReportHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = value; }];
  },
  useEffect(callback) { effect ??= callback; },
};
globalThis.mobileReportApi = { get: async path => {
  assert.equal(path, '/reports/stats');
  return response();
} };
let compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.mobileReportHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '@/utils/api-client') return 'const apiClient = globalThis.mobileReportApi;';
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
const metrics = () => nodes(render()).filter(node => node.type === 'Text' && node.props?.style?.fontSize === 20).map(node => node.props.children);
const flush = () => new Promise(resolve => setImmediate(resolve));
render();
assert.ok(nodes(render()).some(node => node.type === 'ActivityIndicator'));
effect(); await flush();
assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
assert.deepEqual(metrics(), []);
response = async () => ({ totalMembers: 0, totalRevenue: 0, totalEvents: 0, totalOneToOnes: 0 });
nodes(render()).find(node => node.props?.accessibilityRole === 'button').props.onPress();
await flush();
assert.deepEqual(metrics(), [0, '₺0', 0, 0]);
response = async () => ({ totalMembers: 4, totalRevenue: null, totalEvents: 2, totalOneToOnes: 3 });
effect(); await flush();
assert.deepEqual(metrics(), [4, 'Veri yok', 2, 3]);
response = async () => ({ totalMembers: null, totalRevenue: '125', totalEvents: -1, totalOneToOnes: 1.5 });
effect(); await flush();
assert.deepEqual(metrics(), ['Veri yok', 'Veri yok', 'Veri yok', 'Veri yok']);
response = async () => ({ totalMembers: 1, totalRevenue: 125, totalEvents: 2, totalOneToOnes: 3 });
effect(); await flush();
assert.deepEqual(metrics(), [1, '₺125', 2, 3]);
response = async () => { throw new Error('Fixture 403'); };
effect(); await flush();
assert.deepEqual(metrics(), []);
assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
for (const malformed of [null, [], 'invalid']) {
  response = async () => malformed;
  effect(); await flush();
  assert.deepEqual(metrics(), []);
  assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
}
console.log('Mobile reports: load failure/retry, real zero, unknown revenue/counts, real revenue, stale hiding and malformed response verified.');
