import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const state = [], effects = new Map();
let cursor = 0, user = { id: 'admin', role: 'ADMIN' }, readMode = 'ok', removeMode = 'ok', deletes = [], reads = 0;
globalThis.participantHooks = {
  useState(initial) { const i = cursor++; if (!(i in state)) state[i] = initial; return [state[i], v => { state[i] = typeof v === 'function' ? v(state[i]) : v; }]; },
  useRef(initial) { const i = cursor++; return state[i] ??= { current: initial }; },
  useEffect(fn, deps) { const i = cursor++; const old = effects.get(i); if (!old || deps.some((v, j) => v !== old.deps[j])) effects.set(i, { fn, deps, pending: true, cleanup: old?.cleanup }); },
};
globalThis.participantAuth = () => ({ user });
const event = { id: 'fixture-event', title: 'Fixture Event', description: 'Fixture', start_at: '2026-10-03T12:00:00Z', end_at: '2026-10-03T14:00:00Z', status: 'PUBLISHED', event_type: 'NETWORKING', is_public: true, max_attendees: 10, price: 0, currency: 'TRY' };
const fetchEvents = async () => {};
let operationMode = 'fail', mutationCalls = 0, payloads = [];
const rejectedWrite = async (...args) => { mutationCalls++; payloads.push(args.at(-1)); if (operationMode instanceof Promise) return operationMode; throw new Error('Fixture store mutation rejected'); };
globalThis.participantStore = () => ({ events: [event], fetchEvents, loadedFor: `${user?.id}:${user?.role}`, readLoading: false, readError: null, createEvent: rejectedWrite, updateEvent: rejectedWrite, deleteEvent: rejectedWrite });
globalThis.participantApi = {
  async getMeetingAttendance(id) { reads++; if (readMode === 'fail') throw new Error('Unavailable'); if (readMode === 'null') return null; if (readMode === 'empty') return []; if (readMode instanceof Promise) return readMode; return [{ id: 'fixture-attendance', event_id: id, user_id: 'fixture-user', name: 'Actual Participant', status: 'PRESENT' }]; },
  async removeEventParticipant(id, uid) { deletes.push([id, uid]); if (removeMode === 'fail') throw new Error('Unavailable'); if (removeMode === 'null') return null; if (removeMode instanceof Promise) return removeMode; return { success: true }; },
};
globalThis.window = { confirm: () => true };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/AdminEvents.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) => `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.participantHooks;`);
const priceCode = ts.transpileModule(readFileSync(new URL('../src/utils/eventPrice.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const priceModule = `data:text/javascript;base64,${Buffer.from(priceCode).toString('base64')}`;
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
  if (module === '../utils/eventPrice') return line.replace(module, priceModule);
  if (module === '../api/api') return 'const api = globalThis.participantApi;';
  if (module === '../stores/authStore') return 'const useAuthStore = globalThis.participantAuth;';
  if (module === '../stores/eventStore') return 'const useEventStore = globalThis.participantStore;';
  if (module === 'react-router-dom') return 'const useNavigate = () => () => {};';
  return names.split(',').map(name => `const ${name.trim()} = '${name.trim()}';`).join('\n');
});
const { AdminEvents } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const render = () => { cursor = 0; return AdminEvents(); };
const nodes = tree => Array.isArray(tree) ? tree.flatMap(nodes) : tree && typeof tree === 'object' ? [tree, ...(tree.type === 'Modal' && !tree.props.open ? [] : nodes(tree.props?.children))] : [];
const has = text => nodes(render()).some(n => n.props?.children === text || n.props?.children?.includes?.(text));
const flush = () => new Promise(done => setImmediate(done));
const runEffects = async () => { for (const e of effects.values()) if (e.pending) { e.cleanup?.(); e.cleanup = e.fn(); e.pending = false; } await flush(); };
const setup = async () => { for (const e of effects.values()) e.cleanup?.(); state.length = 0; effects.clear(); deletes = []; reads = 0; user = { id: 'admin', role: 'ADMIN' }; render(); await runEffects(); };
const fillDates = () => {
  for (let index = 0; index < 2; index++) nodes(render()).filter(n => n.type === 'Input' && n.props?.type === 'datetime-local')[index].props.onChange({ target: { value: index === 0 ? '2026-10-03T12:00' : '2026-10-03T14:00' } });
};
const open = async () => { nodes(render()).find(n => n.props?.onClick?.toString().includes('handleViewParticipants(event)')).props.onClick(); render(); await runEffects(); };
const remove = () => nodes(render()).find(n => n.props?.onClick?.toString().includes('handleRemoveParticipant(p.user_id)'));
for (const failure of ['fail', 'null']) {
  await setup(); readMode = failure; await open(); assert.ok(has('Katılımcı listesi yüklenemedi.')); assert.equal(has('Henüz katılımcı bulunmamaktadır.'), false);
  readMode = 'empty'; nodes(render()).find(n => n.props?.children === 'Tekrar dene').props.onClick(); render(); await runEffects(); assert.ok(has('Henüz katılımcı bulunmamaktadır.'));
}
await setup(); readMode = 'ok'; await open(); assert.ok(has('Actual Participant'));
let resolve; removeMode = new Promise(done => { resolve = done; }); const handler = remove().props.onClick;
const first = handler(); await handler(); assert.equal(deletes.length, 1); assert.equal(remove().props.disabled, true);
readMode = 'fail'; resolve({ success: true }); await first; assert.ok(has('Çıkarma işlemi onaylandı; liste yenilenemedi. Çıkarma işlemini yeniden göndermeyin.'));
for (const failure of ['fail', 'null']) { await setup(); readMode = 'ok'; removeMode = failure; await open(); await remove().props.onClick(); assert.ok(has('Çıkarma sonucu doğrulanamadı. Yeniden göndermeden önce listeyi kontrol edin.')); }
await setup(); readMode = new Promise(done => { resolve = done; }); await open(); assert.ok(has('Katılımcılar yükleniyor...'));
nodes(render()).find(n => n.props?.children === 'Kapat').props.onClick(); render(); await runEffects(); resolve([{ id: 'late', event_id: event.id, name: 'Late Participant' }]); await flush(); assert.equal(has('Late Participant'), false);
await setup(); readMode = 'ok'; await open(); removeMode = new Promise(done => { resolve = done; }); const old = remove().props.onClick; const pending = old(); user = { id: 'member', role: 'MEMBER' }; render(); await old(); assert.equal(deletes.length, 1); resolve({ success: true }); await pending; assert.equal(has('Katılımcı çıkarma işlemi sunucu tarafından onaylandı.'), false);
console.log('Admin participant real component: read failure/null/retry/empty, single pending removal, strict ACK and refresh error separation, closed read and changed-role removal ignored. No network.');
await setup();
nodes(render()).find(n => n.props?.onClick?.toString().includes('setShowForm(true)')).props.onClick(); fillDates();
const submitForm = () => nodes(render()).find(n => n.type === 'form');
await submitForm().props.onSubmit({ preventDefault() {} });
assert.ok(submitForm()); assert.ok(has('Etkinlik kayıt sonucu doğrulanamadı. Yeniden göndermeden önce kayıtları kontrol edin.'));
nodes(render()).find(n => n.props?.onClick?.toString().includes('handleEdit(event)')).props.onClick();
await submitForm().props.onSubmit({ preventDefault() {} }); assert.ok(submitForm());
await nodes(render()).find(n => n.props?.onClick?.toString().includes('handleDelete(event.id)')).props.onClick();
assert.ok(has('Etkinlik silme sonucu doğrulanamadı. Kayıtları kontrol edin.'));
await nodes(render()).find(n => n.props?.onClick?.toString().includes('handleStatusChange(event.id')).props.onClick();
assert.ok(has('Etkinlik durumu güncellenemedi. Kayıtları kontrol edin.'));
console.log('Admin event mutation failures: create/update form remains open, delete/status error visible.');
await setup(); mutationCalls = 0;
nodes(render()).find(n => n.props?.onClick?.toString().includes('setShowForm(true)')).props.onClick(); fillDates();
operationMode = new Promise(done => { resolve = done; });
const submit = submitForm().props.onSubmit; const pendingCreate = submit({ preventDefault() {} }); await submit({ preventDefault() {} });
assert.equal(mutationCalls, 1); assert.equal(nodes(render()).find(n => n.props?.type === 'submit').props.disabled, true);
user = { id: 'different', role: 'MEMBER' }; render(); await submit({ preventDefault() {} }); assert.equal(mutationCalls, 1);
resolve(); await pendingCreate; assert.equal(has('Etkinlik kayıt sonucu doğrulanamadı. Yeniden göndermeden önce kayıtları kontrol edin.'), false);
await setup(); mutationCalls = 0; operationMode = new Promise(done => { resolve = done; });
const deleteHandler = nodes(render()).find(n => n.props?.onClick?.toString().includes('handleDelete(event.id)')).props.onClick;
const pendingDelete = deleteHandler(); await deleteHandler(); assert.equal(mutationCalls, 1); resolve(); await pendingDelete;
operationMode = 'fail';
console.log('Admin event writes: same-tick create/delete single request, disabled submit, stale role handler/result ignored.');
await setup(); operationMode = new Promise(done => { resolve = done; });
nodes(render()).find(n => n.props?.onClick?.toString().includes('setShowForm(true)')).props.onClick(); fillDates();
const closedCreate = submitForm().props.onSubmit({ preventDefault() {} });
nodes(render()).find(n => n.props?.children === 'İptal').props.onClick(); render();
nodes(render()).find(n => n.props?.onClick?.toString().includes('setShowForm(true)')).props.onClick(); fillDates(); render();
resolve(); await closedCreate; assert.ok(submitForm()); operationMode = 'fail';
console.log('A closed/reopened create form is not reset by the previous request.');
const edit = () => nodes(render()).find(n => n.props?.onClick?.toString().includes('handleEdit(event)')).props.onClick();
const priceInput = () => nodes(render()).find(n => n.type === 'Input' && n.props?.step === '0.01');
const currencySelect = () => nodes(render()).find(n => n.type === 'select' && nodes(n.props.children).some(child => child.props?.value === 'TRY'));
for (const invalid of [undefined, null, '', ' ', -1, NaN, Infinity, 'invalid']) {
  event.price = invalid; event.currency = 'TRY'; await setup(); edit();
  assert.equal(priceInput().props.value, '', 'invalid edit source stays blank');
  const before = mutationCalls; await submitForm().props.onSubmit({ preventDefault() {} });
  assert.equal(mutationCalls, before); assert.ok(has('Ücret ve para birimini doğrulayın. Ücretsiz etkinlik için ücret alanına 0 yazın.'));
}
for (const invalid of [undefined, null, '', 'try']) {
  event.price = 100; event.currency = invalid; await setup(); edit();
  assert.equal(currencySelect().props.value, '');
  const before = mutationCalls; await submitForm().props.onSubmit({ preventDefault() {} }); assert.equal(mutationCalls, before);
}
for (const [price, currency] of [[0, 'TRY'], ['125.50', 'USD'], [100, 'GBP']]) {
  event.price = price; event.currency = currency; await setup(); edit();
  assert.equal(priceInput().props.value, price); assert.equal(currencySelect().props.value, currency);
  await submitForm().props.onSubmit({ preventDefault() {} });
  assert.equal(payloads.at(-1).price, Number(price)); assert.equal(payloads.at(-1).currency, currency);
}
event.price = 0; event.currency = 'TRY'; await setup(); edit();
priceInput().props.onChange({ target: { value: '' } });
const beforeBlank = mutationCalls; await submitForm().props.onSubmit({ preventDefault() {} }); assert.equal(mutationCalls, beforeBlank);
priceInput().props.onChange({ target: { value: '0' } });
await submitForm().props.onSubmit({ preventDefault() {} }); assert.equal(payloads.at(-1).price, 0);
console.log('Admin price form: missing/invalid edit source stays blank and sends no write; numeric/decimal price and original currency preserved; cleared price blocked until explicit zero.');
const capacityInput = () => nodes(render()).find(n => n.type === 'Input' && n.props?.min === '1');
const dateInput = index => nodes(render()).filter(n => n.type === 'Input' && n.props?.type === 'datetime-local')[index];
for (const invalid of [undefined, null, '', ' ', 0, -1, 1.5, '12.5', '12x', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  event.max_attendees = invalid; await setup(); edit();
  assert.equal(capacityInput().props.value, '');
  const before = mutationCalls; await submitForm().props.onSubmit({ preventDefault() {} }); assert.equal(mutationCalls, before);
  assert.ok(has('Maksimum katılımcı için pozitif bir tam sayı girin.'));
}
event.max_attendees = 10;
for (const [start, end] of [['', '2026-10-03T14:00'], ['2026-10-03T12:00', ''], ['bad', '2026-10-03T14:00'], ['2026-02-30T12:00', '2026-03-01T14:00'], ['2026-10-03T12:00', '2026-10-03T11:59']]) {
  await setup(); edit();
  dateInput(0).props.onChange({ target: { value: start } }); dateInput(1).props.onChange({ target: { value: end } });
  const before = mutationCalls; await submitForm().props.onSubmit({ preventDefault() {} }); assert.equal(mutationCalls, before);
  assert.ok(has('Başlangıç ve bitiş tarihlerini doğrulayın. Bitiş başlangıçtan önce olamaz.'));
}
await setup(); edit(); capacityInput().props.onChange({ target: { value: '12.5' } });
const beforeFraction = mutationCalls; await submitForm().props.onSubmit({ preventDefault() {} }); assert.equal(mutationCalls, beforeFraction, 'fraction is not truncated');
capacityInput().props.onChange({ target: { value: '12' } });
dateInput(0).props.onChange({ target: { value: '2026-10-03T12:00' } }); dateInput(1).props.onChange({ target: { value: '2026-10-03T14:00' } });
await submitForm().props.onSubmit({ preventDefault() {} });
assert.equal(payloads.at(-1).max_attendees, 12);
assert.equal(payloads.at(-1).start_at, new Date('2026-10-03T12:00').toISOString());
assert.equal(payloads.at(-1).end_at, new Date('2026-10-03T14:00').toISOString());
console.log('Admin capacity/date form: invalid capacity source blank/no write, fraction not truncated, empty/malformed/calendar/reversed dates blocked, valid numeric capacity and local-to-ISO payload passed.');
