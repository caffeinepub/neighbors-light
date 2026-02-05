import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetAllIntakes, useGetTrainingRecord, useUpdateTrainingRecord } from '../hooks/useQueries';
import { Variant_notStarted_complete_inProgress, Variant_foodService_maintenance_janitorial } from '../backend';
import { AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

const CORE_CHECKLIST_ITEMS = [
  'Attendance and punctuality',
  'Communication with supervisor',
  'Schedules and pay basics',
  'Workplace conduct and boundaries',
  'Basic safety',
];

const TRACK_CHECKLIST_ITEMS = {
  janitorial: [
    'Chemical safety',
    'Equipment basics',
    'Cleaning checklist standards',
    'PPE and safety',
  ],
  maintenance: [
    'Tool safety',
    'Turnover prep tasks',
    'Groundskeeping basics',
    'When to escalate issues',
  ],
  foodService: [
    'Sanitation and handwashing',
    'Food handling basics',
    'Kitchen workflow',
    'Food safety rules',
  ],
};

export default function TrainingTab() {
  const [selectedClientId, setSelectedClientId] = useState<bigint | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<Variant_notStarted_complete_inProgress>(
    Variant_notStarted_complete_inProgress.notStarted
  );
  const [track, setTrack] = useState<Variant_foodService_maintenance_janitorial>(
    Variant_foodService_maintenance_janitorial.janitorial
  );
  const [coreChecklist, setCoreChecklist] = useState<boolean[]>(Array(5).fill(false));
  const [trackChecklist, setTrackChecklist] = useState<boolean[]>(Array(4).fill(false));
  const [staffNotes, setStaffNotes] = useState('');

  const { data: intakes, isLoading: intakesLoading, error: intakesError } = useGetAllIntakes();
  const { data: trainingRecord, isLoading: recordLoading, refetch: refetchRecord } = useGetTrainingRecord(selectedClientId);
  const updateTrainingMutation = useUpdateTrainingRecord();

  // Load training record when client is selected
  const handleClientSelect = (clientId: string) => {
    const id = BigInt(clientId);
    setSelectedClientId(id);
    
    // Fetch will happen automatically via React Query
    setTimeout(() => {
      refetchRecord();
    }, 100);
  };

  // Update local state when training record loads
  useState(() => {
    if (trainingRecord) {
      setTrainingStatus(trainingRecord.trainingStatus);
      setTrack(trainingRecord.track);
      setCoreChecklist(trainingRecord.checklist.core);
      setTrackChecklist(trainingRecord.checklist.track);
      setStaffNotes(trainingRecord.staffNotes);
    }
  });

  // Reset track checklist when track changes
  const handleTrackChange = (newTrack: string) => {
    const trackValue = newTrack as Variant_foodService_maintenance_janitorial;
    setTrack(trackValue);
    
    // Keep existing values if they exist, otherwise reset
    if (trainingRecord && trainingRecord.track === trackValue) {
      setTrackChecklist(trainingRecord.checklist.track);
    } else {
      setTrackChecklist(Array(4).fill(false));
    }
  };

  const handleSave = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client');
      return;
    }

    try {
      await updateTrainingMutation.mutateAsync({
        clientId: selectedClientId,
        trainingStatus,
        track,
        checklist: {
          core: coreChecklist,
          track: trackChecklist,
        },
        staffNotes,
      });
      toast.success('Training record saved successfully');
      refetchRecord();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save training record');
    }
  };

  const getTrackItems = () => {
    switch (track) {
      case Variant_foodService_maintenance_janitorial.janitorial:
        return TRACK_CHECKLIST_ITEMS.janitorial;
      case Variant_foodService_maintenance_janitorial.maintenance:
        return TRACK_CHECKLIST_ITEMS.maintenance;
      case Variant_foodService_maintenance_janitorial.foodService:
        return TRACK_CHECKLIST_ITEMS.foodService;
      default:
        return TRACK_CHECKLIST_ITEMS.janitorial;
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
          <CardTitle>Training Management</CardTitle>
          <CardDescription>Manage client training records and track progress</CardDescription>
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
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : (
                <>
                  {/* Training Status */}
                  <div className="space-y-2">
                    <Label htmlFor="training-status">Training Status</Label>
                    <Select
                      value={trainingStatus}
                      onValueChange={(value) => setTrainingStatus(value as Variant_notStarted_complete_inProgress)}
                    >
                      <SelectTrigger id="training-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Variant_notStarted_complete_inProgress.notStarted}>Not Started</SelectItem>
                        <SelectItem value={Variant_notStarted_complete_inProgress.inProgress}>In Progress</SelectItem>
                        <SelectItem value={Variant_notStarted_complete_inProgress.complete}>Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Track Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="track-select">Track</Label>
                    <Select value={track} onValueChange={handleTrackChange}>
                      <SelectTrigger id="track-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Variant_foodService_maintenance_janitorial.janitorial}>
                          Janitorial/Cleaning
                        </SelectItem>
                        <SelectItem value={Variant_foodService_maintenance_janitorial.maintenance}>
                          Property Maintenance
                        </SelectItem>
                        <SelectItem value={Variant_foodService_maintenance_janitorial.foodService}>
                          Food Service
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Core Training Checklist */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Core Training Checklist</Label>
                    <div className="space-y-3 rounded-lg border p-4">
                      {CORE_CHECKLIST_ITEMS.map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Checkbox
                            id={`core-${index}`}
                            checked={coreChecklist[index]}
                            onCheckedChange={(checked) => {
                              const newChecklist = [...coreChecklist];
                              newChecklist[index] = checked === true;
                              setCoreChecklist(newChecklist);
                            }}
                          />
                          <Label htmlFor={`core-${index}`} className="cursor-pointer font-normal">
                            {item}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Track-Specific Checklist */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Track-Specific Training</Label>
                    <div className="space-y-3 rounded-lg border p-4">
                      {getTrackItems().map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Checkbox
                            id={`track-${index}`}
                            checked={trackChecklist[index]}
                            onCheckedChange={(checked) => {
                              const newChecklist = [...trackChecklist];
                              newChecklist[index] = checked === true;
                              setTrackChecklist(newChecklist);
                            }}
                          />
                          <Label htmlFor={`track-${index}`} className="cursor-pointer font-normal">
                            {item}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Staff Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="staff-notes">Staff Notes</Label>
                    <Textarea
                      id="staff-notes"
                      placeholder="Add notes about training progress, observations, or concerns..."
                      value={staffNotes}
                      onChange={(e) => setStaffNotes(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={updateTrainingMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateTrainingMutation.isPending ? 'Saving...' : 'Save Training Record'}
                  </Button>
                </>
              )}
            </>
          )}

          {!selectedClientId && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Select a client to view and manage their training record
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
