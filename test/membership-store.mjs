import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const cached = new Map();
globalThis.localStorage = { getItem: key => cached.get(key) ?? null, setItem: (key, value) => cached.set(key, value), removeItem: key => cached.delete(key) };
let response = async () => [];
let mutationResponse = async () => { throw new Error('Fixture write failed'); };
let mutations = 0;
globalThis.membershipApi = {
  getMemberships: () => response(),
  createMembership: payload => { mutations++; return mutationResponse(payload); },
  updateMembership: (id, payload) => { mutations++; return mutationResponse(payload, id); },
};
let compiled = ts.transpileModule(readFileSync(new URL('../src/stores/membershipStore.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
compiled = compiled.replace(/from ['"]zustand['"]/, `from '${import.meta.resolve('zustand')}'`)
  .replace(/from ['"]zustand\/middleware['"]/, `from '${import.meta.resolve('zustand/middleware')}'`)
  .replace(/import \{ api \} from ['"]\.\.\/api\/api['"];?/, 'const api = globalThis.membershipApi;');
const { useMembershipStore } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const store = useMembershipStore;
const fixture = { id: 'fixture', user_id: 'fixture', status: 'ACTIVE', plan: '1_MONTH', end_date: '2099-01-01T00:00:00Z' };
response = async () => [fixture];
await store.getState().fetchAll();
assert.deepEqual(store.getState().items, [fixture]);
for (const malformed of [null, {}, 'invalid']) {
  response = async () => malformed;
  await store.getState().fetchAll();
  assert.ok(store.getState().error);
  assert.equal(store.getState().loading, false);
  assert.deepEqual(store.getState().items, [fixture]);
}
response = async () => { throw new Error('Unavailable'); };
await store.getState().fetchAll();
assert.ok(store.getState().error);
response = async () => [];
await store.getState().fetchAll();
assert.deepEqual(store.getState().items, []);
assert.equal(store.getState().error, null);
assert.equal(store.getState().loading, false);
store.setState({ items: [fixture] });
const createPayload = { user_id: 'new-fixture', plan: '1_MONTH', start_date: '2026-01-01T00:00:00Z' };
for (const operation of [
  () => store.getState().create(createPayload),
  () => store.getState().update(fixture.id, { status: 'ACTIVE' }),
  () => store.getState().renew(fixture.id),
  () => store.getState().expire(fixture.id),
]) {
  await assert.rejects(operation, /Fixture write failed/);
  assert.deepEqual(store.getState().items, [fixture]);
  assert.ok(store.getState().error);
  assert.equal(store.getState().loading, false);
}
const beforeMissing = mutations;
await assert.rejects(() => store.getState().renew('missing-fixture'), /bulunamadı/);
assert.equal(mutations, beforeMissing);
for (const invalid of [null, {}, { id: 'wrong-fixture' }]) {
  mutationResponse = async () => invalid;
  await assert.rejects(() => store.getState().update(fixture.id, { status: 'ACTIVE' }), /Invalid/);
  assert.deepEqual(store.getState().items, [fixture]);
}
mutationResponse = async () => null;
await assert.rejects(() => store.getState().create(createPayload), /Invalid/);
const created = { ...fixture, id: 'new-fixture', user_id: 'new-fixture' };
mutationResponse = async () => created;
await store.getState().create(createPayload);
assert.deepEqual(store.getState().items, [created, fixture]);
const updated = { ...fixture, status: 'EXPIRED' };
mutationResponse = async () => updated;
await store.getState().expire(fixture.id);
assert.deepEqual(store.getState().items, [created, updated]);
assert.equal(store.getState().error, null);
assert.equal(store.getState().loading, false);
console.log('Membership store: malformed/error response remains error; successful empty retry clears items/error.');
