import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Execute the actual component with deterministic hooks and API responses.
const state = [];
let cursor = 0;
let effect;
let shouldFail = true;
globalThis.reportHooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in state)) state[index] = initial;
    return [state[index], value => { state[index] = value; }];
  },
  useEffect(callback) { effect ??= callback; },
};
globalThis.reportApi = {
  getAdminStats: async () => {
    if (shouldFail) throw new Error('Fixture unavailable');
    return { totalRevenue: 0, totalMembers: 0 };
  },
  getAdminCharts: async () => ({ revenue: [], growth: [] }),
  getAdminGroupStats: async () => [],
  getAdminGeoStats: async () => [],
  getTrafficLightReport: async () => [],
  getAttendanceReport: async () => [],
};
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/AdminReports.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, source) => {
  if (source === 'react/jsx-runtime') return line.replace(source, import.meta.resolve(source));
  if (source === 'react') return `const {${names}} = globalThis.reportHooks;`;
  if (source === '../api/api') return 'const api = globalThis.reportApi;';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { default: AdminReports } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return AdminReports(); };
const nodes = tree => {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
};
const flush = () => new Promise(resolve => setImmediate(resolve));
render();
const originalError = console.error;
const loggedErrors = [];
console.error = (...args) => loggedErrors.push(args);
effect();
await flush();
console.error = originalError;
assert.equal(loggedErrors.length, 1);
assert.equal(loggedErrors[0][1].message, 'Fixture unavailable');
let tree = render();
assert.ok(nodes(tree).some(node => node.props?.role === 'alert'));
assert.ok(!nodes(tree).some(node => node.props?.title === 'Toplam Ciro'));
const retry = nodes(tree).find(node => node.props?.children === 'Tekrar dene');
assert.ok(retry);
shouldFail = false;
retry.props.onClick();
assert.ok(!nodes(render()).some(node => node.props?.role === 'alert'));
await flush();
tree = render();
assert.ok(!nodes(tree).some(node => node.props?.role === 'alert'));
assert.equal(nodes(tree).find(node => node.props?.title === 'Toplam Ciro').props.value, '₺0');
assert.ok(nodes(tree).some(node => node.props?.children === 'Veri yok'));
assert.ok(!nodes(tree).some(node => node.props?.children === '78.5'));
globalThis.reportApi.getAdminCharts = async () => ({
  revenue: [], growth: [], availability: { revenue: false, growth: false },
});
retry.props.onClick();
await flush();
tree = render();
assert.equal(nodes(tree).filter(node => node.props?.children === 'Veri yok').length, 3);
assert.ok(!nodes(tree).some(node => node.type === 'ResponsiveContainer'));
console.log('AdminReports: failed load shows alert without KPI; retry restores real zero; unavailable average is labeled.');
