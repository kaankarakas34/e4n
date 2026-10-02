import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = process.argv[2];
if (!source) throw new Error('Pass mobile app/admin/professions.tsx path');
const states = [];
let cursor = 0, effect, mode = 'fail';
globalThis.professionHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = value; }];
  },
  useEffect(callback) { effect ??= callback; },
};
globalThis.professionApi = { get: async path => {
  assert.equal(path, '/professions');
  if (mode === 'fail') throw new Error('Fixture 503');
  if (mode === 'invalid') return { error: 'Invalid response' };
  return mode === 'empty' ? [] : [{ id: 'fixture', name: 'Fixture Profession', category: 'Fixture' }];
} };
let compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.professionHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '@/utils/api-client') return 'const apiClient = globalThis.professionApi;';
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
const has = text => nodes(render()).some(node => node.props?.children === text);
const flush = () => new Promise(resolve => setImmediate(resolve));
for (const failure of ['fail', 'invalid']) {
  states.length = 0; effect = undefined; mode = failure;
  render(); effect(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
  assert.ok(!has('Meslek bulunamadı.'));
  mode = 'success';
  nodes(render()).find(node => node.props?.accessibilityRole === 'button').props.onPress();
  await flush();
  assert.ok(has('Fixture Profession'));
  mode = 'fail'; effect(); await flush();
  assert.ok(!has('Fixture Profession'));
  assert.ok(!has('Meslek bulunamadı.'));
}
mode = 'empty'; states.length = 0; effect = undefined;
render(); effect(); await flush();
assert.ok(has('Meslek bulunamadı.'));
assert.ok(!nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
console.log('Mobile professions: error/malformed response, retry, stale list hiding and true empty verified.');
