import { useState } from 'react';
import { useGetAllFacilities, useCreateFacility, useCreateBed, useGetAllBeds } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, Building2, BedDouble, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Program } from '../backend';

const MAX_ACTIVE_BEDS = 12;

export default function FacilitiesTab() {
  const { data: facilities = [], isLoading } = useGetAllFacilities();
  const { data: beds = [] } = useGetAllBeds();
  const createFacility = useCreateFacility();
  const createBed = useCreateBed();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [facilityType, setFacilityType] = useState('');
  const [address, setAddress] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const [isAddBedOpen, setIsAddBedOpen] = useState(false);
  const [selectedFacilityId, setSelectedFacilityId] = useState<bigint | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program>(Program.medicalStepDown);
  const [bedNumber, setBedNumber] = useState('');

  const activeBedCount = beds.filter((bed) => !bed.isArchived).length;
  const canAddBed = activeBedCount < MAX_ACTIVE_BEDS;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !facilityType.trim() || !address.trim() || !contactInfo.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createFacility.mutateAsync({
        name: name.trim(),
        facilityType: facilityType.trim(),
        address: address.trim(),
        contactInfo: contactInfo.trim(),
      });
      toast.success('Facility created successfully');
      setIsCreateOpen(false);
      setName('');
      setFacilityType('');
      setAddress('');
      setContactInfo('');
    } catch (error) {
      toast.error('Failed to create facility');
      console.error(error);
    }
  };

  // IMPORTANT: Bed creation must only occur via explicit user action (form submission).
  // This function is only called when the user submits the "Add Bed" form.
  // Beds must NOT be auto-created, seeded, or initialized by the frontend on mount or startup.
  // Bed data persistence requires that bed inventory changes only through deliberate Admin actions.
  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFacilityId) {
      toast.error('No facility selected');
      return;
    }

    if (!bedNumber.trim()) {
      toast.error('Please enter a bed number');
      return;
    }

    if (!canAddBed) {
      toast.error(`Cannot add bed. Maximum of ${MAX_ACTIVE_BEDS} active beds reached.`);
      return;
    }

    try {
      await createBed.mutateAsync({ 
        facilityId: selectedFacilityId, 
        program: selectedProgram,
        bedNumber: bedNumber.trim()
      });
      toast.success('Bed added successfully');
      setIsAddBedOpen(false);
      setSelectedFacilityId(null);
      setSelectedProgram(Program.medicalStepDown);
      setBedNumber('');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add bed';
      if (errorMessage.includes('Maximum of 12 active beds reached')) {
        toast.error(`Cannot add bed. Maximum of ${MAX_ACTIVE_BEDS} active beds reached.`);
      } else {
        toast.error(errorMessage);
      }
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Facilities Management</h2>
          <p className="text-sm text-muted-foreground">Manage shelters and facilities</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Facility
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Facility</DialogTitle>
              <DialogDescription>Add a new shelter or facility to the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Facility Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Downtown Shelter"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facilityType">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="facilityType"
                  value={facilityType}
                  onChange={(e) => setFacilityType(e.target.value)}
                  placeholder="e.g., Emergency Shelter, Transitional"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createFacility.isPending} className="flex-1">
                  {createFacility.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Facility'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : facilities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-center text-muted-foreground">
              No facilities yet. Create your first facility to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <Card key={facility.id.toString()}>
              <CardHeader>
                <CardTitle className="text-base">{facility.name}</CardTitle>
                <CardDescription className="text-xs">{facility.facilityType}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    <span className="font-medium">Address:</span> {facility.address}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Contact:</span> {facility.contactInfo}
                  </p>
                </div>

                <Dialog
                  open={isAddBedOpen && selectedFacilityId === facility.id}
                  onOpenChange={(open) => {
                    setIsAddBedOpen(open);
                    if (open) {
                      setSelectedFacilityId(facility.id);
                      setSelectedProgram(Program.medicalStepDown);
                      setBedNumber('');
                    } else {
                      setSelectedFacilityId(null);
                      setBedNumber('');
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      disabled={!canAddBed}
                    >
                      <BedDouble className="mr-2 h-4 w-4" />
                      Add Bed
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Bed to {facility.name}</DialogTitle>
                      <DialogDescription>Enter bed details</DialogDescription>
                    </DialogHeader>
                    
                    {!canAddBed && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Cannot add bed. Maximum of {MAX_ACTIVE_BEDS} active beds reached. Archive existing beds to add new ones.
                        </AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleAddBed} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bedNumber">
                          Bed Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="bedNumber"
                          value={bedNumber}
                          onChange={(e) => setBedNumber(e.target.value)}
                          placeholder="e.g., A-101"
                          required
                          disabled={!canAddBed}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="program">
                          Program Type <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={selectedProgram}
                          onValueChange={(value) => setSelectedProgram(value as Program)}
                          disabled={!canAddBed}
                        >
                          <SelectTrigger id="program">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={Program.medicalStepDown}>Medical Step-Down</SelectItem>
                            <SelectItem value={Program.workforceHousing}>Workforce Housing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {canAddBed && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Active beds: {activeBedCount} / {MAX_ACTIVE_BEDS}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsAddBedOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createBed.isPending || !canAddBed} 
                          className="flex-1"
                        >
                          {createBed.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Bed'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
