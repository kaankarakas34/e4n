
export interface Member {
    id: string;
    name: string;
    full_name: string;
    profession: string;
    previous_group_id?: string;
}

export interface Group {
    id: string;
    name: string;
}

export interface ShuffleConfig {
    respectLocks: boolean;
    minimizeOverlap: boolean;
    maxAttempts: number;
}

/**
 * Perform a weighted shuffle distribution.
 */
export function distributeMembers(
    allMembers: Member[],
    groups: Group[],
    currentDistribution: Record<string, string[]>,
    lockedMembers: string[],
    config: ShuffleConfig
): Record<string, string[]> {
    const newDistribution: Record<string, string[]> = {};
    groups.forEach(g => newDistribution[g.id] = []);
    newDistribution['unassigned'] = [];

    // Frequency Analysis
    const professionCounts: Record<string, number> = {};
    allMembers.forEach(m => {
        professionCounts[m.profession] = (professionCounts[m.profession] || 0) + 1;
    });

    // Separation: Locked vs Free
    const freeMembers: Member[] = [];
    const placedMemberIds = new Set<string>();

    // 1. Place Locked Members First (Strictly respect current location if locked)
    if (config.respectLocks) {
        for (const groupId in currentDistribution) {
            if (groupId === 'unassigned') continue;
            currentDistribution[groupId].forEach(memberId => {
                const member = allMembers.find(m => m.id === memberId);
                if (member && lockedMembers.includes(memberId)) {
                    // Check if group exists in new run (it should)
                    if (newDistribution[groupId]) {
                        newDistribution[groupId].push(memberId);
                        placedMemberIds.add(memberId);
                    }
                }
            });
        }
    }

    // 2. Identify Free Members
    allMembers.forEach(m => {
        if (!placedMemberIds.has(m.id)) {
            freeMembers.push(m);
        }
    });

    // 3. Sort Free Members by "Most Restricted First" (High Frequency Profession -> Harder to place)
    freeMembers.sort((a, b) => {
        const countA = professionCounts[a.profession] || 0;
        const countB = professionCounts[b.profession] || 0;
        if (countA !== countB) return countB - countA; // Descending frequency
        return Math.random() - 0.5; // Random tie-break
    });

    // 4. Distribute
    for (const member of freeMembers) {
        let bestGroupId: string | null = null;
        let minScore = Infinity;

        // Try every group with random order to avoid filling first groups unfairly
        const shuffledGroups = [...groups].sort(() => Math.random() - 0.5);

        for (const group of shuffledGroups) {
            const groupMemberIds = newDistribution[group.id];
            const groupMembers = groupMemberIds.map(id => allMembers.find(m => m.id === id)).filter((m): m is Member => !!m);

            // HARD CONSTRAINT: Profession Conflict
            // Strict check: if anyone in this group has the same profession, REJECT.
            const hasProfessionConflict = groupMembers.some(m => m.profession === member.profession);
            if (hasProfessionConflict) continue;

            // Calculate Score (Lower is better)
            let score = 0;

            // Balance Size (prefer filling smaller groups)
            score += groupMembers.length * 10;

            // Minimize Overlap (History)
            if (config.minimizeOverlap && member.previous_group_id) {
                const overlap = groupMembers.filter(m => m.previous_group_id === member.previous_group_id).length;
                score += overlap * 50;
            }

            if (score < minScore) {
                minScore = score;
                bestGroupId = group.id;
            }
        }

        if (bestGroupId) {
            newDistribution[bestGroupId].push(member.id);
        } else {
            // Cannot place without conflict -> Unassigned
            newDistribution['unassigned'].push(member.id);
        }
    }

    return newDistribution;
}
