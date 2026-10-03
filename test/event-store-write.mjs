import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const cache = new Map();
globalThis.localStorage = { getItem: key => cache.get(key) ?? null, setItem: (key, value) => cache.set(key, value), removeItem: key => cache.delete(key) };
let result = async () => { throw new Error('Unavailable fixture'); };
globalThis.eventApi = { createEvent: () => result(), updateEvent: () => result(), deleteEvent: () => result(), getEvents: async () => [] };
let compiled = ts.transpileModule(readFileSync(new URL('../src/stores/eventStore.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/from ['"]zustand['"]/, `from '${import.meta.resolve('zustand')}'`)
  .replace(/from ['"]zustand\/middleware['"]/, `from '${import.meta.resolve('zustand/middleware')}'`)
  .replace(/import \{ api \} from ['"]\.\.\/api\/api['"];?/, 'const api = globalThis.eventApi;');
const { useEventStore: store } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const fixture = { id: 'fixture-event', title: 'Fixture', start_at: '2026-10-03T12:00:00Z', is_public: true };
store.setState({ events: [fixture] });
for (const operation of [() => store.getState().createEvent({ title: 'New' }), () => store.getState().updateEvent(fixture.id, { status: 'DRAFT' }), () => store.getState().deleteEvent(fixture.id)]) {
  result = async () => { throw new Error('Unavailable fixture'); }; await assert.rejects(operation, /Unavailable fixture/);
  assert.deepEqual(store.getState().events, [fixture]); assert.ok(store.getState().error); assert.equal(store.getState().loading, false);
  for (const bad of [null, {}, { id: 'other' }]) { result = async () => bad; await assert.rejects(operation, /Invalid/); assert.deepEqual(store.getState().events, [fixture]); }
}
result = async () => ({ ...fixture, id: 'other' }); await assert.rejects(() => store.getState().updateEvent(fixture.id, {}), /Invalid/);
const created = { ...fixture, id: 'new' }; result = async () => created; await store.getState().createEvent({}); assert.deepEqual(store.getState().events, [created, fixture]);
const updated = { ...fixture, status: 'DRAFT' }; result = async () => updated; await store.getState().updateEvent(fixture.id, { status: 'DRAFT' }); assert.deepEqual(store.getState().events, [created, updated]);
result = async () => ({ success: true }); await store.getState().deleteEvent(fixture.id); assert.deepEqual(store.getState().events, [created]); assert.equal(store.getState().error, null); assert.equal(store.getState().loading, false);
console.log('Event store real Zustand: write rejects/error/loading, malformed/wrong-target no cache mutation; confirmed create/update/delete change cache.');
