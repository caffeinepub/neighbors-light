import { Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { StatusHistoryEntry, IntakeStatusHistoryEntry, Status } from '../backend';
import type { Principal } from '@dfinity/principal';

interface StatusHistoryTimelineProps {
  entries: StatusHistoryEntry[] | IntakeStatusHistoryEntry[];
  type: 'referral' | 'intake';
  getUserName?: (principal: Principal | undefined) => string;
}

export default function StatusHistoryTimeline({ entries, type, getUserName }: StatusHistoryTimelineProps) {
  const getStatusLabel = (status: Status | string): string => {
    if (typeof status === 'string') {
      // Intake status
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
    // Referral status
    const statusMap: Record<Status, string> = {
      submitted: 'Submitted',
      needsInfo: 'Needs Info',
      approved: 'Approved',
      declined: 'Declined',
      waitlisted: 'Waitlisted',
    };
    return statusMap[status] || status;
  };

  const getStatusVariant = (status: Status | string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    if (typeof status === 'string') {
      // Intake status
      if (status === 'approved') return 'default';
      if (status === 'rejected') return 'destructive';
      if (status === 'exited') return 'secondary';
      return 'outline';
    }
    // Referral status
    if (status === 'approved') return 'default';
    if (status === 'declined') return 'destructive';
    if (status === 'needsInfo') return 'secondary';
    return 'outline';
  };

  const formatTimestamp = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getChangedByText = (updatedBy: Principal | undefined): string => {
    if (!updatedBy) {
      return 'System';
    }
    if (getUserName) {
      return getUserName(updatedBy);
    }
    return updatedBy.toString().slice(0, 8) + '...';
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No status history available
        </CardContent>
      </Card>
    );
  }

  // Sort entries by timestamp (newest first)
  const sortedEntries = [...entries].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {sortedEntries.map((entry, index) => (
            <div key={index}>
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={getStatusVariant(entry.status)}>
                      {getStatusLabel(entry.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Changed by: {getChangedByText(entry.updatedBy)}</span>
                  </div>
                </div>
              </div>
              {index < sortedEntries.length - 1 && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
