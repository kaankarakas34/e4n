import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = process.argv[2];
if (!source) throw new Error('Pass mobile app/admin/groups.tsx');
let cursor = 0, effect, role = 'ADMIN', mode = 'fail', calls = 0;
const state = [];
globalThis.groupHooks = {
  useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], value => { state[i] = value; }]; },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(callback) { effect ??= callback; },
};
globalThis.groupAuth = () => ({ user: { id: 'fixture-user', role } });
globalThis.groupApi = { get: async path => {
  assert.ok(['/groups', '/power-teams'].includes(path)); calls++;
  if (mode === 'fail') throw new Error('Fixture unavailable');
  if (mode === 'invalid') return null;
  if (mode === 'empty' || path === '/power-teams') return [];
  return [{ id: 'fixture-group', name: 'Fixture Group', member_count: 0 }, { id: 'missing-count', name: 'Missing Count', current_month: null }];
} };
let compiled = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) => `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.groupHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '@/utils/api-client') return 'const apiClient = globalThis.groupApi;';
  if (module === '@/hooks/use-auth') return 'const useAuth = globalThis.groupAuth;';
  return names.split(',').map(item => { const name = item.trim();
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
  state.length = 0; effect = undefined; mode = failure; render(); const cleanup = effect(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.accessibilityRole === 'alert'));
  assert.equal(has('Henüz hiç grup yok.'), false);
  mode = 'success'; await nodes(render()).find(node => node.props?.accessibilityRole === 'button').props.onPress();
  assert.ok(has('Fixture Group')); assert.ok(has('0 Üye Kaydı')); assert.ok(has('Üye sayısı bilinmiyor')); assert.ok(has('Dönem bilgisi yok'));
  mode = 'fail'; effect(); await flush();
  assert.equal(has('Fixture Group'), false); assert.equal(has('Henüz hiç grup yok.'), false); cleanup();
}
state.length = 0; effect = undefined; mode = 'empty'; render(); effect(); await flush();
assert.ok(has('Henüz hiç grup yok.'));
for (role of ['MEMBER', 'PRESIDENT']) {
  state.length = 0; effect = undefined; const before = calls; render(); effect(); await flush();
  assert.equal(calls, before); assert.ok(has('Grup yönetimi için yönetici yetkisi gerekiyor.'));
}
console.log('Mobile groups: failure/null not empty, retry, stale list hidden, actual empty/zero and unknown metrics, MEMBER/PRESIDENT do not fetch admin screen. Controlled hooks/API, no network.');
