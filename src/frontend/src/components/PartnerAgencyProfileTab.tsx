import { useState, useEffect } from 'react';
import { useGetCallerPartnerAgencyProfile, useSaveCallerPartnerAgencyProfile } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';
import type { PartnerAgencyProfile } from '../backend';

export default function PartnerAgencyProfileTab() {
  const { data: profile, isLoading: profileLoading, isFetched } = useGetCallerPartnerAgencyProfile();
  const saveProfile = useSaveCallerPartnerAgencyProfile();

  const [agencyName, setAgencyName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setAgencyName(profile.agencyName);
      setPrimaryContactName(profile.primaryContactName);
      setPhone(profile.phone);
      setEmail(profile.email);
    }
  }, [profile]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!agencyName.trim()) {
      newErrors.agencyName = 'Agency name is required';
    }

    if (!primaryContactName.trim()) {
      newErrors.primaryContactName = 'Primary contact name is required';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    const profileData: PartnerAgencyProfile = {
      agencyName: agencyName.trim(),
      primaryContactName: primaryContactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
    };

    try {
      await saveProfile.mutateAsync(profileData);
      toast.success('Partner Agency profile saved successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to save profile');
      } else {
        toast.error('Failed to save profile');
      }
      console.error(error);
    }
  };

  if (profileLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Partner Agency Profile</CardTitle>
        </div>
        <CardDescription>
          {profile
            ? 'Update your agency information and primary contact details'
            : 'Complete your agency profile to submit referrals'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agencyName">
              Agency Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="agencyName"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Enter your agency name"
              required
            />
            {errors.agencyName && (
              <p className="text-sm text-destructive">{errors.agencyName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="primaryContactName">
              Primary Contact Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="primaryContactName"
              value={primaryContactName}
              onChange={(e) => setPrimaryContactName(e.target.value)}
              placeholder="Enter primary contact name"
              required
            />
            {errors.primaryContactName && (
              <p className="text-sm text-destructive">{errors.primaryContactName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              required
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <Button type="submit" disabled={saveProfile.isPending} className="w-full">
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
