import { useGetAllReferrals, useGetAllIntakes, useGetActiveBeds } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, ClipboardList, BedDouble, ArrowRight, AlertTriangle, UserX, FileCheck } from 'lucide-react';
import { Status } from '../backend';
import { isReferralAtRisk, isIntakeAtRisk, isBedAtRisk } from '../utils/atRisk';

interface AdminRiskOverviewCompactProps {
  onNavigateToTab: (tab: string) => void;
}

export default function AdminRiskOverviewCompact({ onNavigateToTab }: AdminRiskOverviewCompactProps) {
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

  // Warning: Approved referrals not converted to intakes
  const approvedNotConverted = referrals.filter(
    (r) => r.status === Status.approved && !r.convertedIntakeId
  );

  const isLoading = referralsLoading || intakesLoading || bedsLoading;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <h2 className="mb-2 text-lg font-semibold text-foreground">Operational Risk Overview</h2>
        <p className="text-sm text-muted-foreground">
          Quick view of items requiring immediate attention across referrals, intakes, and beds
        </p>
      </div>

      {/* Referrals Waiting Review */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Referrals Waiting Review
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab('referrals')}
            className="gap-1 text-xs"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : referralsWaitingReview.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals waiting review</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total waiting</span>
                <Badge variant="default">{referralsWaitingReview.length}</Badge>
              </div>
              {atRiskReferrals.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-destructive bg-destructive/5 p-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">At risk (over 72 hours)</span>
                  </div>
                  <Badge variant="destructive">{atRiskReferrals.length}</Badge>
                </div>
              )}
              {referralsWithRisk.slice(0, 5).map((referral) => (
                <div
                  key={referral.id.toString()}
                  className={`flex items-center justify-between rounded-lg border p-2 transition-colors ${
                    referral.isAtRisk ? 'border-destructive bg-destructive/5' : 'border-border'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{referral.clientName}</p>
                      {referral.isAtRisk && (
                        <AlertTriangle className="h-3 w-3 flex-shrink-0 text-destructive" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {referral.partnerAgencyName}
                    </p>
                  </div>
                  <Badge variant={referral.isAtRisk ? 'destructive' : 'outline'} className="ml-2 flex-shrink-0">
                    {referral.isAtRisk ? '>72h' : 'New'}
                  </Badge>
                </div>
              ))}
              {referralsWaitingReview.length > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{referralsWaitingReview.length - 5} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning: Approved Referrals Not Converted */}
      {approvedNotConverted.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="h-5 w-5 text-warning" />
              Approved, Not Converted
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToTab('referrals')}
              className="gap-1 text-xs"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total approved</span>
                <Badge variant="outline" className="border-warning text-warning">
                  {approvedNotConverted.length}
                </Badge>
              </div>
              {approvedNotConverted.slice(0, 5).map((referral) => (
                <div
                  key={referral.id.toString()}
                  className="flex items-center justify-between rounded-lg border border-warning/50 bg-warning/5 p-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{referral.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {referral.partnerAgencyName}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 flex-shrink-0 border-warning text-warning">
                    Not converted
                  </Badge>
                </div>
              ))}
              {approvedNotConverted.length > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{approvedNotConverted.length - 5} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* At Risk: Intakes Without Assigned Bed */}
      <Card className={intakesWithoutBed.length > 0 ? 'border-warning bg-warning/5' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className={`h-5 w-5 ${intakesWithoutBed.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            Intakes Without Assigned Bed
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab('intakes')}
            className="gap-1 text-xs"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : intakesWithoutBed.length === 0 ? (
            <p className="text-sm text-muted-foreground">All active intakes have assigned beds</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total at risk</span>
                <Badge variant="outline" className="border-warning text-warning">
                  {intakesWithoutBed.length}
                </Badge>
              </div>
              {intakesWithoutBed.slice(0, 5).map((intake) => (
                <div
                  key={intake.id.toString()}
                  className="flex items-center justify-between rounded-lg border border-warning/50 bg-warning/5 p-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{intake.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Number(intake.createdAt) / 1000000).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 flex-shrink-0 border-warning text-warning">
                    No bed
                  </Badge>
                </div>
              ))}
              {intakesWithoutBed.length > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{intakesWithoutBed.length - 5} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* At Risk: Beds Without Exit Date */}
      <Card className={bedsWithoutExitDate.length > 0 ? 'border-warning bg-warning/5' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BedDouble className={`h-5 w-5 ${bedsWithoutExitDate.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            Beds Occupied Without Exit Date
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab('beds')}
            className="gap-1 text-xs"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bedsWithoutExitDate.length === 0 ? (
            <p className="text-sm text-muted-foreground">All occupied beds have exit dates</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total at risk</span>
                <Badge variant="outline" className="border-warning text-warning">
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
                    className="flex items-center justify-between rounded-lg border border-warning/50 bg-warning/5 p-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Bed #{bed.bedNumber}
                        {assignedIntake && ` - ${assignedIntake.client.name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bed.program === 'medicalStepDown' ? 'Medical Step-Down' : 'Workforce Housing'}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 flex-shrink-0 border-warning text-warning">
                      No exit
                    </Badge>
                  </div>
                );
              })}
              {bedsWithoutExitDate.length > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{bedsWithoutExitDate.length - 5} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning: Intakes Without Case Manager */}
      <Card className={intakesWithoutCaseManager.length > 0 ? 'border-warning bg-warning/5' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserX className={`h-5 w-5 ${intakesWithoutCaseManager.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            Intakes Without Case Manager
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab('intakes')}
            className="gap-1 text-xs"
          >
            View all
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : intakesWithoutCaseManager.length === 0 ? (
            <p className="text-sm text-muted-foreground">All active intakes have case managers</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                <span className="text-sm font-medium">Total cases</span>
                <Badge variant="outline" className="border-warning text-warning">
                  {intakesWithoutCaseManager.length}
                </Badge>
              </div>
              {intakesWithoutCaseManager.slice(0, 5).map((intake) => (
                <div
                  key={intake.id.toString()}
                  className="flex items-center justify-between rounded-lg border border-warning/50 bg-warning/5 p-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{intake.client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Number(intake.createdAt) / 1000000).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2 flex-shrink-0 border-warning text-warning">
                    No manager
                  </Badge>
                </div>
              ))}
              {intakesWithoutCaseManager.length > 5 && (
                <p className="text-center text-xs text-muted-foreground">
                  +{intakesWithoutCaseManager.length - 5} more
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
