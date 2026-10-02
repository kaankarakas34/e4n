import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const cached = new Map();
globalThis.localStorage = { getItem: key => cached.get(key) ?? null, setItem: (key, value) => cached.set(key, value), removeItem: key => cached.delete(key) };
let response = async () => [];
globalThis.membershipApi = { getMemberships: () => response() };
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
console.log('Membership store: malformed/error response remains error; successful empty retry clears items/error.');
