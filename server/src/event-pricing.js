/**
 * Event Ticket Entitlement and Member Pricing Engine (E4N-97 / P25)
 *
 * Implements business rules R02, R12, D07:
 * - R02 & R12: An active E4N member (account_status === 'ACTIVE') retains rights
 *   to public/external events and member-discounted/free tickets even if they were
 *   removed from a closed group (group_members.status === 'INACTIVE') or have not yet
 *   been assigned to any group.
 * - Server-side authoritative pricing: Client cannot send ticket price or payment_status.
 * - Meeting/visitor networking events: Free for active members (effectivePrice: 0, payment_status: 'FREE').
 * - Paid social/education events: 50% member discount (effectivePrice: price * 0.5, payment_status: 'PENDING').
 * - Restricted/Suspended/Inactive accounts: No member privilege, standard price applies.
 * - Closed group events (is_public === false and group_id is set): Restricted to active group members.
 */

export function isUserActiveMember(user) {
  if (!user || typeof user !== 'object') return false;
  return user.account_status === 'ACTIVE' && user.role !== 'ANON';
}

export function isExternalEvent(event) {
  if (!event || typeof event !== 'object') return false;
  return event.is_public === true || !event.group_id;
}

export function evaluateEventTicketEntitlement({ user, event, groupMembership = null }) {
  if (!event || typeof event !== 'object') {
    throw new Error('Event object is required for entitlement evaluation');
  }

  const standardPrice = Number.isFinite(Number(event.price)) && Number(event.price) >= 0
    ? Number(event.price)
    : 0;

  const external = isExternalEvent(event);
  const activeMember = isUserActiveMember(user);
  const isRestricted = user?.account_status === 'RESTRICTED';
  const isSuspended = user?.account_status === 'SUSPENDED';

  // 1. Access Evaluation
  // Closed group event: only active members of that specific group can access/register
  if (!external) {
    const isGroupActive = groupMembership && groupMembership.status === 'ACTIVE';
    const isAdmin = user?.role === 'ADMIN';

    if (!isGroupActive && !isAdmin) {
      return {
        canAccess: false,
        accessCode: 'CLOSED_GROUP_RESTRICTED',
        accessError: 'Bu kapalı grup etkinliğine yalnızca grup üyeleri katılabilir.',
        hasMemberPrivilege: false,
        entitlementReason: 'CLOSED_GROUP_NON_MEMBER',
        standardPrice,
        memberPrice: null,
        effectivePrice: standardPrice,
        discountAmount: 0,
        isFreeForMember: false,
        ticketPaymentStatus: standardPrice > 0 ? 'PENDING' : 'FREE'
      };
    }
  }

  // 2. Member Privilege & Pricing Calculation
  // R02 & R12: For external/public events, an active member retains full privileges
  // regardless of group removal (INACTIVE in group_members) or lack of group assignment.
  if (activeMember) {
    let memberPrice = standardPrice;
    let discountAmount = 0;
    let isFreeForMember = standardPrice === 0;

    if (standardPrice > 0) {
      // Meeting and visitor events are free for active E4N members
      if (event.type === 'meeting' || event.type === 'visitor') {
        memberPrice = 0;
        discountAmount = standardPrice;
        isFreeForMember = true;
      } else {
        // Education, social, and other events have a standard 50% member discount
        discountAmount = Math.round(standardPrice * 0.5);
        memberPrice = Math.max(0, standardPrice - discountAmount);
        isFreeForMember = memberPrice === 0;
      }
    }

    const effectivePrice = memberPrice;
    const ticketPaymentStatus = effectivePrice > 0 ? 'PENDING' : 'FREE';

    return {
      canAccess: true,
      hasMemberPrivilege: true,
      entitlementReason: 'ACTIVE_MEMBERSHIP',
      standardPrice,
      memberPrice,
      effectivePrice,
      discountAmount,
      isFreeForMember,
      ticketPaymentStatus
    };
  }

  // Non-member or restricted account pricing
  const entitlementReason = isRestricted
    ? 'RESTRICTED_ACCOUNT'
    : isSuspended
      ? 'SUSPENDED_ACCOUNT'
      : (user ? 'INACTIVE_ACCOUNT' : 'ANONYMOUS');

  const ticketPaymentStatus = standardPrice > 0 ? 'PENDING' : 'FREE';

  return {
    canAccess: true,
    hasMemberPrivilege: false,
    entitlementReason,
    standardPrice,
    memberPrice: null,
    effectivePrice: standardPrice,
    discountAmount: 0,
    isFreeForMember: standardPrice === 0,
    ticketPaymentStatus
  };
}
