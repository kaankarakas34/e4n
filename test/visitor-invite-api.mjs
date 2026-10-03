import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
globalThis.localStorage = { getItem: () => null };
let compiled = ts.transpileModule(readFileSync(new URL('../src/api/api.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/, 'const emailService = {};').replaceAll('import.meta.env.PROD', 'false');
const { api } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
let status = 200, body = { valid: true, email: 'fixture@example.invalid' };
globalThis.fetch = async url => {
  assert.equal(url, 'http://localhost:4005/api/visitor-invite/verify?token=fixture%2Ftoken');
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
};
assert.deepEqual(await api.verifyVisitorInvite('fixture/token'), body);
status = 400; body = { valid: false, code: 'INVALID_INVITE', error: 'Fixture invalid' };
assert.deepEqual(await api.verifyVisitorInvite('fixture/token'), body);
for (const failure of [
  { status: 500, body: { code: 'INVITE_CHECK_FAILED', error: 'Fixture lookup unavailable' } },
  { status: 400, body: { valid: false, error: 'Ambiguous legacy failure' } },
  { status: 400, body: { valid: false, code: 'INVALID_INVITE', error: {} } },
  { status: 400, body: '<html>Fixture failure</html>' },
  { status: 503, body: { valid: false, code: 'INVALID_INVITE', error: 'Fixture overloaded' } },
]) {
  ({ status, body } = failure);
  await assert.rejects(api.verifyVisitorInvite('fixture/token'), error => error.status === status && typeof error.responseBody === 'string');
}
globalThis.fetch = async () => { throw new Error('Fixture offline'); };
await assert.rejects(api.verifyVisitorInvite('fixture/token'), /Fixture offline/);
console.log('Invite API: only explicit INVALID_INVITE HTTP400 resolves false; ambiguous legacy, 500/503, malformed and network failures reject. Controlled fetch, no network.');
