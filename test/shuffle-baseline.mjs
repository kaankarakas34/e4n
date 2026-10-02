import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(root, 'src/utils/shuffleAlgorithm.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { distributeMembers } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const config = { respectLocks: true, minimizeOverlap: false, maxAttempts: 1 };
const groups = [{ id: 'group-1', name: 'Fixture Group' }];

const members = Array.from({ length: 36 }, (_, index) => ({
  id: `member-${index}`, name: `Member ${index}`, full_name: `Member ${index}`,
  profession: `Unique Profession ${index}`,
}));
const overCapacity = distributeMembers(members, groups, { 'group-1': [] }, [], config);
assert.equal(overCapacity['group-1'].length, 36);
assert.equal(overCapacity.unassigned.length, 0);

const conflictingLockedMembers = [
  { id: 'locked-1', name: 'Locked 1', full_name: 'Locked 1', profession: 'Same Profession' },
  { id: 'locked-2', name: 'Locked 2', full_name: 'Locked 2', profession: 'Same Profession' },
];
const conflictingLocks = distributeMembers(conflictingLockedMembers, groups,
  { 'group-1': ['locked-1', 'locked-2'] }, ['locked-1', 'locked-2'], config);
assert.deepEqual(conflictingLocks['group-1'], ['locked-1', 'locked-2']);

console.log(JSON.stringify({ oneGroupUniqueProfessions: overCapacity['group-1'].length,
  unassigned: overCapacity.unassigned.length,
  conflictingLockedProfessionsPlaced: conflictingLocks['group-1'].length }, null, 2));
