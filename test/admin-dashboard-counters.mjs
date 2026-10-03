import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

let cursor = 0, slots = [], effects = [], queued = [], user, sources, calls;
globalThis.counterHooks = {
  useState(initial) {
    const i = cursor++;
    if (!(i in slots)) slots[i] = initial;
    return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
  },
  useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial }; },
  useEffect(fn, dependencies) {
    const i = cursor++;
    const old = effects[i];
    if (!old || dependencies.some((value, index) => value !== old.dependencies[index])) {
      queued.push(() => { old?.cleanup?.(); effects[i] = { dependencies, cleanup: fn() }; });
    }
  },
};
globalThis.counterAuth = () => ({ user });
const fetchEvents = async () => {};
globalThis.counterEvents = () => ({ events: [], fetchEvents, readLoading: false, readError: null, loadedFor: `${user?.id}:${user?.role}` });
globalThis.counterAPI = Object.fromEntries(['getMembers', 'getGroups', 'getPowerTeams'].map(key => [key, () => { calls[key]++; return sources[key](); }]));
let code = ts.transpileModule(readFileSync(new URL('../src/pages/AdminDashboard.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
code = code.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === 'react') return `const {${names}} = globalThis.counterHooks;`;
  if (module === '../stores/authStore') return 'const useAuthStore = globalThis.counterAuth;';
  if (module === '../stores/eventStore') return 'const useEventStore = globalThis.counterEvents;';
  if (module === '../api/api') return 'const api = globalThis.counterAPI;';
  if (module === 'react-router-dom') return 'const useNavigate = () => () => {};';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { AdminDashboard } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const render = () => { cursor = 0; return nodes(AdminDashboard()); };
const flush = () => { const pending = queued; queued = []; pending.forEach(fn => fn()); };
const settle = async () => { await new Promise(resolve => setImmediate(resolve)); };
const cleanup = () => effects.forEach(effect => effect?.cleanup?.());
const reset = () => {
  cleanup(); slots = []; effects = []; queued = [];
  user = { id: 'admin', role: 'ADMIN' };
  calls = { getMembers: 0, getGroups: 0, getPowerTeams: 0 };
  sources = Object.fromEntries(Object.keys(calls).map(key => [key, async () => []]));
};
const countValues = tree => tree.filter(node => node.type === 'p' && node.props?.className?.includes('text-2xl')).slice(0, 3).map(node => node.props.children);
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

reset();
assert.deepEqual(countValues(render()), ['Yükleniyor...', 'Yükleniyor...', 'Yükleniyor...']); flush(); await settle();
assert.deepEqual(countValues(render()), [0, 0, 0], 'only confirmed empty arrays produce zero');
assert.equal(render().some(node => node.props?.children === 'Tekrar dene'), false);

for (const key of Object.keys(calls)) {
  for (const invalid of ['reject', null, {}, [null], [{ id: '' }]]) {
    reset();
    sources[key] = async () => { if (invalid === 'reject') throw new Error('fixture'); return invalid; };
    render(); flush(); await settle();
    let tree = render();
    const index = Object.keys(calls).indexOf(key);
    assert.equal(countValues(tree)[index], 'Veri yok');
    assert.equal(tree.filter(node => node.props?.role === 'alert').length, 1);
    sources[key] = async () => [{ id: 'real-record' }];
    tree.find(node => node.props?.children === 'Tekrar dene').props.onClick();
    render(); flush(); assert.equal(countValues(render())[index], 'Yükleniyor...');
    await settle(); tree = render();
    assert.equal(countValues(tree)[index], 1);
    assert.equal(tree.some(node => node.props?.role === 'alert'), false);
  }
}

reset(); const old = deferred(); sources.getMembers = () => old.promise;
render(); flush(); await settle();
user = { id: 'another-admin', role: 'ADMIN' };
assert.deepEqual(countValues(render()), ['Yükleniyor...', 'Yükleniyor...', 'Yükleniyor...']);
old.resolve([{ id: 'old' }]); await settle();
assert.deepEqual(countValues(render()), ['Yükleniyor...', 'Yükleniyor...', 'Yükleniyor...'], 'old response ignored even before effect cleanup');
sources.getMembers = async () => []; flush(); await settle(); assert.deepEqual(countValues(render()), [0, 0, 0]);

reset(); user = { id: 'member', role: 'MEMBER' }; render(); flush(); await settle();
assert.deepEqual(Object.values(calls), [0, 0, 0], 'restricted user never requests admin counters');
reset(); const unmounted = deferred(); sources.getMembers = () => unmounted.promise;
render(); flush(); await settle(); const before = slots[1]; cleanup();
unmounted.resolve([{ id: 'late' }]); await settle(); assert.equal(slots[1], before, 'unmount ignores delayed write');
console.log('Real AdminDashboard counters: validated zero/count, per-source failures/retry, old-session response and restricted/unmounted boundaries passed.');
