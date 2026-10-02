import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const state = [];
let cursor = 0;
let effect;
let response = async () => { throw new Error('Unavailable'); };
globalThis.professionHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in state)) state[i] = initial;
    return [state[i], value => { state[i] = value; }];
  },
  useRef(initial) {
    const i = cursor++;
    return state[i] ??= { current: initial };
  },
  useEffect(callback) { effect ??= callback; },
};
globalThis.professionApi = { getProfessions: query => response(query) };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/AdminProfessions.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, source) => {
  if (source === 'react/jsx-runtime') return line.replace(source, import.meta.resolve(source));
  if (source === 'react') return `const {${names}} = globalThis.professionHooks;`;
  if (source === '../api/api') return 'const api = globalThis.professionApi;';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { AdminProfessions } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return AdminProfessions(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : !tree || typeof tree !== 'object' ? [] : [tree, ...nodes(tree.props?.children)];
const hasText = text => nodes(render()).some(node => {
  const children = node.props?.children;
  return (Array.isArray(children) ? children.flat(Infinity) : [children]).includes(text);
});
const flush = () => new Promise(resolve => setImmediate(resolve));
const clickRetry = () => nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick();
const originalError = console.error;
console.error = () => {};
try {
  render();
  assert.ok(nodes(render()).some(node => node.props?.role === 'status'));
  assert.ok(!hasText('Sonuç yok'));
  effect();
  await flush();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.ok(!hasText('Sonuç yok'));
  assert.equal(nodes(render()).find(node => node.type === 'fieldset').props.disabled, true);
  response = async () => ({ invalid: true });
  clickRetry();
  await flush();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  response = async () => [];
  clickRetry();
  await flush();
  assert.ok(hasText('Sonuç yok'));
  assert.equal(nodes(render()).find(node => node.type === 'fieldset').props.disabled, false);
  const search = nodes(render()).find(node => node.props?.placeholder === 'Ara...');
  let resolveOld;
  response = () => new Promise(resolve => { resolveOld = resolve; });
  effect();
  assert.ok(nodes(render()).some(node => node.props?.placeholder === 'Ara...'));
  response = async () => [{ id: 'new', name: 'Newest profession', status: 'APPROVED' }];
  search.props.onChange({ target: { value: 'Newest' } });
  render();
  effect();
  await flush();
  resolveOld([{ id: 'old', name: 'Stale profession', status: 'APPROVED' }]);
  await flush();
  assert.ok(hasText('Newest profession'));
  assert.ok(!hasText('Stale profession'));
  response = async () => { throw new Error('Refresh failed'); };
  effect();
  await flush();
  assert.ok(!hasText('Newest profession'));
  const pendingTab = nodes(render()).find(node => node.type === 'button' && Array.isArray(node.props.children));
  pendingTab.props.onClick();
  render();
  effect();
  await flush();
  assert.ok(!hasText('Bekleyen talep yok.'));
  response = async () => [];
  clickRetry();
  await flush();
  assert.ok(hasText('Bekleyen talep yok.'));
  for (const created_at of [undefined, null, '', 'not-a-date', 0]) {
    response = async () => [{ id: 'pending', name: 'Pending profession', status: 'PENDING', created_at }];
    effect();
    await flush();
    assert.ok(hasText('Tarih bilgisi yok'));
    assert.ok(!hasText('Invalid Date'));
  }
  response = async () => [{ id: 'pending', name: 'Pending profession', status: 'PENDING', created_at: '2026-02-03T10:00:00.000Z' }];
  effect();
  await flush();
  assert.ok(hasText(new Date('2026-02-03T10:00:00.000Z').toLocaleDateString('tr-TR')));
  assert.ok(!hasText('Tarih bilgisi yok'));
  console.log('AdminProfessions: error/empty, malformed response, retry, stale refresh and request race verified.');
} finally {
  console.error = originalError;
}
