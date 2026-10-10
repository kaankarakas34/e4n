import {referralTransport} from './api';

export interface WorkspaceGroup {
  id: string;
  name: string;
  status: string | null;
}

export interface WorkspaceMember {
  id: string;
  full_name: string;
  profession: string | null;
  role: string;
  account_status: string | null;
  previous_group_id?: string | null;
  is_eligible?: boolean;
  eligibility_category?: 'ELIGIBLE' | 'INELIGIBLE' | 'EXCLUDED';
  ineligibility_reasons?: string[];
  ineligibility_details?: string[];
  removal_ban?: { active: boolean; daysLeft: number; bannedUntil?: string | null };
}

export interface CanonicalPeriod {
  periodKey: string;
  year: number;
  trimester: number;
  startDate: string;
  endDate: string;
  cutoffDate: string;
  isCutoffPassed: boolean;
  label: string;
}

export interface ShuffleWorkspace {
  version: 1;
  ownerId: string;
  asOf: string;
  revision: string;
  historyAvailable: false;
  period?: CanonicalPeriod;
  groups: WorkspaceGroup[];
  members: WorkspaceMember[];
  memberships: { group_id: string; user_id: string; role: string | null }[];
}

const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(v);
const text = (v: unknown) => v === null || typeof v === 'string';

export function validShuffleWorkspace(d: any, owner: string): d is ShuffleWorkspace {
  if (
    !d ||
    !uuid(owner) ||
    d.version !== 1 ||
    d.ownerId !== owner ||
    typeof d.revision !== 'string' ||
    !/^[a-f0-9]{64}$/.test(d.revision) ||
    d.historyAvailable !== false ||
    typeof d.asOf !== 'string' ||
    !Number.isFinite(Date.parse(d.asOf)) ||
    !Array.isArray(d.groups) ||
    d.groups.length > 5000 ||
    !Array.isArray(d.members) ||
    d.members.length > 10000 ||
    !Array.isArray(d.memberships) ||
    d.memberships.length > 20000
  ) return false;

  const groups = new Set<string>();
  const members = new Set<string>();
  const pairs = new Set<string>();

  for (const g of d.groups) {
    if (!g || !uuid(g.id) || groups.has(g.id) || typeof g.name !== 'string' || !text(g.status)) return false;
    groups.add(g.id);
  }
  for (const m of d.members) {
    if (!m || !uuid(m.id) || members.has(m.id) || typeof m.full_name !== 'string' || typeof m.role !== 'string' || !text(m.profession) || !text(m.account_status) || 'password_hash' in m || 'email' in m) return false;
    members.add(m.id);
  }
  for (const m of d.memberships) {
    if (!m || !groups.has(m.group_id) || !members.has(m.user_id) || !text(m.role) || pairs.has(m.group_id + ':' + m.user_id)) return false;
    pairs.add(m.group_id + ':' + m.user_id);
  }
  return true;
}

export function currentDistribution(d: ShuffleWorkspace) {
  const eligible = d.members.filter(m => m.account_status === 'ACTIVE' && m.role !== 'ADMIN');
  const ids = new Set(eligible.map(m => m.id));
  const items: Record<string, string[]> = Object.fromEntries(d.groups.map(g => [g.id, []]));
  items.unassigned = [];
  const counts = new Map<string, number>();

  for (const m of d.memberships) {
    if (ids.has(m.user_id)) {
      items[m.group_id].push(m.user_id);
      counts.set(m.user_id, (counts.get(m.user_id) || 0) + 1);
    }
  }
  for (const m of eligible) {
    if (!counts.has(m.id)) items.unassigned.push(m.id);
  }

  const removalBanned = d.members.filter(m => m.removal_ban?.active).length;
  const missingProfession = eligible.filter(m => !m.profession?.trim()).length;
  const restricted = d.members.filter(m => m.account_status === 'RESTRICTED').length;

  return {
    items,
    members: eligible,
    ambiguous: eligible.filter(m => (counts.get(m.id) || 0) > 1).length,
    excluded: d.members.length - eligible.length,
    eligibilityStats: {
      total: d.members.length,
      eligibleCount: eligible.length,
      removalBanned,
      missingProfession,
      restricted,
    },
  };
}

export const shuffleWorkspaceApi = {
  async read(owner: string): Promise<ShuffleWorkspace> {
    const d = await referralTransport.get<unknown>('/admin/shuffle-workspace');
    if (!validShuffleWorkspace(d, owner)) throw Error('Grup dağılımı yanıtı geçersiz.');
    return d;
  },
  async preview(body?: { expectedRevision?: string; respectLocks?: boolean; lockedMembers?: string[]; targetPeriodKey?: string }) {
    return referralTransport.post<any>('/admin/shuffle-preview', body || {});
  },
};
