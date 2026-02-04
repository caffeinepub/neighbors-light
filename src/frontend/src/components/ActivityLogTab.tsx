import { useState } from 'react';
import { useGetActivityLogEntries, useGetAllUsers } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import type { ActivityLogEntry, ActionType, EntityType } from '../backend';

const ENTRIES_PER_PAGE = 20;

export default function ActivityLogTab() {
  const [currentPage, setCurrentPage] = useState(0);
  const offset = BigInt(currentPage * ENTRIES_PER_PAGE);
  const limit = BigInt(ENTRIES_PER_PAGE);

  const { data: entries = [], isLoading, isError, error } = useGetActivityLogEntries(limit, offset);
  const { data: allUsers = [] } = useGetAllUsers();

  // Build principal -> name lookup
  const principalToName = new Map<string, string>();
  allUsers.forEach(([principal, profile]) => {
    if (profile.name) {
      principalToName.set(principal.toString(), profile.name);
    }
  });

  const formatTimestamp = (timestamp: bigint): string => {
    const ms = Number(timestamp / 1_000_000n);
    const date = new Date(ms);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAction = (action: ActionType): string => {
    const actionMap: Record<ActionType, string> = {
      referralCreated: 'Referral Created',
      referralUpdated: 'Referral Updated',
      referralStatusChanged: 'Referral Status Changed',
      referralResubmitted: 'Referral Resubmitted',
      intakeCreated: 'Intake Created',
      intakeStatusChanged: 'Intake Status Changed',
      bedAssigned: 'Bed Assigned',
      bedUnassigned: 'Bed Unassigned',
      bedArchived: 'Bed Archived',
    };
    return actionMap[action] || action;
  };

  const formatEntity = (entity: EntityType): string => {
    const entityMap: Record<EntityType, string> = {
      referral: 'Referral',
      intake: 'Intake',
      bed: 'Bed',
    };
    return entityMap[entity] || entity;
  };

  const getActionBadgeVariant = (action: ActionType): 'default' | 'secondary' | 'outline' | 'destructive' => {
    if (action.includes('Created')) return 'default';
    if (action.includes('Archived') || action.includes('Unassigned')) return 'secondary';
    return 'outline';
  };

  const getUserDisplay = (principal: string): string => {
    return principalToName.get(principal) || principal;
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (entries.length === ENTRIES_PER_PAGE) {
      setCurrentPage(currentPage + 1);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading activity log...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-destructive font-medium">Failed to load activity log</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Activity Log</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track all system activities and changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            System-wide activity entries showing user actions and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activity entries found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Activity will appear here as users interact with the system
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Record ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={`${entry.timestamp}-${index}`}>
                        <TableCell className="font-mono text-xs">
                          {formatTimestamp(entry.timestamp)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {getUserDisplay(entry.user.toString())}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(entry.action)}>
                            {formatAction(entry.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatEntity(entry.entity)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          #{entry.recordId.toString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage + 1}
                  {entries.length === ENTRIES_PER_PAGE && ' of many'}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={entries.length < ENTRIES_PER_PAGE}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
