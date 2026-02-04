import type { Referral } from '../backend';

/**
 * Derives a unique, sorted list of program names from referrals
 */
export function getUniqueProgramOptions(referrals: Referral[]): string[] {
  const programs = new Set<string>();
  referrals.forEach(r => {
    if (r.programRequested) {
      programs.add(r.programRequested);
    }
  });
  return Array.from(programs).sort();
}

/**
 * Filters referrals by exact program match
 */
export function filterByProgram(referrals: Referral[], program: string | null): Referral[] {
  if (!program || program === 'all') {
    return referrals;
  }
  return referrals.filter(r => r.programRequested === program);
}

/**
 * Filters referrals by submission date range (inclusive)
 * Dates are compared at day boundaries
 */
export function filterByDateRange(
  referrals: Referral[],
  startDate: Date | null,
  endDate: Date | null
): Referral[] {
  if (!startDate && !endDate) {
    return referrals;
  }

  return referrals.filter(r => {
    // Convert nanoseconds to milliseconds
    const submissionDate = new Date(Number(r.createdAt) / 1000000);
    
    // Set to start of day for comparison
    const submissionDay = new Date(submissionDate.getFullYear(), submissionDate.getMonth(), submissionDate.getDate());
    
    if (startDate && endDate) {
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      return submissionDay >= start && submissionDay <= end;
    }
    
    if (startDate) {
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      return submissionDay >= start;
    }
    
    if (endDate) {
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      return submissionDay <= end;
    }
    
    return true;
  });
}

/**
 * Applies all filters with AND logic
 */
export function applyAllFilters(
  referrals: Referral[],
  statusFilter: string,
  programFilter: string | null,
  startDate: Date | null,
  endDate: Date | null
): Referral[] {
  let filtered = referrals;
  
  // Apply status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === statusFilter);
  }
  
  // Apply program filter
  filtered = filterByProgram(filtered, programFilter);
  
  // Apply date range filter
  filtered = filterByDateRange(filtered, startDate, endDate);
  
  return filtered;
}
