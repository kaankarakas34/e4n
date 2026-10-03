import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor = 0, values = [], status;
globalThis.readScreenHooks = { useState(initial) { const i = cursor++; values[i] ??= initial; return [values[i], value => { values[i] = value; }]; }, useEffect() {}, useMemo: fn => fn(), useRef: value => ({ current: value }) };
const user = { id: 'admin', role: 'ADMIN' };
globalThis.readScreenAuth = () => ({ user });
globalThis.readScreenStore = () => ({ events: [{ id: 'fixture', title: 'Fixture Event', description: null, start_at: '2099-10-03', is_public: true, status: 'PUBLISHED' }], fetchEvents: async () => {}, ...status });
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
for (const name of ['AdminEvents', 'UserEvents', 'AdminDashboard']) {
  let code = ts.transpileModule(readFileSync(new URL(`../src/pages/${name}.tsx`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) => `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.readScreenHooks;`);
  code = code.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
    if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
    if (module === 'react') return `const {${names}} = globalThis.readScreenHooks;`;
    if (module === '../stores/authStore') return 'const useAuthStore = globalThis.readScreenAuth;';
    if (module === '../stores/eventStore') return 'const useEventStore = globalThis.readScreenStore;';
    if (module === '../stores/lmsStore') return 'const useLMSStore = () => ({ courses: [], fetchCourses: async () => {} });';
    if (module === '../api/api') return 'const api = {};';
    if (module === 'react-router-dom') return 'const useNavigate = () => () => {};';
    return names.split(',').map(n => `const ${n.trim()} = '${n.trim()}';`).join('\n');
  });
  const screen = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`))[name];
  const render = () => { cursor = 0; return nodes(screen()); };
  values = []; status = { loadedFor: null, readLoading: false, readError: null };
  assert.equal(render().some(n => n.props?.children === 'Fixture Event'), false);
  status = { loadedFor: null, readLoading: false, readError: 'Fixture read failed' }; assert.ok(render().some(n => n.props?.role === 'alert')); assert.ok(render().some(n => n.props?.children === 'Tekrar dene'));
  status = { loadedFor: 'admin:ADMIN', readLoading: false, readError: null }; assert.doesNotThrow(render);
  if (name !== 'AdminDashboard') assert.ok(render().some(n => n.props?.children === 'Fixture Event' || n.props?.children?.includes?.('Fixture Event')), name);
}
console.log('Three real event screens: initial cache hidden, read error/retry visible, fresh data renders and null description accepted.');
