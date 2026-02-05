import { useMemo } from 'react';
import { useGetAllIntakes, useGetAllBeds, useGetAllUsers } from '../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Intake, Bed } from '../backend';
import { isIntakeAtRisk } from '../utils/atRisk';
import { getUserDisplayName } from '../utils/userDisplay';

export default function IntakesDataViewTable() {
  const { data: intakes = [], isLoading: intakesLoading } = useGetAllIntakes();
  const { data: beds = [], isLoading: bedsLoading } = useGetAllBeds();
  const { data: allUsers = [], isLoading: usersLoading } = useGetAllUsers();

  const sortedIntakes = useMemo(() => {
    return [...intakes].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
  }, [intakes]);

  const getBedInfo = (assignedBedId: bigint | undefined): { bedNumber: string; program: string } | null => {
    if (!assignedBedId) return null;
    const bed = beds.find((b) => b.id === assignedBedId);
    if (!bed) return null;
    return {
      bedNumber: bed.bedNumber,
      program: bed.program === 'medicalStepDown' ? 'Medical Step-Down' : 'Workforce Housing',
    };
  };

  const getStatusLabel = (status: string): string => {
    if (status === 'exited') return 'Exited';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusVariant = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (status === 'approved') return 'default';
    if (status === 'rejected') return 'destructive';
    if (status === 'exited') return 'secondary';
    return 'outline';
  };

  const isLoading = intakesLoading || bedsLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sortedIntakes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-center text-muted-foreground">No intakes to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Case Manager</TableHead>
            <TableHead>Bed Assignment</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last updated</TableHead>
            <TableHead>Last updated by</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedIntakes.map((intake) => {
            const bedInfo = getBedInfo(intake.assignedBedId);
            const atRisk = isIntakeAtRisk(intake);
            return (
              <TableRow key={intake.id.toString()} className={atRisk ? 'bg-warning/5' : ''}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {intake.client.name}
                    {atRisk && <AlertTriangle className="h-4 w-4 text-warning" />}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(intake.status)}>
                    {getStatusLabel(intake.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {bedInfo ? bedInfo.program : <span className="text-muted-foreground">Not assigned</span>}
                </TableCell>
                <TableCell>
                  <span className={!intake.caseManager ? 'text-muted-foreground' : ''}>
                    {getUserDisplayName(intake.caseManager, allUsers)}
                  </span>
                </TableCell>
                <TableCell>
                  {bedInfo ? (
                    `Bed #${bedInfo.bedNumber}`
                  ) : (
                    <span className="text-muted-foreground">Not assigned</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(Number(intake.createdAt) / 1000000).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(Number(intake.updatedAt) / 1000000).toLocaleString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {getUserDisplayName(intake.lastUpdatedBy, allUsers)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
