import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const cached = new Map([['referral-store', JSON.stringify({
  state: { referrals: [{ id: 'old-fake-referral' }] }, version: 0,
})]]);
globalThis.localStorage = {
  getItem: key => cached.get(key) ?? null,
  setItem: (key, value) => cached.set(key, value),
  removeItem: key => cached.delete(key),
};
const payload = { receiverId: 'receiver-fixture', type: 'INTERNAL', temperature: 'HOT',
  description: 'Fixture referral description', amount: 100 };
const savedReferral = { id: 'server-referral', giver_id: 'giver-fixture',
  receiver_id: payload.receiverId, type: payload.type, status: 'PENDING' };
let shouldFail = true;
const requestFailure = new Error('Fixture API failure');
globalThis.referralApiFixture = {
  createReferral: async body => {
    assert.equal(body.giverId, 'giver-fixture');
    assert.equal(body.receiverId, payload.receiverId);
    if (shouldFail) throw requestFailure;
    return savedReferral;
  },
};
let compiled = ts.transpileModule(readFileSync(new URL('../src/stores/referralStore.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
compiled = compiled.replace(/from ['"]zustand['"]/, `from '${import.meta.resolve('zustand')}'`)
  .replace(/from ['"]zustand\/middleware['"]/, `from '${import.meta.resolve('zustand/middleware')}'`)
  .replace(/import \{ api \} from ['"]\.\.\/api\/api['"];?/, 'const api = globalThis.referralApiFixture;')
  .replace(/import \{ supabase \} from ['"]\.\.\/api\/supabase['"];?/, 'const supabase = null;');
const { useReferralStore } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
assert.deepEqual(useReferralStore.getState().referrals, []);
assert.equal(JSON.parse(cached.get('referral-store')).version, 1);
await assert.rejects(useReferralStore.getState().createReferral(payload, 'giver-fixture'), error => error === requestFailure);
assert.deepEqual(useReferralStore.getState().referrals, []);
assert.equal(useReferralStore.getState().loading, false);
assert.ok(useReferralStore.getState().error);
shouldFail = false;
const result = await useReferralStore.getState().createReferral(payload, 'giver-fixture');
assert.equal(result, savedReferral);
assert.deepEqual(useReferralStore.getState().referrals, [savedReferral]);
assert.equal(useReferralStore.getState().error, null);
shouldFail = true;
await assert.rejects(useReferralStore.getState().createReferral(payload, 'giver-fixture'));
assert.deepEqual(useReferralStore.getState().referrals, [savedReferral]);
assert.equal(useReferralStore.getState().loading, false);
console.log('Referral store: old cache cleared; failed writes rejected without fake rows; successful retry uses server record.');
