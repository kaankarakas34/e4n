import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const states = [];
let cursor = 0, effect;
let response = async () => { throw new Error('Unavailable'); };
globalThis.accountingHooks = {
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
  useRef(initial) { const i = cursor++; return states[i] ??= { current: initial }; },
  useEffect(callback) { effect ??= callback; },
};
globalThis.accountingApi = { getAccountingPayments: () => response() };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/AdminAccounting.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
compiled = compiled.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) =>
  `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.accountingHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '../api/api') return 'const api = globalThis.accountingApi;';
  if (module === '../stores/authStore') return 'const useAuthStore = () => ({ user: { role: "ADMIN" } });';
  if (module === 'react-router-dom') return 'const useNavigate = () => () => {};';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { AdminAccounting } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return AdminAccounting(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const has = text => nodes(render()).some(node => node.props?.children === text);
const flush = () => new Promise(resolve => setImmediate(resolve));
const row = (id, amount, type = 'MEMBER') => ({ id, amount, type, name: 'Fixture User', email: 'fixture@example.invalid', company: '', invoice_issued: false, created_at: '2026-02-03T10:00:00Z' });
const originalError = console.error;
console.error = () => {};
try {
  render(); effect(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.ok(!has('Kayıtlı Tutarlar Toplamı'));
  response = async () => [row('missing', null), row('zero', 0, 'VISITOR')];
  nodes(render()).find(node => node.props?.children === 'Tekrar dene').props.onClick();
  await flush();
  assert.ok(has('Tutar bilgisi yok'));
  assert.ok(has('₺0'));
  assert.ok(!has('₺7200'));
  const details = nodes(render()).find(node => node.type === 'Button' && node.props?.onClick?.toString().includes('setSelectedRecord'));
  assert.ok(details);
  details.props.onClick();
  assert.ok(nodes(render()).find(node => node.type === 'Modal').props.open);
  assert.ok(has('Kayıtlı Tutar'));
  assert.ok(has('Tutar bilgisi yok'));
  response = async () => [row('member', 125), row('visitor', 25, 'VISITOR')];
  effect(); await flush();
  assert.ok(has('₺150'));
  assert.ok(has('₺25'));
  assert.ok(!has('Ziyaretçi Geliri (₺1k)'));
  response = async () => [];
  effect(); await flush();
  assert.ok(has('₺0'));
  response = async () => ({ error: 'Invalid response' });
  effect(); await flush();
  assert.ok(nodes(render()).some(node => node.props?.role === 'alert'));
  assert.ok(!has('Kayıtlı Tutarlar Toplamı'));
  assert.ok(!has('₺0'));
  console.log('Accounting: missing amount prevents false total; zero/sum, error/retry, malformed response and stale metric hiding verified.');
} finally { console.error = originalError; }
