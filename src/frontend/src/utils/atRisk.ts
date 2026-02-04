/**
 * Shared client-side risk detection utilities for visual at-risk indicators
 * All risk state is derived purely from existing fields/timestamps with no side effects
 */

import type { Referral, Intake, Bed } from '../backend';

/**
 * Check if referral has been waiting more than 72 hours (at-risk threshold)
 */
export function isReferralAtRisk(createdAt: bigint): boolean {
  const createdAtMs = Number(createdAt) / 1000000; // Convert nanoseconds to milliseconds
  const nowMs = Date.now();
  const elapsedMs = nowMs - createdAtMs;
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;
  return elapsedMs > seventyTwoHoursMs;
}

/**
 * Check if intake is active (not exited) and missing an assigned bed
 */
export function isIntakeAtRisk(intake: Intake): boolean {
  const isActive = intake.status !== 'exited';
  const hasNoBed = intake.assignedBedId === undefined || intake.assignedBedId === null;
  return isActive && hasNoBed;
}

/**
 * Check if bed is occupied (via active intake) but missing an exit date
 * Requires intake data to correlate bed assignment with exit date
 */
export function isBedAtRisk(bed: Bed, intakes: Intake[]): boolean {
  // Find active intake assigned to this bed
  const assignedIntake = intakes.find(
    (intake) =>
      intake.assignedBedId !== undefined &&
      intake.assignedBedId !== null &&
      intake.assignedBedId.toString() === bed.id.toString() &&
      intake.status !== 'exited'
  );

  if (!assignedIntake) {
    return false;
  }

  // At risk if intake has no exit date
  return assignedIntake.exitDate === undefined || assignedIntake.exitDate === null;
}

/**
 * Get human-readable at-risk label for referrals
 */
export function getReferralAtRiskLabel(): string {
  return 'Over 72 hours';
}

/**
 * Get human-readable at-risk label for intakes
 */
export function getIntakeAtRiskLabel(): string {
  return 'No bed assigned';
}

/**
 * Get human-readable at-risk label for beds
 */
export function getBedAtRiskLabel(): string {
  return 'Missing exit date';
}
