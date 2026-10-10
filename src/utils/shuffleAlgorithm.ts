export interface Member {
  id: string;
  name: string;
  full_name: string;
  profession: string;
  previous_group_id?: string | null;
}

export interface Group {
  id: string;
  name: string;
}

export interface ShuffleConfig {
  respectLocks: boolean;
  minimizeOverlap: boolean;
  maxAttempts: number;
  maxCapacity?: number;
}

export interface UnassignedReportItem {
  id: string;
  name: string;
  profession: string;
  reason: 'PROFESSION_CONFLICT' | 'CAPACITY_FULL' | 'LOCKED_CONFLICT' | 'LOCKED_OVERFLOW';
  details: string;
}

export interface ShuffleDistributionResult {
  distribution: Record<string, string[]>;
  unassignedReport: UnassignedReportItem[];
  stats: {
    total: number;
    assigned: number;
    unassigned: number;
    groupCounts: Record<string, number>;
  };
}

const normalize = (p: string) => (typeof p === 'string' ? p.trim().toLowerCase() : '');

/**
 * Enhanced distribution algorithm that respects:
 * 1. D09: Hard limit of 35 members per group.
 * 2. Strict Profession Conflict: No duplicate normalized professions in any group.
 * 3. Lock preservation: Locks are validated against capacity and duplicate professions.
 * 4. Previous group history: Minimizes overlap and avoids placing back into exact same previous group.
 */
export function distributeMembersWithReport(
  allMembers: Member[],
  groups: Group[],
  currentDistribution: Record<string, string[]>,
  lockedMembers: string[],
  config: ShuffleConfig
): ShuffleDistributionResult {
  const newDistribution: Record<string, string[]> = {};
  groups.forEach(g => { newDistribution[g.id] = []; });
  newDistribution['unassigned'] = [];

  const maxCap = config.maxCapacity ?? 35;
  const unassignedReport: UnassignedReportItem[] = [];
  const groupMap = new Map(groups.map(g => [g.id, g]));
  const lockSet = new Set(lockedMembers.map(id => id.toLowerCase()));

  // Frequency Analysis
  const professionCounts: Record<string, number> = {};
  allMembers.forEach(m => {
    const prof = normalize(m.profession);
    if (prof) {
      professionCounts[prof] = (professionCounts[prof] || 0) + 1;
    }
  });

  const placedMemberIds = new Set<string>();

  // 1. Place Locked Members First (strictly validate capacity and profession uniqueness)
  if (config.respectLocks && Object.keys(currentDistribution).length) {
    for (const groupId in currentDistribution) {
      if (groupId === 'unassigned' || !newDistribution[groupId]) continue;

      currentDistribution[groupId].forEach(memberId => {
        if (!lockSet.has(memberId.toLowerCase())) return;
        const member = allMembers.find(m => m.id.toLowerCase() === memberId.toLowerCase());
        if (!member) return;

        // Check group capacity
        if (newDistribution[groupId].length >= maxCap) {
          newDistribution['unassigned'].push(member.id);
          unassignedReport.push({
            id: member.id,
            name: member.full_name || member.name,
            profession: member.profession,
            reason: 'LOCKED_OVERFLOW',
            details: `'${groupMap.get(groupId)?.name || groupId}' grubu 35 kişi sınırına ulaştığı için kilit korunamadı.`,
          });
          placedMemberIds.add(member.id);
          return;
        }

        // Check profession conflict
        const prof = normalize(member.profession);
        const existingMembers = newDistribution[groupId]
          .map(id => allMembers.find(m => m.id === id))
          .filter((m): m is Member => !!m);

        const hasConflict = existingMembers.some(m => normalize(m.profession) === prof);
        if (hasConflict) {
          newDistribution['unassigned'].push(member.id);
          unassignedReport.push({
            id: member.id,
            name: member.full_name || member.name,
            profession: member.profession,
            reason: 'LOCKED_CONFLICT',
            details: `'${groupMap.get(groupId)?.name || groupId}' grubunda aynı meslekten kilitli başka üye mevcut.`,
          });
          placedMemberIds.add(member.id);
          return;
        }

        newDistribution[groupId].push(member.id);
        placedMemberIds.add(member.id);
      });
    }
  }

  // 2. Identify Free Members
  const freeMembers: Member[] = [];
  allMembers.forEach(m => {
    if (!placedMemberIds.has(m.id)) {
      freeMembers.push(m);
    }
  });

  // 3. Sort Free Members by "Most Restricted First" (High Frequency Profession -> Harder to place)
  freeMembers.sort((a, b) => {
    const countA = professionCounts[normalize(a.profession)] || 0;
    const countB = professionCounts[normalize(b.profession)] || 0;
    if (countA !== countB) return countB - countA;
    return a.id.localeCompare(b.id);
  });

  // 4. Distribute Free Members
  for (const member of freeMembers) {
    const memberProf = normalize(member.profession);
    let bestGroupId: string | null = null;
    let minScore = Infinity;

    let conflictCount = 0;
    let fullCount = 0;

    for (const group of groups) {
      const groupMemberIds = newDistribution[group.id];

      // HARD CONSTRAINT: Capacity limit (maxCap <= 35)
      if (groupMemberIds.length >= maxCap) {
        fullCount += 1;
        continue;
      }

      // HARD CONSTRAINT: Strict Profession Conflict
      const groupMembers = groupMemberIds
        .map(id => allMembers.find(m => m.id === id))
        .filter((m): m is Member => !!m);

      const hasProfessionConflict = groupMembers.some(
        m => normalize(m.profession) === memberProf
      );
      if (hasProfessionConflict) {
        conflictCount += 1;
        continue;
      }

      // Score calculation
      let score = 0;

      // Balance Size (prefer filling smaller groups)
      score += groupMembers.length * 10;

      // Minimize Overlap (History)
      if (config.minimizeOverlap && member.previous_group_id) {
        const overlap = groupMembers.filter(m => m.previous_group_id === member.previous_group_id).length;
        score += overlap * 50;

        // Rotation encouragement: penalty for staying in exact same group
        if (member.previous_group_id === group.id) {
          score += 100;
        }
      }

      if (score < minScore) {
        minScore = score;
        bestGroupId = group.id;
      }
    }

    if (bestGroupId) {
      newDistribution[bestGroupId].push(member.id);
    } else {
      newDistribution['unassigned'].push(member.id);
      let reason: UnassignedReportItem['reason'] = 'PROFESSION_CONFLICT';
      let details = `Bu meslek (${member.profession}) için müsait gruplarda meslek çakışması mevcut.`;

      if (fullCount === groups.length) {
        reason = 'CAPACITY_FULL';
        details = 'Tüm gruplar 35 kişi sınırına ulaşmıştır.';
      }

      unassignedReport.push({
        id: member.id,
        name: member.full_name || member.name,
        profession: member.profession,
        reason,
        details,
      });
    }
  }

  const groupCounts: Record<string, number> = {};
  let totalAssigned = 0;
  groups.forEach(g => {
    groupCounts[g.id] = newDistribution[g.id].length;
    totalAssigned += groupCounts[g.id];
  });

  return {
    distribution: newDistribution,
    unassignedReport,
    stats: {
      total: allMembers.length,
      assigned: totalAssigned,
      unassigned: newDistribution['unassigned'].length,
      groupCounts,
    },
  };
}

/**
 * Standard distributeMembers matching original signature.
 */
export function distributeMembers(
  allMembers: Member[],
  groups: Group[],
  currentDistribution: Record<string, string[]>,
  lockedMembers: string[],
  config: ShuffleConfig
): Record<string, string[]> {
  const result = distributeMembersWithReport(
    allMembers,
    groups,
    currentDistribution,
    lockedMembers,
    config
  );
  return result.distribution;
}
