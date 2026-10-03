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
const event = { id: 'fixture-event', title: 'Fixture Event', description: 'Fixture', start_at: '2026-10-03T12:00:00Z', end_at: '2026-10-03T14:00:00Z', status: 'PUBLISHED', event_type: 'NETWORKING', is_public: true, max_attendees: 10 };
const fetchEvents = async () => {};
const rejectedWrite = async () => { throw new Error('Fixture store mutation rejected'); };
globalThis.participantStore = () => ({ events: [event], fetchEvents, loadedFor: `${user?.id}:${user?.role}`, readLoading: false, readError: null, createEvent: rejectedWrite, updateEvent: rejectedWrite, deleteEvent: rejectedWrite });
globalThis.participantApi = {
  async getMeetingAttendance(id) { reads++; if (readMode === 'fail') throw new Error('Unavailable'); if (readMode === 'null') return null; if (readMode === 'empty') return []; if (readMode instanceof Promise) return readMode; return [{ id: 'fixture-attendance', event_id: id, user_id: 'fixture-user', name: 'Actual Participant', status: 'PRESENT' }]; },
  async removeEventParticipant(id, uid) { deletes.push([id, uid]); if (removeMode === 'fail') throw new Error('Unavailable'); if (removeMode === 'null') return null; if (removeMode instanceof Promise) return removeMode; return { success: true }; },
};
globalThis.window = { confirm: () => true };
let compiled = ts.transpileModule(readFileSync(new URL('../src/pages/AdminEvents.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText.replace(/import React, \{([^}]+)\} from ['"]react['"];?/, (_, names) => `import React from '${import.meta.resolve('react')}'; const {${names}} = globalThis.participantHooks;`);
compiled = compiled.replace(/import \{([^}]+)\} from ['"]([^'"]+)['"];?/g, (line, names, module) => {
  if (module === 'react/jsx-runtime') return line.replace(module, import.meta.resolve(module));
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
nodes(render()).find(n => n.props?.onClick?.toString().includes('setShowForm(true)')).props.onClick();
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
