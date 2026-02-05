import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useGetAllIntakes, useGetTrainingRecord, useUpdateClientPlacementRecord } from '../hooks/useQueries';
import { AlertCircle, Save, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { PlacementStatus } from '../backend';

export default function PlacementEmploymentTab() {
  const [selectedClientId, setSelectedClientId] = useState<bigint | null>(null);
  const [placementStatus, setPlacementStatus] = useState<PlacementStatus>(PlacementStatus.notPlaced);
  const [employerName, setEmployerName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [shiftSchedule, setShiftSchedule] = useState('');
  const [transportationPlan, setTransportationPlan] = useState('');
  const [placementNotes, setPlacementNotes] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [needsAttention, setNeedsAttention] = useState(false);
  const [attendanceOk, setAttendanceOk] = useState(false);
  const [issuesReported, setIssuesReported] = useState(false);
  const [weeklyNotes, setWeeklyNotes] = useState('');

  const { data: intakes, isLoading: intakesLoading, error: intakesError } = useGetAllIntakes();
  const { data: trainingRecord, isLoading: recordLoading, refetch: refetchRecord } = useGetTrainingRecord(selectedClientId);
  const updatePlacementMutation = useUpdateClientPlacementRecord();

  // Load placement record when client is selected
  const handleClientSelect = (clientId: string) => {
    const id = BigInt(clientId);
    setSelectedClientId(id);
    
    // Fetch will happen automatically via React Query
    setTimeout(() => {
      refetchRecord();
    }, 100);
  };

  // Update local state when training record loads
  useEffect(() => {
    if (trainingRecord && trainingRecord.placement) {
      const placement = trainingRecord.placement;
      setPlacementStatus(placement.placementStatus);
      setEmployerName(placement.employerName);
      setJobRole(placement.jobRole);
      setStartDate(placement.startDate || '');
      setShiftSchedule(placement.shiftSchedule);
      setTransportationPlan(placement.transportationPlan);
      setPlacementNotes(placement.placementNotes);
      setFollowUpNotes(placement.follow_up_notes || '');
      setNeedsAttention(placement.needs_attention || false);
      
      if (placement.weeklyCheckIn) {
        setAttendanceOk(placement.weeklyCheckIn.attendanceOk);
        setIssuesReported(placement.weeklyCheckIn.issuesReported);
        setWeeklyNotes(placement.weeklyCheckIn.weeklyNotes);
      } else {
        setAttendanceOk(false);
        setIssuesReported(false);
        setWeeklyNotes('');
      }
    }
  }, [trainingRecord]);

  const handleSave = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }

    try {
      await updatePlacementMutation.mutateAsync({
        clientId: selectedClientId,
        placementRecord: {
          placementStatus,
          employerName,
          jobRole,
          startDate: startDate || undefined,
          shiftSchedule,
          transportationPlan,
          placementNotes,
          follow_up_notes: followUpNotes || undefined,
          needs_attention: needsAttention,
          weeklyCheckIn: placementStatus === PlacementStatus.employed ? {
            attendanceOk,
            issuesReported,
            weeklyNotes,
          } : undefined,
        },
      });
      toast.success('Placement & Employment record saved successfully');
      refetchRecord();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save placement record');
    }
  };

  if (intakesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load clients. Please try again.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Placement & Employment
          </CardTitle>
          <CardDescription>Track client placement status, employment details, and weekly check-ins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client-select">Select Client</Label>
            {intakesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select onValueChange={handleClientSelect} value={selectedClientId?.toString() || ''}>
                <SelectTrigger id="client-select">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {intakes?.map((intake) => (
                    <SelectItem key={intake.id.toString()} value={intake.id.toString()}>
                      {intake.client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedClientId && (
            <>
              {recordLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  {/* Placement Status */}
                  <div className="space-y-2">
                    <Label htmlFor="placement-status">Placement Status</Label>
                    <Select 
                      value={placementStatus} 
                      onValueChange={(value) => setPlacementStatus(value as PlacementStatus)}
                    >
                      <SelectTrigger id="placement-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PlacementStatus.notPlaced}>Not Placed</SelectItem>
                        <SelectItem value={PlacementStatus.placed}>Placed</SelectItem>
                        <SelectItem value={PlacementStatus.employed}>Employed</SelectItem>
                        <SelectItem value={PlacementStatus.completed}>Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employer Name */}
                  <div className="space-y-2">
                    <Label htmlFor="employer-name">Employer Name</Label>
                    <Input
                      id="employer-name"
                      type="text"
                      placeholder="Enter employer name"
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                    />
                  </div>

                  {/* Job Role */}
                  <div className="space-y-2">
                    <Label htmlFor="job-role">Job Role</Label>
                    <Input
                      id="job-role"
                      type="text"
                      placeholder="Enter job role"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                    />
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  {/* Shift Schedule */}
                  <div className="space-y-2">
                    <Label htmlFor="shift-schedule">Shift Schedule</Label>
                    <Input
                      id="shift-schedule"
                      type="text"
                      placeholder="e.g., Monday-Friday 9am-5pm"
                      value={shiftSchedule}
                      onChange={(e) => setShiftSchedule(e.target.value)}
                    />
                  </div>

                  {/* Transportation Plan */}
                  <div className="space-y-2">
                    <Label htmlFor="transportation-plan">Transportation Plan</Label>
                    <Input
                      id="transportation-plan"
                      type="text"
                      placeholder="e.g., Bus route 42, Personal vehicle"
                      value={transportationPlan}
                      onChange={(e) => setTransportationPlan(e.target.value)}
                    />
                  </div>

                  {/* Placement Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="placement-notes">Placement Notes</Label>
                    <Textarea
                      id="placement-notes"
                      placeholder="Add notes about placement..."
                      value={placementNotes}
                      onChange={(e) => setPlacementNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Separator className="my-6" />

                  {/* Follow-Up and Support Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Follow-Up and Support</h3>
                      <p className="text-sm text-muted-foreground">
                        Use this section to flag and document clients who need follow-up or additional support.
                      </p>
                    </div>

                    {/* Needs Attention */}
                    <div className="space-y-2">
                      <Label htmlFor="needs-attention">Needs attention</Label>
                      <Select 
                        value={needsAttention ? 'yes' : 'no'} 
                        onValueChange={(value) => setNeedsAttention(value === 'yes')}
                      >
                        <SelectTrigger id="needs-attention">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Follow-Up Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="follow-up-notes">Follow-Up Notes</Label>
                      <Textarea
                        id="follow-up-notes"
                        placeholder="Add follow-up notes..."
                        value={followUpNotes}
                        onChange={(e) => setFollowUpNotes(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Weekly Check-In Section - Only show when Employed */}
                  {placementStatus === PlacementStatus.employed && (
                    <>
                      <Separator className="my-6" />
                      
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">Weekly Check-In</h3>
                          <p className="text-sm text-muted-foreground">Track weekly attendance and issues</p>
                        </div>

                        {/* Attendance OK */}
                        <div className="space-y-2">
                          <Label htmlFor="attendance-ok">Attendance OK</Label>
                          <Select 
                            value={attendanceOk ? 'yes' : 'no'} 
                            onValueChange={(value) => setAttendanceOk(value === 'yes')}
                          >
                            <SelectTrigger id="attendance-ok">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Issues Reported */}
                        <div className="space-y-2">
                          <Label htmlFor="issues-reported">Issues Reported</Label>
                          <Select 
                            value={issuesReported ? 'yes' : 'no'} 
                            onValueChange={(value) => setIssuesReported(value === 'yes')}
                          >
                            <SelectTrigger id="issues-reported">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Weekly Notes */}
                        <div className="space-y-2">
                          <Label htmlFor="weekly-notes">Weekly Notes</Label>
                          <Textarea
                            id="weekly-notes"
                            placeholder="Add notes from this week's check-in..."
                            value={weeklyNotes}
                            onChange={(e) => setWeeklyNotes(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={updatePlacementMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updatePlacementMutation.isPending ? 'Saving...' : 'Save Record'}
                  </Button>
                </>
              )}
            </>
          )}

          {!selectedClientId && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Select a client to view and manage their placement & employment record
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
