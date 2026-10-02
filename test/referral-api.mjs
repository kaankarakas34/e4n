import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

globalThis.localStorage = { getItem: () => JSON.stringify({ state: { token: 'fixture-token' } }) };
let response = new Response('Fixture unavailable', { status: 503 });
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'http://localhost:4005/api/referrals?userId=fixture%2Fuser');
  assert.equal(options.headers.Authorization, 'Bearer fixture-token');
  return response;
};
let compiled = ts.transpileModule(readFileSync(new URL('../src/api/api.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
compiled = compiled.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/, 'const emailService = {};')
  .replaceAll('import.meta.env.PROD', 'false');
const { api } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
await assert.rejects(api.getReferralsByUser('fixture/user'), /Fixture unavailable/);
response = new Response('[]', { status: 200 });
assert.deepEqual(await api.getReferralsByUser('fixture/user'), []);
response = new Response('[{"id":"server-referral"}]', { status: 200 });
assert.deepEqual(await api.getReferralsByUser('fixture/user'), [{ id: 'server-referral' }]);
globalThis.fetch = async () => { throw new Error('Fixture offline'); };
await assert.rejects(api.getReferralsByUser('fixture/user'), /Fixture offline/);
console.log('Referral API: HTTP/network failures rejected; authenticated reads distinguish empty and populated results.');

for (const [method, path, data] of [
  ['getAdminStats', '/reports/stats', { totalRevenue: 0, totalMembers: 0 }],
  ['getAdminCharts', '/reports/charts', { revenue: [], growth: [] }],
]) {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, `http://localhost:4005/api${path}`);
    assert.equal(options.headers.Authorization, 'Bearer fixture-token');
    return new Response('Fixture reports unavailable', { status: 503 });
  };
  await assert.rejects(api[method](), /Fixture reports unavailable/);
  globalThis.fetch = async () => new Response(JSON.stringify(data), { status: 200 });
  assert.deepEqual(await api[method](), data);
  globalThis.fetch = async () => { throw new Error('Fixture offline'); };
  await assert.rejects(api[method](), /Fixture offline/);
}
console.log('Admin report API: failures rejected without demo/empty fallback; successful zero/empty data preserved.');
