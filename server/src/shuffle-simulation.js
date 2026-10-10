/**
 * Shuffle Simulation & Distribution Engine (E4N-100 / P28)
 *
 * Hard Constraints:
 * 1. D09: Maximum 35 capacity per group. Under no circumstances can any group exceed 35.
 * 2. Strict Profession Conflict: No group can contain more than 1 member with the same profession.
 * 3. Lock Respect: Respect locked members in their designated group provided constraints are satisfied.
 *
 * Soft Constraints / Optimization:
 * 1. Most Constrained First: Candidates with high-frequency professions are placed first.
 * 2. Overlap Minimization: Penalize placing members with the same previous_group_id into the same group.
 * 3. Rotation Encouragement: Penalize placing a member back into their own previous_group_id.
 * 4. Capacity Balancing: Balance group sizes evenly.
 */

const normalizeProfession = p => (typeof p === 'string' ? p.trim().toLowerCase() : '');

export function simulateDistribution(
  members,
  groups,
  {
    currentDistribution = {},
    lockedMembers = [],
    respectLocks = true,
    minimizeOverlap = true,
    maxCapacity = 35,
  } = {}
) {
  const assignments = {};
  for (const g of groups) assignments[g.id] = [];
  const unassigned = [];
  const unassignedReport = [];

  const lockSet = new Set(lockedMembers.map(id => String(id).toLowerCase()));
  const groupMap = new Map(groups.map(g => [g.id, g]));

  // Frequency analysis of professions across all candidates
  const professionCounts = new Map();
  for (const m of members) {
    const prof = normalizeProfession(m.profession);
    if (prof) {
      professionCounts.set(prof, (professionCounts.get(prof) || 0) + 1);
    }
  }

  const placedIds = new Set();

  // 1. Place Locked Members First (if respectLocks enabled)
  if (respectLocks && Object.keys(currentDistribution).length) {
    for (const [groupId, memberIds] of Object.entries(currentDistribution)) {
      if (groupId === 'unassigned' || !assignments[groupId]) continue;

      for (const memberId of memberIds) {
        if (!lockSet.has(memberId.toLowerCase())) continue;
        const member = members.find(m => m.id.toLowerCase() === memberId.toLowerCase());
        if (!member) continue;

        const currentGroupMembers = assignments[groupId].map(id =>
          members.find(m => m.id === id)
        ).filter(Boolean);

        // Check Hard Constraint: Capacity <= 35
        if (assignments[groupId].length >= maxCapacity) {
          unassigned.push(member.id);
          unassignedReport.push({
            id: member.id,
            full_name: member.full_name,
            profession: member.profession,
            reason: 'LOCKED_CAPACITY_OVERFLOW',
            details: `Kilitli üye yerleştirilemedi: '${groupMap.get(groupId)?.name || groupId}' grubu 35 kapasitesine ulaştı.`,
          });
          placedIds.add(member.id);
          continue;
        }

        // Check Hard Constraint: Profession conflict
        const prof = normalizeProfession(member.profession);
        const hasConflict = currentGroupMembers.some(
          m => normalizeProfession(m.profession) === prof
        );

        if (hasConflict) {
          unassigned.push(member.id);
          unassignedReport.push({
            id: member.id,
            full_name: member.full_name,
            profession: member.profession,
            reason: 'LOCKED_PROFESSION_CONFLICT',
            details: `Kilitli üye yerleştirilemedi: '${groupMap.get(groupId)?.name || groupId}' grubunda aynı meslekten (${member.profession}) kilitli başka bir üye mevcut.`,
          });
          placedIds.add(member.id);
          continue;
        }

        assignments[groupId].push(member.id);
        placedIds.add(member.id);
      }
    }
  }

  // 2. Identify Free Members
  const freeMembers = members.filter(m => !placedIds.has(m.id));

  // 3. Sort Free Members by "Most Constrained First" (High frequency profession -> harder to place)
  // Deterministic tie-breaker by ID/name
  freeMembers.sort((a, b) => {
    const profA = normalizeProfession(a.profession);
    const profB = normalizeProfession(b.profession);
    const countA = professionCounts.get(profA) || 0;
    const countB = professionCounts.get(profB) || 0;
    if (countA !== countB) return countB - countA;
    return a.id.localeCompare(b.id);
  });

  // 4. Distribute Free Members
  for (const member of freeMembers) {
    const memberProf = normalizeProfession(member.profession);
    let bestGroupId = null;
    let minScore = Infinity;

    // Evaluate each group for this candidate
    let conflictCount = 0;
    let fullCount = 0;

    for (const group of groups) {
      const groupMemberIds = assignments[group.id];

      // Hard Constraint: Capacity limit
      if (groupMemberIds.length >= maxCapacity) {
        fullCount += 1;
        continue;
      }

      // Hard Constraint: Profession Uniqueness
      const groupMembers = groupMemberIds
        .map(id => members.find(m => m.id === id))
        .filter(Boolean);

      const hasProfessionConflict = groupMembers.some(
        m => normalizeProfession(m.profession) === memberProf
      );

      if (hasProfessionConflict) {
        conflictCount += 1;
        continue;
      }

      // Calculate score (lower score is preferred)
      let score = 0;

      // Group size balance (prefer smaller groups)
      score += groupMembers.length * 10;

      // History overlap minimization
      if (minimizeOverlap && member.previous_group_id) {
        // Penalize placing into group that already has members from same previous group
        const samePreviousGroupCount = groupMembers.filter(
          m => m.previous_group_id && m.previous_group_id === member.previous_group_id
        ).length;
        score += samePreviousGroupCount * 50;

        // Penalize placing back into the exact same group
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
      assignments[bestGroupId].push(member.id);
    } else {
      unassigned.push(member.id);
      let reason = 'PROFESSION_CONFLICT';
      let details = `Bu meslek (${member.profession}) için müsait olan tüm gruplarda meslek çakışması mevcut.`;

      if (fullCount === groups.length) {
        reason = 'CAPACITY_FULL';
        details = 'Tüm gruplar 35 kişi sınırına ulaşmıştır.';
      } else if (conflictCount > 0 && fullCount > 0) {
        reason = 'PROFESSION_OR_CAPACITY_CONFLICT';
        details = 'Grupların bir kısmı dolu, kalan gruplarda ise meslek çakışması mevcuttur.';
      }

      unassignedReport.push({
        id: member.id,
        full_name: member.full_name,
        profession: member.profession,
        reason,
        details,
      });
    }
  }

  // 5. Build Stats & Verification
  const groupCounts = {};
  let totalAssigned = 0;
  for (const [gid, list] of Object.entries(assignments)) {
    groupCounts[gid] = list.length;
    totalAssigned += list.length;
  }

  return {
    assignments,
    unassigned,
    unassignedReport,
    stats: {
      totalCandidates: members.length,
      assignedCount: totalAssigned,
      unassignedCount: unassigned.length,
      groupCounts,
      capacityViolations: Object.values(groupCounts).filter(c => c > maxCapacity).length,
    },
  };
}
