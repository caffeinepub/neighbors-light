import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedDouble, Activity } from 'lucide-react';
import { Bed, Program, Status__1 } from '../backend';

interface AdminBedUtilizationSummaryProps {
  beds: Bed[];
}

function getProgramLabel(program: Program): string {
  switch (program) {
    case Program.medicalStepDown:
      return 'Medical Step-Down';
    case Program.workforceHousing:
      return 'Workforce Housing';
    default:
      return 'Unknown Program';
  }
}

export default function AdminBedUtilizationSummary({ beds }: AdminBedUtilizationSummaryProps) {
  if (beds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Bed Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active beds to summarize</p>
        </CardContent>
      </Card>
    );
  }

  const totalBeds = beds.length;
  const availableBeds = beds.filter((b) => b.status === Status__1.available).length;
  const occupiedBeds = beds.filter((b) => b.status === Status__1.occupied).length;

  // Group beds by program dynamically
  const programGroups = beds.reduce((acc, bed) => {
    const programKey = bed.program;
    if (!acc[programKey]) {
      acc[programKey] = [];
    }
    acc[programKey].push(bed);
    return acc;
  }, {} as Record<Program, Bed[]>);

  const programStats = Object.entries(programGroups).map(([program, programBeds]) => {
    const programEnum = program as Program;
    return {
      program: programEnum,
      label: getProgramLabel(programEnum),
      total: programBeds.length,
      available: programBeds.filter((b) => b.status === Status__1.available).length,
      occupied: programBeds.filter((b) => b.status === Status__1.occupied).length,
    };
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="h-5 w-5" />
            Bed Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Beds</p>
              <p className="text-3xl font-bold">{totalBeds}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-3xl font-bold text-primary">{availableBeds}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Occupied</p>
              <p className="text-3xl font-bold text-secondary">{occupiedBeds}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {programStats.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {programStats.map((stat) => (
            <Card key={stat.program}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Beds</span>
                    <span className="text-2xl font-bold">{stat.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <Badge variant="default" className="text-base">
                      {stat.available}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Occupied</span>
                    <Badge variant="secondary" className="text-base">
                      {stat.occupied}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                    <span className="text-lg font-semibold">
                      {stat.total > 0 ? Math.round((stat.occupied / stat.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
