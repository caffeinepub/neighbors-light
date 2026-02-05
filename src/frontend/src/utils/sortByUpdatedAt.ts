import type { Referral, Intake } from '../backend';

/**
 * Sort items by updatedAt descending (most recent first) with deterministic tie-breaking using id.
 */
export function sortByUpdatedAt<T extends { updatedAt: bigint; id: bigint }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    // Primary sort: updatedAt descending (most recent first)
    const timeDiff = Number(b.updatedAt - a.updatedAt);
    if (timeDiff !== 0) return timeDiff;
    
    // Tie-breaker: id descending for stable ordering
    return Number(b.id - a.id);
  });
}

/**
 * Sort referrals by most recent activity (updatedAt descending).
 */
export function sortReferralsByActivity(referrals: Referral[]): Referral[] {
  return sortByUpdatedAt(referrals);
}

/**
 * Sort intakes by most recent activity (updatedAt descending).
 */
export function sortIntakesByActivity(intakes: Intake[]): Intake[] {
  return sortByUpdatedAt(intakes);
}
