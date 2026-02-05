import type { Principal } from '@dfinity/principal';

/**
 * Resolves a principal to a user display string.
 * Returns the user's name if available, otherwise a shortened principal string.
 * Returns "System" when the principal is null/undefined.
 */
export function getUserDisplayName(
  principalId: Principal | undefined | null,
  allUsers: Array<[Principal, { name: string }]>
): string {
  if (!principalId) return 'System';
  
  const user = allUsers.find(([p]) => p.toString() === principalId.toString());
  if (user && user[1].name) {
    return user[1].name;
  }
  
  return principalId.toString().slice(0, 8) + '...';
}
