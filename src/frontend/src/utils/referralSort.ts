import type { Referral, Status } from '../backend';

export type SortMode = 'submissionDate' | 'status';

// Define explicit status rank order for deterministic sorting
const STATUS_RANK: Record<Status, number> = {
  submitted: 1,
  needsInfo: 2,
  waitlisted: 3,
  approved: 4,
  declined: 5,
};

/**
 * Sort referrals by the selected mode with stable tie-breakers
 * @param referrals - Array of referrals to sort
 * @param mode - Sort mode: 'submissionDate' or 'status'
 * @returns Sorted array of referrals
 */
export function sortReferrals(referrals: Referral[], mode: SortMode): Referral[] {
  return [...referrals].sort((a, b) => {
    if (mode === 'status') {
      // Primary sort: status rank
      const rankA = STATUS_RANK[a.status];
      const rankB = STATUS_RANK[b.status];
      
      if (rankA !== rankB) {
        return rankA - rankB;
      }
      
      // Tie-breaker: submission date descending (newest first)
      const dateCompare = Number(b.createdAt) - Number(a.createdAt);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      
      // Final tie-breaker: ID descending for deterministic ordering
      return Number(b.id) - Number(a.id);
    }
    
    // Default: submission date descending (newest first)
    const dateCompare = Number(b.createdAt) - Number(a.createdAt);
    if (dateCompare !== 0) {
      return dateCompare;
    }
    
    // Tie-breaker: ID descending for deterministic ordering
    return Number(b.id) - Number(a.id);
  });
}
