import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = process.argv[2];
let cursor = 0, effect, role = 'ADMIN', mode = 'fail', calls = [];
const state = [], fixtureId = '11111111-1111-1111-1111-111111111111';
let params = { id: fixtureId, type: 'group' };
globalThis.detailHooks = {
  useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(callback) { effect ??= callback; },
};
globalThis.detailAuth = () => ({ user: { id: 'fixture-admin', role } });
globalThis.detailParams = () => params;
globalThis.detailApi = { get: async path => {
  calls.push(path);
  if (mode === 'fail') throw new Error('Fixture unavailable');
  if (mode === 'invalid') return null;
  if (path.endsWith('/members')) return mode === 'empty' ? [] : [{ id: 'fixture-member', full_name: 'Fixture Member', email: 'fixture@example.invalid', status: 'REQUESTED', role: 'MEMBER', group_title: 'MEMBER' }];
  const record = { id: fixtureId, name: 'Fixture Detail', status: 'ACTIVE' };
  return path === '/power-teams' ? (mode === 'missing' ? [] : [record]) : record;
}, post() { throw new Error('Unexpected write'); }, put() { throw new Error('Unexpected write'); } };
let compiled = ts.transpileModule(readFileSync(source, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) => `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.detailHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '@/utils/api-client') return 'const apiClient = globalThis.detailApi;';
  if (module === '@/hooks/use-auth') return 'const useAuth = globalThis.detailAuth;';
  return names.split(',').map(item => { const name = item.trim();
    if (name === 'StyleSheet') return 'const StyleSheet = { create: value => value };';
    if (name === 'useRouter') return 'const useRouter = () => ({ back() {} });';
    if (name === 'useLocalSearchParams') return 'const useLocalSearchParams = globalThis.detailParams;';
    return `const ${name} = '${name}';`;
  }).join('\n');
});
const { default: Screen } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return Screen(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const has = text => nodes(render()).some(node => node.props?.children === text);
const flush = () => new Promise(resolve => setImmediate(resolve));
for (const type of ['group', 'team']) {
  params = { id: fixtureId, type }; state.length = 0; effect = undefined; mode = 'fail'; calls = [];
  render(); const cleanup = effect(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
  assert.equal(has('Üye kaydı yok.'), false);
  mode = 'success'; await nodes(render()).find(node => node.props?.children?.props?.children === 'Tekrar dene').props.onPress();
  assert.ok(has('Fixture Detail')); assert.ok(has('Fixture Member'));
  assert.ok(calls.includes(type === 'team' ? '/power-teams' : `/groups/${fixtureId}`));
  const oldParams = params; params = { id: '22222222-2222-2222-2222-222222222222', type };
  assert.equal(has('Fixture Detail'), false); params = oldParams;
  mode = 'invalid'; effect(); await flush(); assert.equal(has('Fixture Detail'), false);
  mode = 'empty'; effect(); await flush(); assert.ok(has('Üye kaydı yok.')); cleanup();
}
for (role of ['MEMBER', 'PRESIDENT']) {
  state.length = 0; effect = undefined; calls = []; render(); effect(); await flush();
  assert.equal(calls.length, 0); assert.ok(has('Grup yönetimi için yönetici yetkisi gerekiyor.'));
}
role = 'ADMIN'; params = { id: 'invalid-id', type: 'group' }; state.length = 0; effect = undefined; calls = [];
render(); effect(); await flush(); assert.equal(calls.length, 0);
assert.ok(has('Geçersiz grup veya lonca bağlantısı.'));
console.log('Mobile group/team detail: real read paths, failure/retry/null/empty, source fields, new route hides old detail, non-admin and invalid route make no calls. No mutations/network.');
