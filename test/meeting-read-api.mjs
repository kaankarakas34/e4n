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

const meetingRow = { id: 'request-key', requester_id: 'sender', partner_id: 'recipient', notes: 'Topic',
  meeting_date: '2026-10-06T10:00:00Z', created_at: '2026-10-03T10:00:00Z', status: 'PENDING' };
const payload = { requestId: meetingRow.id, senderId: 'sender', receiverId: 'recipient', topic: ' Topic ', proposedTime: meetingRow.meeting_date };
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'http://localhost:4005/api/one-to-ones/request'); assert.equal(options.method, 'POST');
  assert.deepEqual(JSON.parse(options.body), payload); return response;
};
for (const bad of [null, {success:true}, {...meetingRow,id:'different'}, {...meetingRow,requester_id:'other'},
  {...meetingRow,partner_id:'other'}, {...meetingRow,status:'COMPLETED'}, {...meetingRow,notes:'Other'}, {...meetingRow,meeting_date:'bad'}]) {
  response = new Response(JSON.stringify(bad)); await assert.rejects(api.requestMeeting(payload), /Unconfirmed meeting request/);
}
for (const status of ['PENDING', 'ACCEPTED', 'REJECTED']) {
  response = new Response(JSON.stringify({...meetingRow,status})); assert.equal((await api.requestMeeting(payload)).status,status);
}
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'http://localhost:4005/api/one-to-ones/request-key/status'); assert.equal(options.method,'PUT'); return response;
};
for (const bad of [null, {success:true}, {...meetingRow,status:'PENDING'}, {...meetingRow,status:'ACCEPTED',id:'other'}]) {
  response = new Response(JSON.stringify(bad)); await assert.rejects(api.updateMeetingStatus('request-key','ACCEPTED'), /Unconfirmed meeting status/);
}
response = new Response(JSON.stringify({...meetingRow,status:'ACCEPTED'})); assert.equal((await api.updateMeetingStatus('request-key','ACCEPTED')).success,true);
globalThis.fetch = async () => response;
for (const bad of [null, {}, [null], [{...meetingRow,requester_id:'other'}]]) {
  response = new Response(JSON.stringify(bad)); await assert.rejects(api.getMyMeetingRequests('sender'));
}
response = new Response(JSON.stringify([{...meetingRow,status:'COMPLETED',requester_name:'Sender',partner_name:'Recipient'}]));
const [mapped] = await api.getMyMeetingRequests('sender'); assert.equal(mapped.status,'COMPLETED'); assert.equal(mapped.receiverName,'Recipient');
response = new Response('Unavailable', {status:503}); await assert.rejects(api.getMyMeetingRequests('sender'), /Unavailable/);
console.log('Meeting request API: malformed/wrong-target write ACK rejected, decided-key retries allowed, owner and legacy status preserved, read failures reject.');
