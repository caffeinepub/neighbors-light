/**
 * Utility functions for calculating and formatting referral waiting time
 */

/**
 * Calculate elapsed time in milliseconds since referral creation
 */
export function getElapsedTime(createdAt: bigint): number {
  const createdAtMs = Number(createdAt) / 1000000; // Convert nanoseconds to milliseconds
  const nowMs = Date.now();
  return nowMs - createdAtMs;
}

/**
 * Format elapsed time as "Waiting X hours" or "Waiting X days"
 */
export function formatWaitingTime(createdAt: bigint): string {
  const elapsedMs = getElapsedTime(createdAt);
  const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
  
  if (elapsedHours < 24) {
    return `Waiting ${elapsedHours} ${elapsedHours === 1 ? 'hour' : 'hours'}`;
  }
  
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Waiting ${elapsedDays} ${elapsedDays === 1 ? 'day' : 'days'}`;
}

/**
 * Check if referral has been waiting more than 72 hours (updated threshold)
 */
export function isOverdue(createdAt: bigint): boolean {
  const elapsedMs = getElapsedTime(createdAt);
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
  return elapsedMs > seventyTwoHoursMs;
}
