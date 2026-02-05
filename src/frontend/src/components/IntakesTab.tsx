import { useState } from 'react';
import { useGetAllIntakes, useCreateIntake, useReviewIntake, useGetAvailableBedsByProgram, useAssignBedToIntake, useMarkIntakeExited, useAddIntakeInternalNotes, useAssignCaseManager, useGetAllUsers, useGetIntakeStatusHistory } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Loader2, ClipboardList, CheckCircle2, XCircle, Bed as BedIcon, ArrowLeft, LogOut, Lock, UserCircle, History, AlertTriangle, Table as TableIcon, LayoutGrid, UserX } from 'lucide-react';
import { toast } from 'sonner';
import type { Client, Intake, Bed, Program } from '../backend';
import { Principal } from '@dfinity/principal';
import StatusHistoryTimeline from './StatusHistoryTimeline';
import { isIntakeAtRisk, getIntakeAtRiskLabel } from '../utils/atRisk';
import IntakesDataViewTable from './IntakesDataViewTable';
import { getUserDisplayName } from '../utils/userDisplay';

interface IntakesTabProps {
  isAdmin: boolean;
}

const EXIT_REASONS = [
  'Completed program successfully',
  'Transferred to another facility',
  'Moved to permanent housing',
  'Voluntary departure',
  'Medical reasons',
  'Behavioral issues',
  'Other',
] as const;

export default function IntakesTab({ isAdmin }: IntakesTabProps) {
  const { data: intakes = [], isLoading } = useGetAllIntakes();
  const { data: allUsers = [] } = useGetAllUsers();
  const createIntake = useCreateIntake();
  const reviewIntake = useReviewIntake();
  const getAvailableBeds = useGetAvailableBedsByProgram();
  const assignBedToIntake = useAssignBedToIntake();
  const markIntakeExited = useMarkIntakeExited();
  const addInternalNotes = useAddIntakeInternalNotes();
  const assignCaseManager = useAssignCaseManager();

  const [viewMode, setViewMode] = useState<'management' | 'dataView'>('management');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [details, setDetails] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<Program | ''>('');

  const [selectedIntake, setSelectedIntake] = useState<Intake | null>(null);
  const { data: statusHistory = [], isLoading: historyLoading } = useGetIntakeStatusHistory(selectedIntake?.id || null);
  const [isAssignBedOpen, setIsAssignBedOpen] = useState(false);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [intakeProgram, setIntakeProgram] = useState<Program | null>(null);

  const [isExitOpen, setIsExitOpen] = useState(false);
  const [exitDate, setExitDate] = useState('');
  const [exitReasonSelect, setExitReasonSelect] = useState('');
  const [exitReasonOther, setExitReasonOther] = useState('');
  const [exitError, setExitError] = useState('');

  const [internalNotesText, setInternalNotesText] = useState('');
  const [isEditingInternalNotes, setIsEditingInternalNotes] = useState(false);

  const [isEditingCaseManager, setIsEditingCaseManager] = useState(false);
  const [selectedCaseManagerId, setSelectedCaseManagerId] = useState<string>('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim() || !contactInfo.trim() || !details.trim() || !selectedProgram) {
      toast.error('Please fill in all required fields');
      return;
    }

    const client: Client = {
      name: clientName.trim(),
      contactInfo: contactInfo.trim(),
      notes: notes.trim() || undefined,
    };

    try {
      await createIntake.mutateAsync({ client, details: details.trim() });
      toast.success('Intake created successfully');
      setIsCreateOpen(false);
      setClientName('');
      setContactInfo('');
      setNotes('');
      setDetails('');
      setSelectedProgram('');
    } catch (error) {
      toast.error('Failed to create intake');
      console.error(error);
    }
  };

  const handleReview = async (intakeId: bigint, status: string) => {
    try {
      await reviewIntake.mutateAsync({ intakeId, status });
      toast.success(`Intake ${status}`);
    } catch (error) {
      toast.error('Failed to review intake');
      console.error(error);
    }
  };

  const handleOpenAssignBed = async (intake: Intake) => {
    setSelectedIntake(intake);
    setIsAssignBedOpen(true);
    setAvailableBeds([]);
    setIntakeProgram(null);
  };

  const handleSelectProgram = async (program: Program) => {
    setIntakeProgram(program);
    try {
      const beds = await getAvailableBeds.mutateAsync(program);
      setAvailableBeds(beds);
      if (beds.length === 0) {
        toast.info('No available beds for this program');
      }
    } catch (error) {
      toast.error('Failed to fetch available beds');
      console.error(error);
    }
  };

  const handleBedClick = async (bedId: bigint) => {
    if (!selectedIntake) return;

    try {
      await assignBedToIntake.mutateAsync({
        bedId,
        intakeId: selectedIntake.id,
      });
      toast.success('Bed assigned successfully');
      setIsAssignBedOpen(false);
      setSelectedIntake(null);
      setAvailableBeds([]);
      setIntakeProgram(null);
    } catch (error) {
      toast.error('Failed to assign bed');
      console.error(error);
    }
  };

  const handleOpenExitDialog = (intake: Intake) => {
    setSelectedIntake(intake);
    setIsExitOpen(true);
    setExitDate('');
    setExitReasonSelect('');
    setExitReasonOther('');
    setExitError('');
  };

  const handleMarkExited = async () => {
    setExitError('');

    if (!exitDate) {
      setExitError('Exit date is required');
      return;
    }

    if (!exitReasonSelect) {
      setExitError('Exit reason is required');
      return;
    }

    // If "Other" is selected, require the free-text field
    if (exitReasonSelect === 'Other' && !exitReasonOther.trim()) {
      setExitError('Please specify the exit reason');
      return;
    }

    if (!selectedIntake) return;

    try {
      // Convert date string to nanoseconds timestamp
      const dateObj = new Date(exitDate);
      const exitTimestamp = BigInt(dateObj.getTime() * 1000000);

      // Compute final exit reason
      const finalExitReason = exitReasonSelect === 'Other' 
        ? exitReasonOther.trim() 
        : exitReasonSelect;

      await markIntakeExited.mutateAsync({
        intakeId: selectedIntake.id,
        exitDate: exitTimestamp,
        exitNotes: finalExitReason,
      });

      toast.success('Intake marked as exited successfully');
      setIsExitOpen(false);
      setSelectedIntake(null);
      setExitDate('');
      setExitReasonSelect('');
      setExitReasonOther('');
      setExitError('');
    } catch (error) {
      toast.error('Failed to mark intake as exited');
      console.error(error);
    }
  };

  const handleSaveInternalNotes = async () => {
    if (!selectedIntake) return;

    try {
      await addInternalNotes.mutateAsync({
        intakeId: selectedIntake.id,
        notes: internalNotesText.trim(),
      });
      toast.success('Internal notes saved');
      setIsEditingInternalNotes(false);
    } catch (error) {
      toast.error('Failed to save internal notes');
      console.error(error);
    }
  };

  const handleOpenIntakeDetails = (intake: Intake) => {
    setSelectedIntake(intake);
    setInternalNotesText(intake.internalNotes || '');
    setIsEditingInternalNotes(false);
    setIsEditingCaseManager(false);
    setSelectedCaseManagerId(intake.caseManager ? intake.caseManager.toString() : '');
  };

  const handleSaveCaseManager = async () => {
    if (!selectedIntake) return;

    try {
      const managerId = selectedCaseManagerId ? Principal.fromText(selectedCaseManagerId) : null;
      await assignCaseManager.mutateAsync({
        intakeId: selectedIntake.id,
        managerId,
      });
      toast.success(managerId ? 'Case manager assigned' : 'Case manager cleared');
      setIsEditingCaseManager(false);
    } catch (error) {
      toast.error('Failed to update case manager');
      console.error(error);
    }
  };

  const getUserName = (principalId: Principal | undefined): string => {
    return getUserDisplayName(principalId, allUsers);
  };

  const sortedIntakes = [...intakes].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  const getProgramLabel = (program: Program): string => {
    return program === 'medicalStepDown' ? 'Medical Step-Down' : 'Workforce Housing';
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

  if (selectedIntake && !isAssignBedOpen && !isExitOpen) {
    const noCaseManager = !selectedIntake.caseManager;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSelectedIntake(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Intakes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  {selectedIntake.client.name}
                  {isIntakeAtRisk(selectedIntake) && (
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  )}
                </CardTitle>
                <CardDescription className="mt-1">{selectedIntake.client.contactInfo}</CardDescription>
                {isIntakeAtRisk(selectedIntake) && (
                  <Badge variant="outline" className="mt-2 border-warning text-warning">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    At Risk - {getIntakeAtRiskLabel()}
                  </Badge>
                )}
                {noCaseManager && (
                  <Badge variant="outline" className="mt-2 border-warning text-warning">
                    <UserX className="mr-1 h-3 w-3" />
                    No case manager
                  </Badge>
                )}
              </div>
              <Badge variant={getStatusVariant(selectedIntake.status)}>
                {getStatusLabel(selectedIntake.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Intake Details</h3>
              <p className="text-sm text-muted-foreground">{selectedIntake.details}</p>
            </div>

            {selectedIntake.client.notes && (
              <div className="space-y-2">
                <h3 className="font-medium">Additional Notes</h3>
                <p className="text-sm text-muted-foreground">{selectedIntake.client.notes}</p>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Case Manager</h3>
              </div>
              {isEditingCaseManager ? (
                <div className="space-y-2">
                  <Select value={selectedCaseManagerId} onValueChange={setSelectedCaseManagerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select case manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None (Clear assignment)</SelectItem>
                      {allUsers
                        .filter(([_, profile]) => profile.role === 'Staff' || profile.role === 'Admin')
                        .map(([principal, profile]) => (
                          <SelectItem key={principal.toString()} value={principal.toString()}>
                            {profile.name || principal.toString().slice(0, 12) + '...'}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCaseManagerId(selectedIntake.caseManager ? selectedIntake.caseManager.toString() : '');
                        setIsEditingCaseManager(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveCaseManager}
                      disabled={assignCaseManager.isPending}
                    >
                      {assignCaseManager.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {getUserName(selectedIntake.caseManager)}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingCaseManager(true)}
                  >
                    {selectedIntake.caseManager ? 'Change Case Manager' : 'Assign Case Manager'}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-medium">Timeline</h3>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(Number(selectedIntake.createdAt) / 1000000).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Updated: {new Date(Number(selectedIntake.updatedAt) / 1000000).toLocaleString()}
              </p>
            </div>

            {/* Last Updated Information */}
            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Last updated</Label>
                <p className="text-sm font-medium">
                  {new Date(Number(selectedIntake.updatedAt) / 1000000).toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Last updated by</Label>
                <p className="text-sm font-medium">
                  {getUserName(selectedIntake.lastUpdatedBy)}
                </p>
              </div>
            </div>

            {selectedIntake.exitDate && selectedIntake.exitNotes && (
              <div className="space-y-2 pt-4 border-t">
                <h3 className="font-medium">Exit Information</h3>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Exit Date:</span>{' '}
                  {new Date(Number(selectedIntake.exitDate) / 1000000).toLocaleDateString()}
                </p>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Exit Reason:</p>
                  <p className="text-sm text-muted-foreground">{selectedIntake.exitNotes}</p>
                </div>
              </div>
            )}

            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Internal Notes (Staff Only)</h3>
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
                        setInternalNotesText(selectedIntake.internalNotes || '');
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
                  {selectedIntake.internalNotes ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                      {selectedIntake.internalNotes}
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
                    {selectedIntake.internalNotes ? 'Edit Notes' : 'Add Notes'}
                  </Button>
                </div>
              )}
            </div>

            {/* Status History Section - Staff/Admin Only */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">Status History</h3>
              </div>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <StatusHistoryTimeline 
                  entries={statusHistory} 
                  type="intake"
                  getUserName={getUserName}
                />
              )}
            </div>

            {selectedIntake.status === 'approved' && (
              <div className="pt-4 border-t space-y-2">
                <Button onClick={() => handleOpenAssignBed(selectedIntake)} className="w-full">
                  <BedIcon className="mr-2 h-4 w-4" />
                  Assign Bed
                </Button>
                <Button 
                  onClick={() => handleOpenExitDialog(selectedIntake)} 
                  variant="outline"
                  className="w-full"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Mark as Exited
                </Button>
              </div>
            )}

            {selectedIntake.status === 'pending' && (
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="default"
                  onClick={() => handleReview(selectedIntake.id, 'approved')}
                  disabled={reviewIntake.isPending}
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview(selectedIntake.id, 'rejected')}
                  disabled={reviewIntake.isPending}
                  className="flex-1"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Intake Management</h2>
          <p className="text-sm text-muted-foreground">Record and review client intakes</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'management' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('management')}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                Management
              </Button>
              <Button
                variant={viewMode === 'dataView' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('dataView')}
              >
                <TableIcon className="mr-2 h-4 w-4" />
                Data View
              </Button>
            </div>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Intake
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Intake</DialogTitle>
                <DialogDescription>Record a new client intake</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactInfo">
                    Contact Info <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contactInfo"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Phone or email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">
                    Program <span className="text-destructive">*</span>
                  </Label>
                  <Select value={selectedProgram} onValueChange={(value) => setSelectedProgram(value as Program)}>
                    <SelectTrigger id="program">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medicalStepDown">Medical Step-Down</SelectItem>
                      <SelectItem value="workforceHousing">Workforce Housing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="details">
                    Intake Details <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe the intake details, needs, and assessment"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createIntake.isPending} className="flex-1">
                    {createIntake.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Intake'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={isAssignBedOpen} onOpenChange={setIsAssignBedOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Bed to Intake</DialogTitle>
            <DialogDescription>
              Select a program and click a bed to assign it to {selectedIntake?.client.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bedProgram">
                Program <span className="text-destructive">*</span>
              </Label>
              <Select
                value={intakeProgram || ''}
                onValueChange={(value) => handleSelectProgram(value as Program)}
              >
                <SelectTrigger id="bedProgram">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicalStepDown">Medical Step-Down</SelectItem>
                  <SelectItem value="workforceHousing">Workforce Housing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {getAvailableBeds.isPending && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {intakeProgram && !getAvailableBeds.isPending && availableBeds.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No available beds for this program
              </div>
            )}

            {intakeProgram && availableBeds.length > 0 && (
              <div className="space-y-2">
                <Label>Available Beds (Click to Assign)</Label>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {availableBeds.map((bed) => (
                    <Card
                      key={bed.id.toString()}
                      className={`cursor-pointer transition-colors hover:border-primary/50 ${
                        assignBedToIntake.isPending ? 'opacity-50 pointer-events-none' : ''
                      }`}
                      onClick={() => handleBedClick(bed.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Bed #{bed.bedNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {getProgramLabel(bed.program)}
                            </p>
                          </div>
                          <Badge variant="outline">Available</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {assignBedToIntake.isPending && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Assigning bed...</span>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAssignBedOpen(false);
                  setAvailableBeds([]);
                  setIntakeProgram(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExitOpen} onOpenChange={setIsExitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Intake as Exited</DialogTitle>
            <DialogDescription>
              Record the exit date and reason for {selectedIntake?.client.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exitDate">
                Exit Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="exitDate"
                type="date"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exitReason">
                Exit Reason <span className="text-destructive">*</span>
              </Label>
              <Select value={exitReasonSelect} onValueChange={setExitReasonSelect}>
                <SelectTrigger id="exitReason">
                  <SelectValue placeholder="Select exit reason" />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_REASONS.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {exitReasonSelect === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="exitReasonOther">
                  Specify Exit Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="exitReasonOther"
                  value={exitReasonOther}
                  onChange={(e) => setExitReasonOther(e.target.value)}
                  placeholder="Please describe the exit reason"
                  rows={3}
                />
              </div>
            )}

            {exitError && (
              <p className="text-sm text-destructive">{exitError}</p>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsExitOpen(false);
                  setExitDate('');
                  setExitReasonSelect('');
                  setExitReasonOther('');
                  setExitError('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkExited}
                disabled={markIntakeExited.isPending}
                className="flex-1"
              >
                {markIntakeExited.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Marking...
                  </>
                ) : (
                  'Mark as Exited'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {viewMode === 'dataView' && isAdmin ? (
        <IntakesDataViewTable />
      ) : (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sortedIntakes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  No intakes yet. Create your first intake to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sortedIntakes.map((intake) => {
                const atRisk = isIntakeAtRisk(intake);
                const noCaseManager = !intake.caseManager;
                return (
                  <Card
                    key={intake.id.toString()}
                    className={`cursor-pointer hover:border-primary/50 transition-colors ${
                      atRisk ? 'border-warning bg-warning/5' : ''
                    }`}
                    onClick={() => handleOpenIntakeDetails(intake)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            {intake.client.name}
                            {atRisk && <AlertTriangle className="h-4 w-4 text-warning" />}
                          </CardTitle>
                          <CardDescription className="mt-1 text-xs">
                            {intake.client.contactInfo}
                          </CardDescription>
                          {atRisk && (
                            <Badge variant="outline" className="mt-2 border-warning text-warning">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              At Risk
                            </Badge>
                          )}
                          {noCaseManager && (
                            <Badge variant="outline" className="mt-2 border-warning text-warning">
                              <UserX className="mr-1 h-3 w-3" />
                              No case manager
                            </Badge>
                          )}
                        </div>
                        <Badge variant={getStatusVariant(intake.status)}>
                          {getStatusLabel(intake.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <p className="text-muted-foreground line-clamp-2">
                          <span className="font-medium">Details:</span> {intake.details}
                        </p>
                        <p className="text-muted-foreground">
                          <span className="font-medium">Created:</span>{' '}
                          {new Date(Number(intake.createdAt) / 1000000).toLocaleDateString()}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          <span className="font-medium">Last updated:</span>{' '}
                          {new Date(Number(intake.updatedAt) / 1000000).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          <span className="font-medium">Last updated by:</span>{' '}
                          {getUserName(intake.lastUpdatedBy)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
