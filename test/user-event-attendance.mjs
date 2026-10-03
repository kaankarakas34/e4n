import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
let cursor = 0, slots = [], events, user, reads = 0;
globalThis.attendanceHooks = {
  useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
  useEffect() {},
};
globalThis.attendanceAuth = () => ({ user });
globalThis.attendanceStore = () => ({ events, fetchEvents: async () => { reads++; }, readError: null, readLoading: false, loadedFor: `${user?.id}:${user?.role}` });
let code = ts.transpileModule(readFileSync(new URL('../src/pages/UserEvents.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const priceCode = ts.transpileModule(readFileSync(new URL('../src/utils/eventPrice.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const priceModule = `data:text/javascript;base64,${Buffer.from(priceCode).toString('base64')}`;
code = code.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '../utils/eventPrice') return line.replace(module, priceModule);
  if (module === 'react') return `const {${names}} = globalThis.attendanceHooks;`;
  if (module === '../stores/authStore') return 'const useAuthStore = globalThis.attendanceAuth;';
  if (module === '../stores/eventStore') return 'const useEventStore = globalThis.attendanceStore;';
  if (module === '../api/api') return 'const api = {};';
  if (module === 'react-router-dom') return 'const useNavigate = () => () => {};';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { UserEvents } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [];
const text = tree => Array.isArray(tree) ? tree.map(text).join('') : tree && typeof tree === 'object' ? text(tree.props?.children) : typeof tree === 'string' || typeof tree === 'number' ? String(tree) : '';
const render = () => { cursor = 0; const tree = UserEvents(); return { tree, nodes: nodes(tree), text: text(tree) }; };
const event = extras => ({ id: 'event', title: 'Fixture event', start_at: '2099-10-03', is_public: true, status: 'PUBLISHED', max_attendees: 10, ...extras });
const reset = extras => { slots = []; user = { id: 'me', role: 'MEMBER' }; events = [event(extras)]; };
const attendingTab = output => output.nodes.find(node => node.type === 'button' && text(node).includes('Katılacağım Etkinlikler'));

for (const attendees of [undefined, null, {}, [null], [{ id: '' }]]) {
  reset({ attendees }); let output = render();
  assert.ok(text(attendingTab(output)).includes('(Bilinmiyor)'));
  assert.ok(output.text.includes('Bilinmiyor / 10'));
  assert.ok(output.text.includes('Kalan: Bilinmiyor'));
  attendingTab(output).props.onClick(); output = render();
  assert.ok(output.nodes.some(node => node.props?.role === 'alert'));
  assert.ok(output.text.includes('Etkinlik kayıtlarınız doğrulanamadı.'));
  assert.equal(output.text.includes('Kayıt olduğunuz yaklaşan bir etkinlik bulunmamaktadır.'), false);
  const before = reads; await output.nodes.find(node => node.props?.children === 'Tekrar dene').props.onClick(); assert.equal(reads, before + 1);
}
reset({ attendees: [] }); let output = render();
assert.ok(text(attendingTab(output)).includes('(0)')); assert.ok(output.text.includes('0 / 10')); assert.ok(output.text.includes('Kalan: 10'));
attendingTab(output).props.onClick(); assert.ok(render().text.includes('Kayıt olduğunuz yaklaşan bir etkinlik bulunmamaktadır.'));
reset({ attendees: [{ id: 'me' }, { id: 'other' }] }); output = render();
assert.ok(text(attendingTab(output)).includes('(1)')); assert.ok(output.text.includes('2 / 10')); assert.ok(output.text.includes('Kalan: 8'));
events.push(event({ id: 'past', start_at: '2020-01-01', attendees: [{ id: 'me' }] }));
output = render(); assert.ok(text(attendingTab(output)).includes('(1)'), 'tab count uses same visible event scope');
attendingTab(output).props.onClick(); assert.ok(render().text.includes('Fixture event'));
reset({ attendees: [] }); user = null; output = render(); attendingTab(output).props.onClick();
assert.ok(render().text.includes('Etkinlik kayıtlarınızı görmek için giriş yapın.'));
for (const max_attendees of [undefined, null, 0, -1, 1.5, '10']) {
  reset({ attendees: [], max_attendees }); output = render(); assert.ok(output.text.includes('0 / Bilinmiyor')); assert.equal(output.text.includes('∞'), false);
}
reset({ attendees: [{ id: 'me' }, { id: 'other' }], max_attendees: 1 }); assert.ok(render().text.includes('Kalan: Bilinmiyor'), 'contradictory count does not assert zero capacity');
for (const price of [undefined, null, '', ' ', true, -1, '-1', 'invalid', '1e3', Infinity, NaN]) {
  reset({ attendees: [], price, currency: 'TRY' }); output = render();
  assert.equal(output.text.includes('Ücretsiz'), false);
  assert.ok(output.nodes.some(node => node.type === 'span' && node.props?.className === 'font-bold text-gray-900' && node.props.children === 'Bilinmiyor'));
}
for (const price of [0, '0.00']) { reset({ attendees: [], price }); assert.ok(render().text.includes('Ücretsiz')); }
for (const price of [125.5, '125.50']) {
  reset({ attendees: [], price, currency: 'TRY' }); assert.ok(render().text.includes('125,5 TRY'));
  reset({ attendees: [], price, currency: 'USD' }); assert.ok(render().text.includes('125,5 USD'));
  reset({ attendees: [], price, currency: null }); assert.equal(render().text.includes('Ücretsiz'), false);
}
console.log('Real UserEvents attendance: missing/malformed unknown vs confirmed empty/count, retry, scoped count, anonymous and capacity boundaries passed.');
console.log('Real UserEvents prices: unknown never free, confirmed numeric/string zero free, paid decimal/currency display preserved.');
