import { useState } from 'react';
import { useGetAllReferrals, useUpdateReferralStatusWithMessage, useRequestMoreInfo, useAddReferralInternalNotes, useApproveReferralAndCreateIntake, useGetReferralStatusHistory, useGetAllUsers } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, AlertCircle, MessageSquare, Lock, Clock, History, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Referral, Status } from '../backend';
import type { Principal } from '@dfinity/principal';
import ReferralStatusBadge from './ReferralStatusBadge';
import StatusHistoryTimeline from './StatusHistoryTimeline';
import { formatWaitingTime, isOverdue } from '../utils/referralWaitingTime';
import { isReferralAtRisk, getReferralAtRiskLabel } from '../utils/atRisk';
import { useNow } from '../hooks/useNow';

interface ReferralsTabProps {
  isAdmin: boolean;
}

export default function ReferralsTab({ isAdmin }: ReferralsTabProps) {
  const { data: referrals = [], isLoading } = useGetAllReferrals();
  const { data: allUsers = [] } = useGetAllUsers();
  const updateStatusWithMessage = useUpdateReferralStatusWithMessage();
  const requestMoreInfo = useRequestMoreInfo();
  const addInternalNotes = useAddReferralInternalNotes();
  const approveAndConvert = useApproveReferralAndCreateIntake();

  // Use the now hook to keep waiting times updated
  useNow();

  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const { data: statusHistory = [], isLoading: historyLoading } = useGetReferralStatusHistory(selectedReferral?.id || null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isRequestInfoOpen, setIsRequestInfoOpen] = useState(false);
  const [requestInfoMessage, setRequestInfoMessage] = useState('');

  const [internalNotesText, setInternalNotesText] = useState('');
  const [isEditingInternalNotes, setIsEditingInternalNotes] = useState(false);

  const handleStatusChange = async (referralId: bigint, newStatus: Status, message?: string) => {
    try {
      await updateStatusWithMessage.mutateAsync({
        referralId,
        status: newStatus,
        message: message || null,
      });
      toast.success('Referral status updated');
      setSelectedReferral(null);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleRequestMoreInfo = async () => {
    if (!selectedReferral) return;
    
    if (!requestInfoMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await requestMoreInfo.mutateAsync({
        referralId: selectedReferral.id,
        message: requestInfoMessage.trim(),
      });
      toast.success('Request for more info sent to partner');
      setRequestInfoMessage('');
      setIsRequestInfoOpen(false);
      setSelectedReferral(null);
    } catch (error) {
      toast.error('Failed to request more info');
      console.error(error);
    }
  };

  const handleApproveAndConvert = async (referral: Referral) => {
    try {
      await approveAndConvert.mutateAsync({
        referralId: referral.id,
        intakeDetails: `Converted from referral #${referral.id}. Source: ${referral.source}`,
      });
      toast.success('Referral approved and converted to intake successfully');
      setSelectedReferral(null);
    } catch (error) {
      toast.error('Failed to approve and convert referral');
      console.error(error);
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!selectedReferral) return;

    try {
      await addInternalNotes.mutateAsync({
        referralId: selectedReferral.id,
        notes: internalNotesText.trim(),
      });
      toast.success('Internal notes saved');
      setIsEditingInternalNotes(false);
    } catch (error) {
      toast.error('Failed to save internal notes');
      console.error(error);
    }
  };

  const handleOpenReferralDetails = (referral: Referral) => {
    setSelectedReferral(referral);
    setInternalNotesText(referral.internalNotes || '');
    setIsEditingInternalNotes(false);
  };

  const getUserName = (principalId: Principal | undefined): string => {
    if (!principalId) return 'System';
    const user = allUsers.find(([p]) => p.toString() === principalId.toString());
    if (user && user[1].name) {
      return user[1].name;
    }
    return principalId.toString().slice(0, 8) + '...';
  };

  const filteredReferrals = filterStatus === 'all' 
    ? referrals 
    : referrals.filter(r => r.status === filterStatus);

  const sortedReferrals = [...filteredReferrals].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
  );

  const statusCounts = {
    all: referrals.length,
    submitted: referrals.filter(r => r.status === 'submitted').length,
    needsInfo: referrals.filter(r => r.status === 'needsInfo').length,
    approved: referrals.filter(r => r.status === 'approved').length,
    declined: referrals.filter(r => r.status === 'declined').length,
    waitlisted: referrals.filter(r => r.status === 'waitlisted').length,
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Referrals Queue</h2>
            <p className="text-sm text-muted-foreground">Review and manage all referrals</p>
          </div>
        </div>

        <Tabs value={filterStatus} onValueChange={setFilterStatus}>
          <TabsList className="grid w-full grid-cols-6 portrait:flex portrait:flex-nowrap portrait:overflow-x-auto portrait:justify-start portrait:w-full">
            <TabsTrigger value="all" className="portrait:shrink-0 portrait:px-4 portrait:whitespace-nowrap">All ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="submitted" className="portrait:shrink-0 portrait:px-4 portrait:whitespace-nowrap">Submitted ({statusCounts.submitted})</TabsTrigger>
            <TabsTrigger value="needsInfo" className="portrait:shrink-0 portrait:px-4 portrait:whitespace-nowrap">Needs Info ({statusCounts.needsInfo})</TabsTrigger>
            <TabsTrigger value="approved" className="portrait:shrink-0 portrait:px-4 portrait:whitespace-nowrap">Approved ({statusCounts.approved})</TabsTrigger>
            <TabsTrigger value="waitlisted" className="portrait:shrink-0 portrait:px-4 portrait:whitespace-nowrap">Waitlisted ({statusCounts.waitlisted})</TabsTrigger>
            <TabsTrigger value="declined" className="portrait:shrink-0 portrait:px-4 portrait:whitespace-nowrap">Declined ({statusCounts.declined})</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedReferrals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                {filterStatus === 'all' ? 'No referrals yet.' : `No ${filterStatus} referrals.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedReferrals.map((referral) => {
              const atRisk = isReferralAtRisk(referral.createdAt);
              return (
                <Card 
                  key={referral.id.toString()} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    atRisk ? 'border-destructive bg-destructive/5 dark:bg-destructive/10' : ''
                  }`}
                  onClick={() => handleOpenReferralDetails(referral)}
                >
                  <CardHeader>
                    <div className="flex flex-col gap-2 portrait:gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate flex items-center gap-2">
                            {referral.clientName}
                            {atRisk && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                          </CardTitle>
                          <CardDescription className="mt-1 text-xs truncate">
                            {referral.partnerAgencyName}
                          </CardDescription>
                        </div>
                        <ReferralStatusBadge status={referral.status} className="portrait:hidden" />
                      </div>
                      <ReferralStatusBadge status={referral.status} className="hidden portrait:flex portrait:self-start" />
                      {atRisk && (
                        <Badge variant="destructive" className="self-start">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          At Risk - {getReferralAtRiskLabel()}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium">Program:</span> {referral.programRequested}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="font-medium">Submitted:</span>{' '}
                        {new Date(Number(referral.createdAt) / 1000000).toLocaleDateString()}
                      </p>
                      <div className={`flex items-center gap-1 mt-1 ${atRisk ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">{formatWaitingTime(referral.createdAt)}</span>
                      </div>
                      {referral.documents.length > 0 && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Documents:</span> {referral.documents.length}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedReferral && (
        <Dialog open={!!selectedReferral} onOpenChange={() => setSelectedReferral(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex flex-col gap-2 portrait:gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1 min-w-0 truncate">Referral Details</span>
                  <ReferralStatusBadge status={selectedReferral.status} className="portrait:hidden" />
                </div>
                <ReferralStatusBadge status={selectedReferral.status} className="hidden portrait:flex portrait:self-start" />
                {isReferralAtRisk(selectedReferral.createdAt) && (
                  <Badge variant="destructive" className="self-start">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    At Risk - {getReferralAtRiskLabel()}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                <div className="flex flex-col gap-1">
                  <span>Submitted on {new Date(Number(selectedReferral.createdAt) / 1000000).toLocaleDateString()}</span>
                  <div className={`flex items-center gap-1 ${isReferralAtRisk(selectedReferral.createdAt) ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-sm">{formatWaitingTime(selectedReferral.createdAt)}</span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Partner Agency</Label>
                  <p className="text-sm font-medium">{selectedReferral.partnerAgencyName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Referrer Name</Label>
                  <p className="text-sm font-medium">{selectedReferral.referrerName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Client Name</Label>
                  <p className="text-sm font-medium">{selectedReferral.clientName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Contact Info</Label>
                  <p className="text-sm font-medium">{selectedReferral.client.contactInfo}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Program Requested</Label>
                  <p className="text-sm font-medium">{selectedReferral.programRequested}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Referral Source</Label>
                  <p className="text-sm font-medium">{selectedReferral.source}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Documents</Label>
                  <p className="text-sm font-medium">{selectedReferral.documents.length} uploaded</p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Reason for Referral</Label>
                <p className="text-sm">{selectedReferral.reason}</p>
              </div>

              {selectedReferral.client.notes && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Additional Notes</Label>
                  <p className="text-sm">{selectedReferral.client.notes}</p>
                </div>
              )}

              {selectedReferral.requestMoreInfo && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Message to Partner:</strong> {selectedReferral.requestMoreInfo}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Internal Notes (Staff Only)</Label>
                </div>
                {isEditingInternalNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={internalNotesText}
                      onChange={(e) => setInternalNotesText(e.target.value)}
                      placeholder="Add internal notes visible only to staff and admins..."
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInternalNotesText(selectedReferral.internalNotes || '');
                          setIsEditingInternalNotes(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveInternalNotes}
                        disabled={addInternalNotes.isPending}
                      >
                        {addInternalNotes.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Notes'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedReferral.internalNotes ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                        {selectedReferral.internalNotes}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No internal notes yet</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingInternalNotes(true)}
                    >
                      {selectedReferral.internalNotes ? 'Edit Notes' : 'Add Notes'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Status History Section - Staff/Admin Only */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Status History</Label>
                </div>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <StatusHistoryTimeline 
                    entries={statusHistory} 
                    type="referral"
                    getUserName={getUserName}
                  />
                )}
              </div>

              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="status-select">Update Status</Label>
                <Select
                  value={selectedReferral.status}
                  onValueChange={(value) => {
                    handleStatusChange(selectedReferral.id, value as Status);
                  }}
                >
                  <SelectTrigger id="status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="needsInfo">Needs Info</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="waitlisted">Waitlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setIsRequestInfoOpen(true)}
                  disabled={requestMoreInfo.isPending}
                  variant="outline"
                  className="flex-1"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Request More Info
                </Button>

                {selectedReferral.status !== 'approved' && (
                  <Button
                    onClick={() => handleApproveAndConvert(selectedReferral)}
                    disabled={approveAndConvert.isPending}
                    className="flex-1"
                  >
                    {approveAndConvert.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Approve + Convert to Intake'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Request More Info Dialog */}
      <Dialog open={isRequestInfoOpen} onOpenChange={setIsRequestInfoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request More Information</DialogTitle>
            <DialogDescription>
              Send a message to the partner agency requesting additional information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request-message">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="request-message"
                value={requestInfoMessage}
                onChange={(e) => setRequestInfoMessage(e.target.value)}
                placeholder="Please provide more details about..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsRequestInfoOpen(false);
                  setRequestInfoMessage('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestMoreInfo}
                disabled={requestMoreInfo.isPending || !requestInfoMessage.trim()}
                className="flex-1"
              >
                {requestMoreInfo.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
