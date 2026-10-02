import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = process.argv[2];
if (!source) throw new Error('Pass mobile app/admin/index.tsx path');
const states = [];
let cursor = 0, effect, mode = 'fail', role = 'ADMIN', calls = 0;
globalThis.dashboardHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = value; }];
  },
  useEffect(callback) { effect = callback; },
};
globalThis.dashboardAuth = () => ({ user: { id: 'fixture', role }, logout() {} });
globalThis.dashboardApi = { get: async path => {
  calls++;
  assert.equal(path, '/reports/stats');
  if (mode === 'fail') throw new Error('Fixture 503');
  if (mode === 'invalid') return [];
  if (mode === 'unavailable') return { totalMembers: null, totalGroups: '1', totalEvents: -1 };
  return { totalMembers: 0, totalGroups: 7, totalEvents: 12 };
} };
let compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.dashboardHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '@/utils/api-client') return 'const apiClient = globalThis.dashboardApi;';
  if (module === '@/hooks/use-auth') return 'const useAuth = globalThis.dashboardAuth;';
  return names.split(',').map(item => {
    const name = item.trim();
    if (name === 'StyleSheet') return 'const StyleSheet = { create: value => value };';
    if (name === 'Dimensions') return 'const Dimensions = { get: () => ({ width: 390 }) };';
    if (name === 'useRouter') return 'const useRouter = () => ({ push() {} });';
    return `const ${name} = '${name}';`;
  }).join('\n');
});
const { default: Screen } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return Screen(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const numbers = () => nodes(render()).filter(node => node.type === 'Text' && (typeof node.props?.children === 'number' || node.props?.children === 'Veri yok')).map(node => node.props.children);
const flush = () => new Promise(resolve => setImmediate(resolve));
render(); effect(); await flush();
assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
assert.deepEqual(numbers(), []);
mode = 'success';
nodes(render()).find(node => node.props?.accessibilityRole === 'button').props.onPress();
await flush();
assert.deepEqual(numbers(), [0, 7, 12]);
mode = 'fail'; effect(); await flush();
assert.deepEqual(numbers(), []);
mode = 'unavailable'; effect(); await flush();
assert.deepEqual(numbers(), ['Veri yok', 'Veri yok', 'Veri yok']);
mode = 'invalid'; effect(); await flush();
assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
for (role of ['MEMBER', undefined]) {
  const before = calls;
  render(); effect(); await flush();
  assert.equal(calls, before);
  assert.deepEqual(numbers(), []);
  assert.ok(!nodes(render()).some(node => node.type === 'TouchableOpacity'));
}
console.log('Mobile dashboard: real counts/zero, unavailable values, error/retry, stale hiding and non-admin client guard verified.');
