import { useGetAllReferrals, useGetAllIntakes, useGetActiveBeds } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ClipboardList, BedDouble, ArrowRight, AlertTriangle } from 'lucide-react';
import { Status, Status__1, Program } from '../backend';
import { isReferralAtRisk, isIntakeAtRisk, isBedAtRisk } from '../utils/atRisk';

interface StaffOverviewCompactProps {
  onNavigateToTab: (tab: string) => void;
}

export default function StaffOverviewCompact({ onNavigateToTab }: StaffOverviewCompactProps) {
  const { data: referrals = [], isLoading: referralsLoading } = useGetAllReferrals();
  const { data: intakes = [], isLoading: intakesLoading } = useGetAllIntakes();
  const { data: beds = [], isLoading: bedsLoading } = useGetActiveBeds();

  // Filter referrals waiting review (submitted status)
  const referralsWaitingReview = referrals.filter((r) => r.status === Status.submitted);

  // Identify at-risk referrals (>72 hours)
  const referralsWithRisk = referralsWaitingReview.map((r) => ({
    ...r,
    isAtRisk: isReferralAtRisk(r.createdAt),
  }));

  const atRiskReferrals = referralsWithRisk.filter((r) => r.isAtRisk);

  // Filter active intakes (excluding exited)
  const activeIntakes = intakes.filter((i) => i.status !== 'exited');

  // At-risk intakes: active intakes without assigned bed
  const intakesWithoutBed = activeIntakes.filter((i) => isIntakeAtRisk(i));

  // At-risk beds: occupied beds without exit date
  const bedsWithoutExitDate = beds.filter((bed) => isBedAtRisk(bed, intakes));

  // Warning: Active intakes without case manager
  const intakesWithoutCaseManager = activeIntakes.filter(
    (i) => i.caseManager === undefined || i.caseManager === null
  );

  // Group available beds by program
  const medicalStepDownBeds = beds.filter((b) => b.program === Program.medicalStepDown);
  const workforceHousingBeds = beds.filter((b) => b.program === Program.workforceHousing);

  const availableMedicalBeds = medicalStepDownBeds.filter((b) => b.status === Status__1.available).length;
  const availableWorkforceBeds = workforceHousingBeds.filter((b) => b.status === Status__1.available).length;

  // Helper to get bed number from bed ID
  const getBedNumber = (bedId: bigint | undefined): string => {
    if (!bedId) return 'N/A';
    const bed = beds.find((b) => b.id === bedId);
    return bed ? `#${bed.bedNumber}` : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Referrals Waiting Review */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Referrals Waiting Review
            {atRiskReferrals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {atRiskReferrals.length} at risk
              </Badge>
            )}
          </CardTitle>
          {referralsWaitingReview.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToTab('referrals')}
              className="gap-1 text-xs"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {referralsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : referralsWaitingReview.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals waiting review</p>
          ) : (
            <div className="space-y-3">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total waiting</span>
                <Badge variant="default" className="text-base">
                  {referralsWaitingReview.length}
                </Badge>
              </div>
              {referralsWithRisk.slice(0, 5).map((referral) => (
                <div
                  key={referral.id.toString()}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                    referral.isAtRisk ? 'border-destructive bg-destructive/5' : 'border-border'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{referral.clientName}</p>
                      {referral.isAtRisk && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {referral.partnerAgencyName}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={referral.isAtRisk ? 'destructive' : 'outline'}>
                      {referral.isAtRisk ? 'Over 72 hours' : 'Submitted'}
                    </Badge>
                  </div>
                </div>
              ))}
              {referralsWaitingReview.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToTab('referrals')}
                  className="w-full gap-1"
                >
                  +{referralsWaitingReview.length - 5} more
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* At Risk: Intakes Without Assigned Bed */}
      {intakesWithoutBed.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Intakes Without Assigned Bed
            </CardTitle>
            {intakesWithoutBed.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToTab('intakes')}
                className="gap-1 text-xs"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total at risk</span>
                <Badge variant="outline" className="text-base border-warning text-warning">
                  {intakesWithoutBed.length}
                </Badge>
              </div>
              {intakesWithoutBed.slice(0, 5).map((intake) => (
                <div
                  key={intake.id.toString()}
                  className="flex items-center justify-between rounded-lg border border-warning/50 bg-warning/5 p-3 transition-colors hover:bg-warning/10"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{intake.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Number(intake.createdAt) / 1000000).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-warning text-warning">
                    No bed assigned
                  </Badge>
                </div>
              ))}
              {intakesWithoutBed.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToTab('intakes')}
                  className="w-full gap-1"
                >
                  +{intakesWithoutBed.length - 5} more
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* At Risk: Beds Without Exit Date */}
      {bedsWithoutExitDate.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Beds Occupied Without Exit Date
            </CardTitle>
            {bedsWithoutExitDate.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToTab('beds')}
                className="gap-1 text-xs"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total at risk</span>
                <Badge variant="outline" className="text-base border-warning text-warning">
                  {bedsWithoutExitDate.length}
                </Badge>
              </div>
              {bedsWithoutExitDate.slice(0, 5).map((bed) => {
                const assignedIntake = intakes.find(
                  (i) =>
                    i.assignedBedId !== undefined &&
                    i.assignedBedId !== null &&
                    i.assignedBedId.toString() === bed.id.toString()
                );
                return (
                  <div
                    key={bed.id.toString()}
                    className="flex items-center justify-between rounded-lg border border-warning/50 bg-warning/5 p-3 transition-colors hover:bg-warning/10"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Bed #{bed.bedNumber}
                        {assignedIntake && ` - ${assignedIntake.client.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bed.program === 'medicalStepDown' ? 'Medical Step-Down' : 'Workforce Housing'}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-warning text-warning">
                      Missing exit date
                    </Badge>
                  </div>
                );
              })}
              {bedsWithoutExitDate.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToTab('beds')}
                  className="w-full gap-1"
                >
                  +{bedsWithoutExitDate.length - 5} more
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning: Intakes Without Case Manager */}
      {intakesWithoutCaseManager.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Intakes Without Case Manager
            </CardTitle>
            {intakesWithoutCaseManager.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateToTab('intakes')}
                className="gap-1 text-xs"
              >
                View all
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total cases</span>
                <Badge variant="outline" className="text-base border-warning text-warning">
                  {intakesWithoutCaseManager.length}
                </Badge>
              </div>
              {intakesWithoutCaseManager.slice(0, 5).map((intake) => (
                <div
                  key={intake.id.toString()}
                  className="flex items-center justify-between rounded-lg border border-warning/50 bg-warning/5 p-3 transition-colors hover:bg-warning/10"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{intake.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Number(intake.createdAt) / 1000000).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-warning text-warning">
                    No case manager
                  </Badge>
                </div>
              ))}
              {intakesWithoutCaseManager.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToTab('intakes')}
                  className="w-full gap-1"
                >
                  +{intakesWithoutCaseManager.length - 5} more
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Intakes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Active Intakes
          </CardTitle>
          {activeIntakes.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToTab('intakes')}
              className="gap-1 text-xs"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {intakesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : activeIntakes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active intakes</p>
          ) : (
            <div className="space-y-3">
              <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total active</span>
                <Badge variant="default" className="text-base">
                  {activeIntakes.length}
                </Badge>
              </div>
              {activeIntakes.slice(0, 5).map((intake) => (
                <div
                  key={intake.id.toString()}
                  className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{intake.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Number(intake.createdAt) / 1000000).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={intake.status === 'pending' ? 'outline' : 'secondary'}>
                    {intake.status}
                  </Badge>
                </div>
              ))}
              {activeIntakes.length > 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateToTab('intakes')}
                  className="w-full gap-1"
                >
                  +{activeIntakes.length - 5} more
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Beds by Program */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BedDouble className="h-5 w-5 text-primary" />
            Available Beds by Program
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab('beds')}
            className="gap-1 text-xs"
          >
            View details
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {bedsLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-12" />
                </div>
              ))}
            </div>
          ) : beds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active beds</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">Medical Step-Down</p>
                  <p className="text-xs text-muted-foreground">
                    {medicalStepDownBeds.length} total beds
                  </p>
                </div>
                <Badge
                  variant={availableMedicalBeds > 0 ? 'default' : 'secondary'}
                  className="text-lg font-bold"
                >
                  {availableMedicalBeds}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium">Workforce Housing</p>
                  <p className="text-xs text-muted-foreground">
                    {workforceHousingBeds.length} total beds
                  </p>
                </div>
                <Badge
                  variant={availableWorkforceBeds > 0 ? 'default' : 'secondary'}
                  className="text-lg font-bold"
                >
                  {availableWorkforceBeds}
                </Badge>
              </div>

              <div className="mt-4 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Available</span>
                  <span className="text-xl font-bold text-primary">
                    {availableMedicalBeds + availableWorkforceBeds}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
