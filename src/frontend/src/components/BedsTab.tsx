import { useState, useEffect } from 'react';
import { useGetAllBeds, useGetAllFacilities, useAssignBed, useUpdateBed, useArchiveBed, useDeleteBed, useGetAllIntakes } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BedDouble, Loader2, UserPlus, Edit, Archive, Trash2, RotateCcw, FilterX, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Bed, Client, Status__1, Program } from '../backend';
import {
  loadBedTrackingPreferences,
  saveBedTrackingPreferences,
  clearBedTrackingPreferences,
  getDefaultPreferences,
} from '../utils/bedTrackingPreferences';
import { isBedAtRisk, getBedAtRiskLabel } from '../utils/atRisk';

interface BedsTabProps {
  isAdmin: boolean;
}

// IMPORTANT: This component must remain read-only on initial render (beyond queries).
// All bed mutations (assign, update, archive, delete) must only execute in direct response
// to explicit user actions (form submits / confirmation dialogs).
// Bed data persistence requires that no automatic effects or startup logic mutate bed records.
export default function BedsTab({ isAdmin }: BedsTabProps) {
  const { data: beds = [], isLoading: bedsLoading } = useGetAllBeds();
  const { data: facilities = [] } = useGetAllFacilities();
  const { data: intakes = [] } = useGetAllIntakes();
  const assignBed = useAssignBed();
  const updateBed = useUpdateBed();
  const archiveBed = useArchiveBed();
  const deleteBed = useDeleteBed();

  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');

  // Initialize filter state from localStorage for Admin, defaults for Staff
  const [programFilter, setProgramFilter] = useState<string>(() => {
    if (isAdmin) {
      return loadBedTrackingPreferences().programFilter;
    }
    return 'all';
  });

  const [statusFilter, setStatusFilter] = useState<string>(() => {
    if (isAdmin) {
      return loadBedTrackingPreferences().statusFilter;
    }
    return 'available';
  });

  const [showArchived, setShowArchived] = useState<boolean>(() => {
    if (isAdmin) {
      return loadBedTrackingPreferences().showArchived;
    }
    return false;
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editBedNumber, setEditBedNumber] = useState('');
  const [editProgram, setEditProgram] = useState<Program>(Program.medicalStepDown);
  const [editStatus, setEditStatus] = useState<Status__1>(Status__1.available);
  const [editClientName, setEditClientName] = useState('');
  const [editContactInfo, setEditContactInfo] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Save preferences to localStorage when filters change (Admin only)
  useEffect(() => {
    if (isAdmin) {
      saveBedTrackingPreferences({
        programFilter,
        statusFilter,
        showArchived,
      });
    }
  }, [programFilter, statusFilter, showArchived, isAdmin]);

  const handleResetFilters = () => {
    const defaults = getDefaultPreferences();
    setProgramFilter(defaults.programFilter);
    setStatusFilter(defaults.statusFilter);
    setShowArchived(defaults.showArchived);
    clearBedTrackingPreferences();
    toast.success('Filters reset to defaults');
  };

  // IMPORTANT: All bed mutation handlers below are only called in response to explicit user actions.
  // They must NOT be invoked automatically on mount, during effects, or through any startup logic.
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBed || !clientName.trim() || !contactInfo.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const client: Client = {
      name: clientName.trim(),
      contactInfo: contactInfo.trim(),
      notes: notes.trim() || undefined,
    };

    try {
      await assignBed.mutateAsync({ bedId: selectedBed.id, client });
      toast.success('Bed assigned successfully');
      setIsAssignOpen(false);
      setSelectedBed(null);
      setClientName('');
      setContactInfo('');
      setNotes('');
    } catch (error) {
      toast.error('Failed to assign bed');
      console.error(error);
    }
  };

  const handleEditBed = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBed || !editBedNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    let occupant: Client | null = null;
    if (editStatus === Status__1.occupied) {
      if (!editClientName.trim() || !editContactInfo.trim()) {
        toast.error('Client name and contact info are required for occupied beds');
        return;
      }
      occupant = {
        name: editClientName.trim(),
        contactInfo: editContactInfo.trim(),
        notes: editNotes.trim() || undefined,
      };
    }

    try {
      await updateBed.mutateAsync({ 
        bedId: selectedBed.id, 
        program: editProgram, 
        bedNumber: editBedNumber.trim(),
        status: editStatus,
        occupant,
        archived: selectedBed.isArchived,
      });
      toast.success('Bed updated successfully');
      setIsEditOpen(false);
      setSelectedBed(null);
      setEditBedNumber('');
      setEditProgram(Program.medicalStepDown);
      setEditStatus(Status__1.available);
      setEditClientName('');
      setEditContactInfo('');
      setEditNotes('');
    } catch (error) {
      toast.error('Failed to update bed');
      console.error(error);
    }
  };

  const handleArchiveBed = async (bedId: bigint) => {
    if (!isAdmin) {
      toast.error('Only Admin users can archive beds');
      return;
    }

    try {
      await archiveBed.mutateAsync(bedId);
      toast.success('Bed archived successfully');
    } catch (error) {
      toast.error('Failed to archive bed');
      console.error(error);
    }
  };

  const handleDeleteBed = async (bedId: bigint) => {
    if (!isAdmin) {
      toast.error('Only Admin users can delete beds');
      return;
    }

    try {
      await deleteBed.mutateAsync(bedId);
      toast.success('Bed deleted successfully');
    } catch (error) {
      toast.error('Failed to delete bed');
      console.error(error);
    }
  };

  const getFacilityName = (facilityId: bigint) => {
    const facility = facilities.find((f) => f.id === facilityId);
    return facility?.name || `Facility ${facilityId}`;
  };

  const getStatusBadgeVariant = (status: Status__1) => {
    switch (status) {
      case Status__1.available:
        return 'default';
      case Status__1.occupied:
        return 'secondary';
      case Status__1.maintenance:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getProgramLabel = (program: Program) => {
    switch (program) {
      case Program.medicalStepDown:
        return 'Medical Step-Down';
      case Program.workforceHousing:
        return 'Workforce Housing';
      default:
        return program;
    }
  };

  const filteredBeds = beds.filter((bed) => {
    const matchesArchiveFilter = showArchived ? bed.isArchived : !bed.isArchived;
    const matchesProgramFilter = programFilter === 'all' || bed.program === programFilter;
    const matchesStatusFilter = statusFilter === 'all' || bed.status === statusFilter;
    return matchesArchiveFilter && matchesProgramFilter && matchesStatusFilter;
  });

  const sortedBeds = [...filteredBeds].sort((a, b) => {
    if (a.status === Status__1.available && b.status !== Status__1.available) return -1;
    if (a.status !== Status__1.available && b.status === Status__1.available) return 1;
    return Number(a.id) - Number(b.id);
  });

  const activeBeds = beds.filter((b) => !b.isArchived);
  const archivedBeds = beds.filter((b) => b.isArchived);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Bed Tracking</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and assign available beds
            {isAdmin && archivedBeds.length > 0 && (
              <span className="ml-2 text-xs">
                ({activeBeds.length} active, {archivedBeds.length} archived)
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {beds.length > 0 && (
            <>
              <div className="w-full sm:w-48">
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value={Program.medicalStepDown}>Medical Step-Down</SelectItem>
                    <SelectItem value={Program.workforceHousing}>Workforce Housing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={Status__1.available}>Available</SelectItem>
                    <SelectItem value={Status__1.occupied}>Occupied</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && archivedBeds.length > 0 && (
                <Button
                  variant={showArchived ? 'default' : 'outline'}
                  onClick={() => setShowArchived(!showArchived)}
                >
                  {showArchived ? 'Show Active' : 'Show Archived'}
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleResetFilters}
                  title="Reset filters to defaults"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {bedsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : beds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BedDouble className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              No beds in the system yet. {isAdmin && 'Create facilities and beds to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : sortedBeds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <FilterX className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="text-muted-foreground font-medium">
                No beds match your saved filters.
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your filters or clear them to see all beds.
              </p>
            </div>
            <Button onClick={handleResetFilters} variant="outline" className="mt-2">
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedBeds.map((bed) => {
            const atRisk = isBedAtRisk(bed, intakes);
            return (
              <Card 
                key={bed.id.toString()} 
                className={`${bed.isArchived ? 'opacity-60 border-dashed' : ''} ${
                  atRisk ? 'border-warning bg-warning/5' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        Bed {bed.bedNumber || `#${bed.id.toString()}`}
                        {atRisk && <AlertTriangle className="h-4 w-4 text-warning" />}
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs">
                        {getFacilityName(bed.facilityId)}
                      </CardDescription>
                      {atRisk && (
                        <Badge variant="outline" className="mt-2 border-warning text-warning">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          At Risk - {getBedAtRiskLabel()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant={getStatusBadgeVariant(bed.status)}>{bed.status}</Badge>
                      {bed.isArchived && <Badge variant="outline">Archived</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">Program</p>
                    <p className="text-sm font-semibold">{getProgramLabel(bed.program)}</p>
                  </div>

                  {bed.occupant && (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium">{bed.occupant.name}</p>
                      <p className="text-xs text-muted-foreground">{bed.occupant.contactInfo}</p>
                      {bed.occupant.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">{bed.occupant.notes}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {bed.status === Status__1.available && !bed.isArchived && (
                      <Dialog
                        open={isAssignOpen && selectedBed?.id === bed.id}
                        onOpenChange={(open) => {
                          setIsAssignOpen(open);
                          if (open) setSelectedBed(bed);
                          else setSelectedBed(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" className="w-full">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Assign Client
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Assign Bed {bed.bedNumber || `#${bed.id.toString()}`}</DialogTitle>
                            <DialogDescription>Assign this bed to a client</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAssign} className="space-y-4">
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
                              <Label htmlFor="notes">Notes (Optional)</Label>
                              <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Additional information"
                                rows={2}
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAssignOpen(false)}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={assignBed.isPending} className="flex-1">
                                {assignBed.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Assigning...
                                  </>
                                ) : (
                                  'Assign Bed'
                                )}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {isAdmin && (
                      <div className="flex gap-2">
                        <Dialog
                          open={isEditOpen && selectedBed?.id === bed.id}
                          onOpenChange={(open) => {
                            setIsEditOpen(open);
                            if (open) {
                              setSelectedBed(bed);
                              setEditBedNumber(bed.bedNumber);
                              setEditProgram(bed.program);
                              setEditStatus(bed.status);
                              setEditClientName(bed.occupant?.name || '');
                              setEditContactInfo(bed.occupant?.contactInfo || '');
                              setEditNotes(bed.occupant?.notes || '');
                            } else {
                              setSelectedBed(null);
                              setEditBedNumber('');
                              setEditProgram(Program.medicalStepDown);
                              setEditStatus(Status__1.available);
                              setEditClientName('');
                              setEditContactInfo('');
                              setEditNotes('');
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex-1">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Bed {bed.bedNumber || `#${bed.id.toString()}`}</DialogTitle>
                              <DialogDescription>Update bed information</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleEditBed} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="bedNumber">
                                  Bed Number <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id="bedNumber"
                                  value={editBedNumber}
                                  onChange={(e) => setEditBedNumber(e.target.value)}
                                  placeholder="e.g., A-101"
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="editProgram">
                                  Program Type <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={editProgram}
                                  onValueChange={(value) => setEditProgram(value as Program)}
                                >
                                  <SelectTrigger id="editProgram">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={Program.medicalStepDown}>Medical Step-Down</SelectItem>
                                    <SelectItem value={Program.workforceHousing}>Workforce Housing</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="editStatus">
                                  Status <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                  value={editStatus}
                                  onValueChange={(value) => setEditStatus(value as Status__1)}
                                >
                                  <SelectTrigger id="editStatus">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={Status__1.available}>Available</SelectItem>
                                    <SelectItem value={Status__1.occupied}>Occupied</SelectItem>
                                    <SelectItem value={Status__1.maintenance}>Maintenance</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {editStatus === Status__1.occupied && (
                                <>
                                  <div className="space-y-2">
                                    <Label htmlFor="editClientName">
                                      Client Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                      id="editClientName"
                                      value={editClientName}
                                      onChange={(e) => setEditClientName(e.target.value)}
                                      placeholder="Enter client name"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="editContactInfo">
                                      Contact Info <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                      id="editContactInfo"
                                      value={editContactInfo}
                                      onChange={(e) => setEditContactInfo(e.target.value)}
                                      placeholder="Phone or email"
                                      required
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="editNotes">Notes (Optional)</Label>
                                    <Textarea
                                      id="editNotes"
                                      value={editNotes}
                                      onChange={(e) => setEditNotes(e.target.value)}
                                      placeholder="Additional information"
                                      rows={2}
                                    />
                                  </div>
                                </>
                              )}

                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsEditOpen(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={updateBed.isPending} className="flex-1">
                                  {updateBed.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    'Update Bed'
                                  )}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>

                        {!bed.isArchived ? (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="flex-1">
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Archive Bed?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will archive bed {bed.bedNumber || `#${bed.id.toString()}`}. Archived beds are excluded from occupancy metrics and availability counts but remain in the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleArchiveBed(bed.id)}>
                                  Archive
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="flex-1">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Bed?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete bed {bed.bedNumber || `#${bed.id.toString()}`}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteBed(bed.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(Number(bed.lastUpdated) / 1000000).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
