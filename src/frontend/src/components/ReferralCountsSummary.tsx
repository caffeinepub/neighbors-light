import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Referral } from '../backend';

interface ReferralCountsSummaryProps {
  referrals: Referral[];
}

export default function ReferralCountsSummary({ referrals }: ReferralCountsSummaryProps) {
  const counts = useMemo(() => {
    const total = referrals.length;
    const submitted = referrals.filter(r => r.status === 'submitted').length;
    const needsInfo = referrals.filter(r => r.status === 'needsInfo').length;
    const approved = referrals.filter(r => r.status === 'approved').length;
    const waitlisted = referrals.filter(r => r.status === 'waitlisted').length;
    const declined = referrals.filter(r => r.status === 'declined').length;

    return { total, submitted, needsInfo, approved, waitlisted, declined };
  }, [referrals]);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Total:</span>
            <Badge variant="secondary" className="text-base font-semibold px-3 py-1">
              {counts.total}
            </Badge>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Submitted:</span>
              <Badge variant="outline" className="font-medium">
                {counts.submitted}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Needs Info:</span>
              <Badge variant="outline" className="font-medium">
                {counts.needsInfo}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Approved:</span>
              <Badge variant="outline" className="font-medium">
                {counts.approved}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Waitlisted:</span>
              <Badge variant="outline" className="font-medium">
                {counts.waitlisted}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Declined:</span>
              <Badge variant="outline" className="font-medium">
                {counts.declined}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
