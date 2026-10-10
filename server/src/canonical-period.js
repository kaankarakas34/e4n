/**
 * Canonical 4-Month Period (Trimester) calculations for E4N.
 * R05: 3 periods per calendar year (4 months each):
 *   T1: Jan 1 00:00:00 UTC - Apr 30 23:59:59.999 UTC
 *   T2: May 1 00:00:00 UTC - Aug 31 23:59:59.999 UTC
 *   T3: Sep 1 00:00:00 UTC - Dec 31 23:59:59.999 UTC
 *
 * D06 rule: Payment cutoff is 1 calendar day before period end (24h before period end).
 */

const PERIOD_LABELS = {
  1: '1. Dönem (Ocak - Nisan)',
  2: '2. Dönem (Mayıs - Ağustos)',
  3: '3. Dönem (Eylül - Aralık)',
};

const END_DAYS = {
  1: 30, // April
  2: 31, // August
  3: 31, // December
};

export function getCanonicalPeriod(date = new Date()) {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (!Number.isFinite(d.getTime())) throw new TypeError('Invalid date passed to getCanonicalPeriod');

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth(); // 0-11

  let trimester;
  let startMonth;
  let endMonth;

  if (month < 4) {
    trimester = 1;
    startMonth = 0; // Jan
    endMonth = 3;   // Apr
  } else if (month < 8) {
    trimester = 2;
    startMonth = 4; // May
    endMonth = 7;   // Aug
  } else {
    trimester = 3;
    startMonth = 8; // Sep
    endMonth = 11;  // Dec
  }

  const endDay = END_DAYS[trimester];
  const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, endMonth, endDay, 23, 59, 59, 999));
  // Cutoff is 24 hours (1 calendar day) before the period ends
  const cutoffDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
  const now = d.getTime();

  return {
    periodKey: `${year}-T${trimester}`,
    year,
    trimester,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    cutoffDate: cutoffDate.toISOString(),
    isCutoffPassed: now >= cutoffDate.getTime(),
    label: `${year} ${PERIOD_LABELS[trimester]}`,
  };
}

export function parseCanonicalPeriod(periodKey) {
  if (typeof periodKey !== 'string') return null;
  const match = periodKey.trim().match(/^(\d{4})-T([1-3])$/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const trimester = parseInt(match[2], 10);
  const startMonth = (trimester - 1) * 4;
  const endMonth = startMonth + 3;
  const endDay = END_DAYS[trimester];

  const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, endMonth, endDay, 23, 59, 59, 999));
  const cutoffDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  return {
    periodKey: `${year}-T${trimester}`,
    year,
    trimester,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    cutoffDate: cutoffDate.toISOString(),
    label: `${year} ${PERIOD_LABELS[trimester]}`,
  };
}

export function getPreviousCanonicalPeriod(periodKey) {
  const p = parseCanonicalPeriod(periodKey);
  if (!p) return null;
  if (p.trimester === 1) {
    return `${p.year - 1}-T3`;
  }
  return `${p.year}-T${p.trimester - 1}`;
}

export function getNextCanonicalPeriod(periodKey) {
  const p = parseCanonicalPeriod(periodKey);
  if (!p) return null;
  if (p.trimester === 3) {
    return `${p.year + 1}-T1`;
  }
  return `${p.year}-T${p.trimester + 1}`;
}

/**
 * Evaluates shuffle candidate eligibility for an individual member.
 *
 * Rules:
 * - ADMIN: excluded (not a candidate)
 * - account_status: must be ACTIVE (RESTRICTED or SUSPENDED is ineligible)
 * - removal_ban (P24): 2nd removal 8-month (240 days) ban blocks participation
 * - subscription (D06): active plan through cutoff date
 * - profession: must be specified and non-empty
 */
export function evaluateShuffleEligibility(member, { cutoffDate, now = new Date() } = {}) {
  const reasons = [];
  const nowDate = typeof now === 'string' || typeof now === 'number' ? new Date(now) : now;

  // 1. Admin Exclusion
  if (member.role === 'ADMIN') {
    return {
      isEligible: false,
      category: 'EXCLUDED',
      reasons: ['EXCLUDED_ADMIN'],
      detail: 'Yönetici hesapları shuffle aday havuzuna dahil edilmez.',
      removalBan: { active: false, daysLeft: 0 },
    };
  }

  // 2. Account Status check
  if (member.account_status === 'RESTRICTED') {
    reasons.push({
      code: 'INELIGIBLE_ACCOUNT_RESTRICTED',
      detail: 'Ödeme gecikmesi nedeniyle hesap kısıtlıdır (D07).',
    });
  } else if (member.account_status && member.account_status !== 'ACTIVE') {
    reasons.push({
      code: 'INELIGIBLE_ACCOUNT_INACTIVE',
      detail: `Hesap durumu aktif değildir (${member.account_status}).`,
    });
  }

  // 3. Removal Ban check (P24)
  let removalBan = { active: false, daysLeft: 0, bannedUntil: null };
  const count = Number(member.removal_count || 0);
  if (count >= 2 && member.last_removed_at) {
    const lastDate = new Date(member.last_removed_at);
    if (Number.isFinite(lastDate.getTime())) {
      const daysSince = (nowDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 240) {
        const daysLeft = Math.ceil(240 - daysSince);
        const bannedUntil = new Date(lastDate.getTime() + 240 * 24 * 60 * 60 * 1000).toISOString();
        removalBan = { active: true, daysLeft, bannedUntil, removalCount: count };
        reasons.push({
          code: 'INELIGIBLE_REMOVAL_BAN',
          detail: `İki kez çıkarılma nedeniyle 8 aylık grup yasağı aktiftir (Kalan süre: ${daysLeft} gün).`,
        });
      }
    }
  }

  // 4. Missing Profession
  if (!member.profession || !member.profession.trim()) {
    reasons.push({
      code: 'MISSING_PROFESSION',
      detail: 'Meslek bilgisi eksik olduğu için dağıtıma dahil edilemez.',
    });
  }

  // 5. Subscription Cutoff (D06)
  if (cutoffDate && member.subscription_end_date) {
    const subEnd = new Date(member.subscription_end_date);
    const cutoff = new Date(cutoffDate);
    if (subEnd.getTime() < cutoff.getTime()) {
      reasons.push({
        code: 'INELIGIBLE_SUBSCRIPTION_UNPAID',
        detail: 'Shuffle kesim tarihine kadar geçerli abonelik bulunmamaktadır.',
      });
    }
  }

  const isEligible = reasons.length === 0;
  return {
    isEligible,
    category: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
    reasons: reasons.map(r => r.code),
    details: reasons.map(r => r.detail),
    removalBan,
  };
}
