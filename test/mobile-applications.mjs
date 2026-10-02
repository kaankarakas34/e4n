import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = process.argv[2];
if (!source) throw new Error('Pass the mobile app/admin/applications.tsx source path');
const states = [];
let cursor = 0;
let effect;
let mode = 'visitors-fail';
globalThis.applicationHooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in states)) states[index] = initial;
    return [states[index], value => { states[index] = value; }];
  },
  useEffect(callback) { effect ??= callback; },
};
globalThis.applicationApi = {
  get: async path => {
    assert.ok(['/public-visitors', '/users'].includes(path));
    if (mode === 'visitors-fail' && path === '/public-visitors') throw new Error('Fixture 503');
    if (mode === 'members-fail' && path === '/users') throw new Error('Fixture 403');
    if (mode === 'invalid' && path === '/users') return { error: 'Invalid response' };
    if (mode === 'empty') return [];
    return path === '/users'
      ? [{ id: 'pending', name: 'Pending Fixture', account_status: 'PENDING' }, { id: 'active', account_status: 'ACTIVE' }]
      : [{ id: 'visitor', name: 'Visitor Fixture', status: 'PENDING' }];
  },
};
let compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.applicationHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === 'react') return `const {${names}} = globalThis.applicationHooks;`;
  if (module === '@/utils/api-client') return 'const apiClient = globalThis.applicationApi;';
  return names.split(',').map(item => {
    const name = item.trim();
    if (name === 'StyleSheet') return 'const StyleSheet = { create: value => value };';
    if (name === 'useRouter') return 'const useRouter = () => ({ back() {} });';
    return `const ${name} = '${name}';`;
  }).join('\n');
});
const { default: Screen } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return Screen(); };
const nodes = value => Array.isArray(value) ? value.flatMap(nodes)
  : value && typeof value === 'object' ? [value, ...nodes(value.props?.children)] : [];
const hasText = (tree, text) => nodes(tree).some(node => node.props?.children === text);
const flush = () => new Promise(resolve => setImmediate(resolve));
for (const failure of ['visitors-fail', 'members-fail', 'invalid']) {
  states.length = 0;
  effect = undefined;
  mode = failure;
  render(); effect(); await flush();
  let tree = render();
  assert.ok(nodes(tree).some(node => node.props?.accessibilityRole === 'alert'));
  assert.ok(!hasText(tree, 'Bekleyen başvuru bulunmuyor.'));
  assert.ok(!hasText(tree, 'Ziyaretçiler (0)'));
  const retry = nodes(tree).find(node => node.props?.accessibilityRole === 'button');
  assert.ok(retry);
  mode = 'success'; retry.props.onPress(); await flush(); tree = render();
  assert.ok(!nodes(tree).some(node => node.props?.accessibilityRole === 'alert'));
  assert.ok(hasText(tree, 'Ziyaretçiler (1)'));
  assert.ok(hasText(tree, 'Üyelikler (1)'));
}
mode = 'empty'; states.length = 0; effect = undefined;
render(); effect(); await flush();
const emptyTree = render();
assert.ok(hasText(emptyTree, 'Bekleyen başvuru bulunmuyor.'));
assert.ok(hasText(emptyTree, 'Ziyaretçiler (0)'));
assert.ok(!nodes(emptyTree).some(node => node.props?.accessibilityRole === 'alert'));
console.log('Mobile applications: both request failures and malformed response show alert, not empty; retry restores data; real empty remains empty.');
