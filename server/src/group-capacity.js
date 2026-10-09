import {companyWriteError} from './company-registration.js';
// Interim guard for the existing groups/group_members model. Power teams are separate.
export const CLOSED_GROUP_LIMIT = 35;
export const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
export function groupError(code, message, status = 409) {
  return Object.assign(new Error(message), { code, status });
}
export async function beginGroupMutation(client) {
  await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query("SET LOCAL statement_timeout = '30s'");
  // All mounted acceptance, transfer, role assignment and shuffle writers use this key.
  await client.query('SELECT pg_advisory_xact_lock(4020, 35)');
}
export async function requireCurrentAdmin(client, id) {
  const user = (await client.query('SELECT role FROM users WHERE id=$1 FOR UPDATE', [id])).rows[0];
  if (!user) throw groupError('UNAUTHENTICATED', 'Oturum bulunamadı.', 401);
  if (user.role !== 'ADMIN') throw groupError('FORBIDDEN', 'Bu işlem için yetkiniz bulunmamaktadır.', 403);
}
export async function requireGroupManager(client, actorId, groupId) {
  const actor = (await client.query("SELECT role,to_jsonb(users)->>'group_title' AS group_title FROM users WHERE id=$1 FOR UPDATE", [actorId])).rows[0];
  if (!actor) throw groupError('UNAUTHENTICATED', 'Oturum bulunamadı.', 401);
  if (actor.role === 'ADMIN') return;
  const membership = (await client.query("SELECT role FROM group_members WHERE user_id=$1 AND group_id=$2 AND status='ACTIVE'", [actorId, groupId])).rows[0];
  if (!membership || ![membership.role, actor.role, actor.group_title].includes('PRESIDENT')) {
    throw groupError('FORBIDDEN', 'Bu grupta işlem yapma yetkiniz bulunmamaktadır.', 403);
  }
}
export async function requirePowerTeamManager(client, actorId, teamId) {
  const actor=(await client.query('SELECT role FROM users WHERE id=$1 FOR UPDATE',[actorId])).rows[0];
  if(!actor)throw groupError('UNAUTHENTICATED','Oturum bulunamadı.',401);
  if(actor.role==='ADMIN')return;
  const membership=(await client.query("SELECT role FROM power_team_members WHERE user_id=$1 AND power_team_id=$2 AND status='ACTIVE'",[actorId,teamId])).rows[0];
  if(membership?.role!=='PRESIDENT')throw groupError('FORBIDDEN','Bu loncada işlem yapma yetkiniz bulunmamaktadır.',403);
}
export async function readGroupCapacity(client, groupIds = null) {
  return (await client.query(`SELECT g.id,
    count(gm.user_id) FILTER(WHERE gm.status='ACTIVE')::int AS active_records,
    count(gm.user_id) FILTER(WHERE gm.status='ACTIVE' AND
      (gm.role='PRESIDENT' OR u.role='PRESIDENT' OR to_jsonb(u)->>'group_title'='PRESIDENT'))::int AS president_records
    FROM groups g LEFT JOIN group_members gm ON gm.group_id=g.id
    LEFT JOIN users u ON u.id=gm.user_id
    WHERE ($1::uuid[] IS NULL OR g.id=ANY($1::uuid[])) GROUP BY g.id`, [groupIds])).rows.map(row => ({
      ...row, member_records: row.active_records - row.president_records,
      limit: CLOSED_GROUP_LIMIT, available_seats: Math.max(0, CLOSED_GROUP_LIMIT - row.active_records + row.president_records),
      role_ambiguous: row.president_records > 1,
    }));
}
export async function enforceGroupCapacity(client, ids) {
  const rows = await readGroupCapacity(client, ids);
  if (ids && rows.length !== new Set(ids).size) throw groupError('GROUP_NOT_FOUND', 'Grup bulunamadı.', 404);
  for (const row of rows) {
    if (row.role_ambiguous) throw groupError('GROUP_ROLE_AMBIGUOUS', 'Grupta birden fazla başkan kaydı var. Rol kayıtlarını kontrol edin.');
    if (row.member_records > CLOSED_GROUP_LIMIT) throw groupError('GROUP_CAPACITY_FULL', 'Grup dolu: başkan hariç en fazla 35 üye kabul edilebilir.');
  }
  return rows;
}
export function sendGroupMutationError(res, error) {
  const companyError=companyWriteError(error);if(companyError)return res.status(companyError.status).json(companyError);
  if (error.status) return res.status(error.status).json({ error: error.message, code: error.code, ...(error.daysLeft !== undefined ? { daysLeft: error.daysLeft, bannedUntil: error.bannedUntil, removalCount: error.removalCount } : {}) });
  if (error.code === '23514' && error.constraint === 'group_members_capacity_check') {
    return res.status(409).json({ error:'Grup dolu: başkan hariç en fazla 35 üye kabul edilebilir.', code:'GROUP_CAPACITY_FULL' });
  }
  if (error.code === '23514' && error.constraint === 'group_members_single_president') {
    return res.status(409).json({ error:'Grupta birden fazla başkan kaydı olamaz.', code:'GROUP_ROLE_AMBIGUOUS' });
  }
  if (['55P03', '57014', '40P01'].includes(error.code)) return res.status(503).json({ error:'Grup işlemi şu anda meşgul. Sonucu kontrol edip tekrar deneyin.', code:'GROUP_BUSY' });
  console.error('Group mutation failed:', error.code || 'UNKNOWN');
  return res.status(500).json({ error:'Grup işlemi tamamlanamadı.' });
}
export function validShuffleAssignments(assignments) {
  if (!assignments || typeof assignments !== 'object' || Array.isArray(assignments)) return false;
  const groups=Object.entries(assignments), users=new Set();
  if(!groups.length||groups.length>5000)return false;
  for(const [id,members] of groups){
    if(!isUuid(id)||!Array.isArray(members)||members.length>5000)return false;
    for(const member of members){if(!isUuid(member)||users.has(member))return false;users.add(member);}
  }
  return users.size>0;
}
