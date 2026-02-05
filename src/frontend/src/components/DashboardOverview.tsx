import { useGetAllReferrals, useGetAllIntakes, useGetActiveBeds } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ClipboardList, BedDouble, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Status, Status__1 } from '../backend';
import AdminBedUtilizationSummary from './AdminBedUtilizationSummary';

interface DashboardOverviewProps {
  isAdmin: boolean;
}

export default function DashboardOverview({ isAdmin }: DashboardOverviewProps) {
  const { data: referrals = [], isLoading: referralsLoading } = useGetAllReferrals();
  const { data: intakes = [], isLoading: intakesLoading } = useGetAllIntakes();
  const { data: beds = [], isLoading: bedsLoading } = useGetActiveBeds();

  const stats = {
    totalReferrals: referrals.length,
    submittedReferrals: referrals.filter((r) => r.status === Status.submitted).length,
    totalIntakes: intakes.length,
    pendingIntakes: intakes.filter((i) => i.status === 'pending').length,
    approvedIntakes: intakes.filter((i) => i.status === 'approved').length,
    totalBeds: beds.length,
    availableBeds: beds.filter((b) => b.status === Status__1.available).length,
    occupiedBeds: beds.filter((b) => b.status === Status__1.occupied).length,
  };

  if (referralsLoading || intakesLoading || bedsLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getStatusLabel = (status: Status): string => {
    switch (status) {
      case Status.submitted:
        return 'Submitted';
      case Status.needsInfo:
        return 'Needs Info';
      case Status.approved:
        return 'Approved';
      case Status.declined:
        return 'Declined';
      case Status.waitlisted:
        return 'Waitlisted';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: Status): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case Status.submitted:
        return 'default';
      case Status.needsInfo:
        return 'outline';
      case Status.approved:
        return 'default';
      case Status.declined:
        return 'destructive';
      case Status.waitlisted:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="mt-1">
                {stats.submittedReferrals} submitted
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intakes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIntakes}</div>
            <div className="mt-1 flex gap-2">
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {stats.pendingIntakes} pending
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Beds</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableBeds}</div>
            <p className="text-xs text-muted-foreground">of {stats.totalBeds} active beds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBeds > 0 ? Math.round((stats.occupiedBeds / stats.totalBeds) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{stats.occupiedBeds} beds occupied</p>
          </CardContent>
        </Card>
      </div>

      {isAdmin && <AdminBedUtilizationSummary beds={beds} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrals yet</p>
            ) : (
              <div className="space-y-3">
                {referrals.slice(0, 5).map((referral) => (
                  <div
                    key={referral.id.toString()}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{referral.client.name}</p>
                      <p className="text-xs text-muted-foreground">Source: {referral.source}</p>
                    </div>
                    <Badge variant={getStatusVariant(referral.status)}>
                      {getStatusLabel(referral.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Intakes</CardTitle>
          </CardHeader>
          <CardContent>
            {intakes.filter((i) => i.status === 'pending').length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending intakes</p>
            ) : (
              <div className="space-y-3">
                {intakes
                  .filter((i) => i.status === 'pending')
                  .slice(0, 5)
                  .map((intake) => (
                    <div
                      key={intake.id.toString()}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{intake.client.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(Number(intake.createdAt) / 1000000).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
