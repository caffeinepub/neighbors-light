import { useMemo } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetAllReferrals, useGetAllIntakes, useGetAllUsers } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Users, AlertTriangle } from 'lucide-react';
import { Status } from '../backend';
import { sortReferralsByActivity, sortIntakesByActivity } from '../utils/sortByUpdatedAt';
import { getUserDisplayName } from '../utils/userDisplay';

export default function StaffMyWorkTab() {
  const { identity } = useInternetIdentity();
  const { data: referrals = [], isLoading: referralsLoading } = useGetAllReferrals();
  const { data: intakes = [], isLoading: intakesLoading } = useGetAllIntakes();
  const { data: allUsers = [] } = useGetAllUsers();

  const currentPrincipal = identity?.getPrincipal().toString();

  // Filter intakes assigned to the logged-in user (caseManager)
  const myIntakes = useMemo(() => {
    if (!currentPrincipal) return [];
    const filtered = intakes.filter(
      (intake) =>
        intake.caseManager !== undefined &&
        intake.caseManager !== null &&
        intake.caseManager.toString() === currentPrincipal
    );
    return sortIntakesByActivity(filtered);
  }, [intakes, currentPrincipal]);

  // Filter referrals assigned to the logged-in user with status 'submitted'
  const myReferrals = useMemo(() => {
    if (!currentPrincipal) return [];
    const filtered = referrals.filter(
      (referral) =>
        referral.assignedStaff !== undefined &&
        referral.assignedStaff !== null &&
        referral.assignedStaff.toString() === currentPrincipal &&
        referral.status === Status.submitted
    );
    return sortReferralsByActivity(filtered);
  }, [referrals, currentPrincipal]);

  // Helper to format date
  const formatDate = (timestamp: bigint): string => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  // Helper to format date and time
  const formatDateTime = (timestamp: bigint): string => {
    return new Date(Number(timestamp) / 1000000).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* My Intakes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ClipboardList className="h-6 w-6 text-primary" />
            My Intakes
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Intakes assigned to you as case manager
          </p>
        </CardHeader>
        <CardContent>
          {intakesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : myIntakes.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No intakes are currently assigned to you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm font-medium">Total assigned</span>
                <Badge variant="default" className="text-base">
                  {myIntakes.length}
                </Badge>
              </div>
              {myIntakes.map((intake) => (
                <div
                  key={intake.id.toString()}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold">{intake.client.name}</p>
                      {intake.status !== 'exited' && !intake.assignedBedId && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {formatDate(intake.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {formatDateTime(intake.updatedAt)}
                      {intake.lastUpdatedBy && (
                        <span className="ml-1">
                          by {getUserDisplayName(intake.lastUpdatedBy, allUsers)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Badge
                      variant={
                        intake.status === 'pending'
                          ? 'outline'
                          : intake.status === 'exited'
                            ? 'secondary'
                            : 'default'
                      }
                    >
                      {intake.status}
                    </Badge>
                    {!intake.assignedBedId && intake.status !== 'exited' && (
                      <Badge variant="outline" className="border-warning text-warning">
                        No bed assigned
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Referrals Awaiting Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6 text-primary" />
            My Referrals Awaiting Review
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Referrals assigned to you with submitted status
          </p>
        </CardHeader>
        <CardContent>
          {referralsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : myReferrals.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                No referrals are currently assigned to you for review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm font-medium">Total awaiting review</span>
                <Badge variant="default" className="text-base">
                  {myReferrals.length}
                </Badge>
              </div>
              {myReferrals.map((referral) => (
                <div
                  key={referral.id.toString()}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-semibold">{referral.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {referral.partnerAgencyName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Program: {referral.programRequested}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted: {formatDate(referral.createdAt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {formatDateTime(referral.updatedAt)}
                      {referral.lastUpdatedBy && (
                        <span className="ml-1">
                          by {getUserDisplayName(referral.lastUpdatedBy, allUsers)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Badge variant="outline">Submitted</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
