import { useState } from 'react';
import { useGetMyReferrals, useCreateReferral, useUploadReferralDocuments, useResubmitReferral, useGetCallerPartnerAgencyProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, FileText, AlertCircle, Edit, Clock, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Client, Referral } from '../backend';
import { validateReferralForm, hasValidationErrors, getErrorMessage, type ValidationErrors } from '../utils/referralValidation';
import ReferralStatusBadge from './ReferralStatusBadge';
import { formatWaitingTime, isOverdue } from '../utils/referralWaitingTime';
import { useNow } from '../hooks/useNow';

interface PartnerReferralsTabProps {
  mode: 'list' | 'create';
}

// Note: Status history is Staff/Admin-only and is NOT displayed in Partner Agency referral details
export default function PartnerReferralsTab({ mode }: PartnerReferralsTabProps) {
  const { data: referrals = [], isLoading } = useGetMyReferrals();
  const { data: agencyProfile, isLoading: profileLoading, isFetched: profileFetched } = useGetCallerPartnerAgencyProfile();
  const createReferral = useCreateReferral();
  const uploadDocuments = useUploadReferralDocuments();
  const resubmitReferral = useResubmitReferral();

  // Use the now hook to keep waiting times updated
  useNow();

  const [referrerName, setReferrerName] = useState('');
  const [clientName, setClientName] = useState('');
  const [reason, setReason] = useState('');
  const [programRequested, setProgramRequested] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [editReferrerName, setEditReferrerName] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editProgramRequested, setEditProgramRequested] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editValidationErrors, setEditValidationErrors] = useState<ValidationErrors>({});

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agencyProfile) {
      toast.error('Please complete your Partner Agency profile before submitting referrals');
      return;
    }

    const errors = validateReferralForm({
      partnerAgencyName: agencyProfile.agencyName,
      referrerName,
      clientName,
      reason,
      programRequested,
      contactInfo,
      source,
    });

    if (hasValidationErrors(errors)) {
      setValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setValidationErrors({});

    const client: Client = {
      name: clientName.trim(),
      contactInfo: contactInfo.trim(),
      notes: notes.trim() || undefined,
    };

    try {
      await createReferral.mutateAsync({
        referrerName: referrerName.trim(),
        clientName: clientName.trim(),
        reason: reason.trim(),
        programRequested: programRequested.trim(),
        client,
        source: source.trim(),
      });
      toast.success('Referral submitted successfully');
      setReferrerName('');
      setClientName('');
      setReason('');
      setProgramRequested('');
      setContactInfo('');
      setNotes('');
      setSource('');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes('Partner Agency profile not found')) {
        toast.error('Please complete your Partner Agency profile before submitting referrals');
      } else {
        toast.error(errorMessage);
      }
      console.error(error);
    }
  };

  const handleFileUpload = async (referralId: bigint, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    try {
      const documents = await Promise.all(
        Array.from(files).map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          return new Uint8Array(arrayBuffer);
        })
      );

      await uploadDocuments.mutateAsync({ referralId, documents });
      toast.success('Documents uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload documents');
      console.error(error);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleEditReferral = (referral: Referral) => {
    setEditReferrerName(referral.referrerName);
    setEditClientName(referral.clientName);
    setEditReason(referral.reason);
    setEditProgramRequested(referral.programRequested);
    setEditContactInfo(referral.client.contactInfo);
    setEditNotes(referral.client.notes || '');
    setEditSource(referral.source);
    setEditValidationErrors({});
    setIsEditMode(true);
  };

  const handleResubmit = async () => {
    if (!selectedReferral || !agencyProfile) return;

    const errors = validateReferralForm({
      partnerAgencyName: agencyProfile.agencyName,
      referrerName: editReferrerName,
      clientName: editClientName,
      reason: editReason,
      programRequested: editProgramRequested,
      contactInfo: editContactInfo,
      source: editSource,
    });

    if (hasValidationErrors(errors)) {
      setEditValidationErrors(errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setEditValidationErrors({});

    const updatedClient: Client = {
      name: editClientName.trim(),
      contactInfo: editContactInfo.trim(),
      notes: editNotes.trim() || undefined,
    };

    try {
      await resubmitReferral.mutateAsync({
        referralId: selectedReferral.id,
        referrerName: editReferrerName.trim(),
        clientName: editClientName.trim(),
        reason: editReason.trim(),
        programRequested: editProgramRequested.trim(),
        updatedClient,
        updatedSource: editSource.trim(),
      });
      toast.success('Referral resubmitted successfully');
      setIsEditMode(false);
      setSelectedReferral(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
      console.error(error);
    }
  };

  if (mode === 'create') {
    if (profileLoading) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      );
    }

    if (profileFetched && !agencyProfile) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile First</CardTitle>
            <CardDescription>
              You need to complete your Partner Agency profile before submitting referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                Please go to the <strong>Agency Profile</strong> tab to complete your agency information before submitting referrals.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Submit New Referral</CardTitle>
          <CardDescription>
            Submit a new client referral for review by our staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agencyNameDisplay" className="text-muted-foreground">
                Partner Agency Name
              </Label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{agencyProfile?.agencyName}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrerName">
                Referrer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="referrerName"
                value={referrerName}
                onChange={(e) => setReferrerName(e.target.value)}
                placeholder="Your name"
                required
              />
              {validationErrors.referrerName && (
                <p className="text-sm text-destructive">{validationErrors.referrerName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                required
              />
              {validationErrors.clientName && (
                <p className="text-sm text-destructive">{validationErrors.clientName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">
                Client Contact Info <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="Phone or email"
                required
              />
              {validationErrors.contactInfo && (
                <p className="text-sm text-destructive">{validationErrors.contactInfo}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason for Referral <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this client needs services"
                rows={3}
                required
              />
              {validationErrors.reason && (
                <p className="text-sm text-destructive">{validationErrors.reason}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="programRequested">
                Program Requested <span className="text-destructive">*</span>
              </Label>
              <Input
                id="programRequested"
                value={programRequested}
                onChange={(e) => setProgramRequested(e.target.value)}
                placeholder="e.g., Medical Step-Down, Workforce Housing"
                required
              />
              {validationErrors.programRequested && (
                <p className="text-sm text-destructive">{validationErrors.programRequested}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">
                Referral Source <span className="text-destructive">*</span>
              </Label>
              <Input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g., Hospital, Police, Walk-in"
                required
              />
              {validationErrors.source && (
                <p className="text-sm text-destructive">{validationErrors.source}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional information about the client"
                rows={4}
              />
            </div>

            <Button type="submit" disabled={createReferral.isPending} className="w-full">
              {createReferral.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Submit Referral
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const sortedReferrals = [...referrals].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt)
  );

  return (
    <>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">My Referrals</h2>
          <p className="text-sm text-muted-foreground">View and manage your submitted referrals</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : sortedReferrals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                No referrals yet. Submit your first referral to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedReferrals.map((referral) => {
              const overdue = isOverdue(referral.createdAt);
              return (
                <Card 
                  key={referral.id.toString()} 
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    overdue ? 'border-warning bg-warning/5 dark:bg-warning/10' : ''
                  }`}
                  onClick={() => setSelectedReferral(referral)}
                >
                  <CardHeader>
                    <div className="flex flex-col gap-2 portrait:gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">{referral.clientName}</CardTitle>
                          <CardDescription className="mt-1 text-xs truncate">
                            {referral.partnerAgencyName}
                          </CardDescription>
                        </div>
                        <ReferralStatusBadge status={referral.status} className="portrait:hidden" />
                      </div>
                      <ReferralStatusBadge status={referral.status} className="hidden portrait:flex portrait:self-start" />
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
                      <div className={`flex items-center gap-1 mt-1 ${overdue ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">{formatWaitingTime(referral.createdAt)}</span>
                      </div>
                      {referral.documents.length > 0 && (
                        <p className="text-muted-foreground">
                          <span className="font-medium">Documents:</span> {referral.documents.length}
                        </p>
                      )}
                    </div>
                    {referral.requestMoreInfo && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Staff message: {referral.requestMoreInfo}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedReferral && (
        <Dialog open={!!selectedReferral} onOpenChange={() => {
          setSelectedReferral(null);
          setIsEditMode(false);
        }}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex flex-col gap-2 portrait:gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1 min-w-0 truncate">Referral Details</span>
                  <ReferralStatusBadge status={selectedReferral.status} className="portrait:hidden" />
                </div>
                <ReferralStatusBadge status={selectedReferral.status} className="hidden portrait:flex portrait:self-start" />
              </DialogTitle>
              <DialogDescription>
                <div className="flex flex-col gap-1">
                  <span>Submitted on {new Date(Number(selectedReferral.createdAt) / 1000000).toLocaleDateString()}</span>
                  <div className={`flex items-center gap-1 ${isOverdue(selectedReferral.createdAt) ? 'text-warning font-medium' : 'text-muted-foreground'}`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-sm">{formatWaitingTime(selectedReferral.createdAt)}</span>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!isEditMode ? (
                <>
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
                        <strong>Staff Message:</strong> {selectedReferral.requestMoreInfo}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Documents ({selectedReferral.documents.length})</Label>
                    {selectedReferral.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedReferral.documents.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 rounded-md border border-border p-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Document {idx + 1}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No documents uploaded</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload" className="text-sm font-medium">
                      Upload Additional Documents
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={(e) => handleFileUpload(selectedReferral.id, e.target.files)}
                        disabled={uploadingFiles}
                        className="flex-1"
                      />
                      {uploadingFiles && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </div>

                  {selectedReferral.status === 'needsInfo' && (
                    <Button
                      onClick={() => handleEditReferral(selectedReferral)}
                      variant="default"
                      className="w-full"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit and Resubmit
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">
                        Partner Agency Name
                      </Label>
                      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{selectedReferral.partnerAgencyName}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-referrerName">
                        Referrer Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edit-referrerName"
                        value={editReferrerName}
                        onChange={(e) => setEditReferrerName(e.target.value)}
                        placeholder="Your name"
                        required
                      />
                      {editValidationErrors.referrerName && (
                        <p className="text-sm text-destructive">{editValidationErrors.referrerName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-clientName">
                        Client Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edit-clientName"
                        value={editClientName}
                        onChange={(e) => setEditClientName(e.target.value)}
                        placeholder="Enter client name"
                        required
                      />
                      {editValidationErrors.clientName && (
                        <p className="text-sm text-destructive">{editValidationErrors.clientName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-contactInfo">
                        Client Contact Info <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edit-contactInfo"
                        value={editContactInfo}
                        onChange={(e) => setEditContactInfo(e.target.value)}
                        placeholder="Phone or email"
                        required
                      />
                      {editValidationErrors.contactInfo && (
                        <p className="text-sm text-destructive">{editValidationErrors.contactInfo}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-reason">
                        Reason for Referral <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id="edit-reason"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Describe why this client needs services"
                        rows={3}
                        required
                      />
                      {editValidationErrors.reason && (
                        <p className="text-sm text-destructive">{editValidationErrors.reason}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-programRequested">
                        Program Requested <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edit-programRequested"
                        value={editProgramRequested}
                        onChange={(e) => setEditProgramRequested(e.target.value)}
                        placeholder="e.g., Medical Step-Down, Workforce Housing"
                        required
                      />
                      {editValidationErrors.programRequested && (
                        <p className="text-sm text-destructive">{editValidationErrors.programRequested}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-source">
                        Referral Source <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="edit-source"
                        value={editSource}
                        onChange={(e) => setEditSource(e.target.value)}
                        placeholder="e.g., Hospital, Police, Walk-in"
                        required
                      />
                      {editValidationErrors.source && (
                        <p className="text-sm text-destructive">{editValidationErrors.source}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="edit-notes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Additional information about the client"
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditMode(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleResubmit}
                        disabled={resubmitReferral.isPending}
                        className="flex-1"
                      >
                        {resubmitReferral.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resubmitting...
                          </>
                        ) : (
                          'Resubmit Referral'
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
