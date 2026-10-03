import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
globalThis.localStorage = { getItem: () => JSON.stringify({ state: { token: 'fixture-token' } }) };
let response;
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'http://localhost:4005/api/groups/fixture-group/events');
  assert.equal(options.headers.Authorization, 'Bearer fixture-token');
  assert.equal(options.method ?? 'GET', 'GET');
  return response;
};
let compiled = ts.transpileModule(readFileSync(new URL('../src/api/api.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText.replace(/import \{ emailService \} from ['"]\.\.\/services\/emailService['"];?/, 'const emailService = {};').replaceAll('import.meta.env.PROD', 'false');
const { api } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
for (const invalid of [null, {}, [null], [[]]]) {
  response = new Response(JSON.stringify(invalid), { status: 200 });
  await assert.rejects(api.getGroupMeetings('fixture-group'), /Invalid group meetings response/);
}
response = new Response('[]', { status: 200 });
assert.deepEqual(await api.getGroupMeetings('fixture-group'), []);
for (const [value, expected] of [[0, 0], ['0', 0], [2, 2], ['2', 2], [null, null], ['', null], ['2x', null], [-1, null], [1.5, null], [true, null], [Number.MAX_SAFE_INTEGER + 1, null]]) {
  response = new Response(JSON.stringify([{ id: 'fixture', title: 'Recorded meeting', start_at: '2026-10-03', attendees_count: value, total_members: value }]), { status: 200 });
  const [row] = await api.getGroupMeetings('fixture-group');
  assert.equal(row.attendees_count, expected); assert.equal(row.total_members, expected);
  assert.equal(row.topic, 'Recorded meeting'); assert.equal(row.date, '2026-10-03');
}
response = new Response('Fixture unavailable', { status: 503 });
await assert.rejects(api.getGroupMeetings('fixture-group'), /Fixture unavailable/);
globalThis.fetch = async () => { throw new Error('Fixture offline'); };
await assert.rejects(api.getGroupMeetings('fixture-group'), /Fixture offline/);
console.log('Meeting read API: validated list, known integer/zero vs unknown counts, HTTP/network errors preserved. No writes/network.');
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'http://localhost:4005/api/groups/fixture-group/activities');
  assert.equal(options.headers.Authorization, 'Bearer fixture-token');
  return response;
};
response = new Response('Activity fixture unavailable', { status: 503 });
await assert.rejects(api.getGroupActivities('fixture-group'), /Activity fixture unavailable/);
response = new Response('[]', { status: 200 }); assert.deepEqual(await api.getGroupActivities('fixture-group'), []);
globalThis.fetch = async () => { throw new Error('Activity fixture offline'); };
await assert.rejects(api.getGroupActivities('fixture-group'), /Activity fixture offline/);
console.log('Group activity reads: HTTP/network errors reject; true empty remains empty.');
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'http://localhost:4005/api/events/fixture-meeting/attendance');
  assert.equal(options.headers.Authorization, 'Bearer fixture-token'); return response;
};
response = new Response('Unavailable detail', { status: 503 }); await assert.rejects(api.getMeetingAttendance('fixture-meeting'), /Unavailable detail/);
for (const bad of [null, {}, [null], [{ id: 'bad', event_id: 'different' }]]) {
  response = new Response(JSON.stringify(bad), { status: 200 }); await assert.rejects(api.getMeetingAttendance('fixture-meeting'), /Invalid meeting attendance response/);
}
for (const rows of [[], [{ id: 'fixture-attendance', event_id: 'fixture-meeting', status: 'PRESENT' }]]) {
  response = new Response(JSON.stringify(rows), { status: 200 }); assert.deepEqual(await api.getMeetingAttendance('fixture-meeting'), rows);
}
globalThis.fetch = async () => { throw new Error('Offline detail'); }; await assert.rejects(api.getMeetingAttendance('fixture-meeting'), /Offline detail/);
console.log('Meeting attendance API: failure vs true empty, valid rows, wrong-target/malformed response rejected.');
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'http://localhost:4005/api/events/fixture-event'); assert.equal(options.method, 'DELETE');
  return new Response('{"success":true}', { status: 200 });
};
assert.deepEqual(await api.deleteEvent('fixture-event'), { success: true });
console.log('Event delete API returns server ACK to caller.');
