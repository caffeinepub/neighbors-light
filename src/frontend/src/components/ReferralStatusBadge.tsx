import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle2, XCircle, FileText } from 'lucide-react';
import type { Status } from '../backend';

interface ReferralStatusBadgeProps {
  status: Status;
  className?: string;
}

export default function ReferralStatusBadge({ status, className = '' }: ReferralStatusBadgeProps) {
  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4 shrink-0" />;
      case 'needsInfo':
        return <AlertCircle className="h-4 w-4 shrink-0" />;
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 shrink-0" />;
      case 'declined':
        return <XCircle className="h-4 w-4 shrink-0" />;
      case 'waitlisted':
        return <Clock className="h-4 w-4 shrink-0" />;
      default:
        return <FileText className="h-4 w-4 shrink-0" />;
    }
  };

  const getStatusVariant = (status: Status): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'submitted':
        return 'default';
      case 'needsInfo':
        return 'outline';
      case 'approved':
        return 'default';
      case 'declined':
        return 'destructive';
      case 'waitlisted':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: Status): string => {
    switch (status) {
      case 'submitted':
        return 'Submitted';
      case 'needsInfo':
        return 'Needs Info';
      case 'approved':
        return 'Approved';
      case 'declined':
        return 'Declined';
      case 'waitlisted':
        return 'Waitlisted';
      default:
        return status;
    }
  };

  return (
    <Badge 
      variant={getStatusVariant(status)} 
      className={`gap-1 shrink-0 whitespace-nowrap ${className}`}
    >
      {getStatusIcon(status)}
      <span className="truncate">{getStatusLabel(status)}</span>
    </Badge>
  );
}
