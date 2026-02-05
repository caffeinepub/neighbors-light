import { useState } from 'react';
import { useCreateReferral } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Client } from '../backend';
import { validateReferralForm, hasValidationErrors, type ValidationErrors } from '../utils/referralValidation';

export default function PublicReferralPage() {
  const createReferral = useCreateReferral();

  const [partnerAgencyName, setPartnerAgencyName] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [clientName, setClientName] = useState('');
  const [reason, setReason] = useState('');
  const [programRequested, setProgramRequested] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState('');
  const [referralPartnerConfirm, setReferralPartnerConfirm] = useState(false);
  const [referringAgency, setReferringAgency] = useState('');
  const [website, setWebsite] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [checkboxError, setCheckboxError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the required checkbox
    if (!referralPartnerConfirm) {
      setCheckboxError('You must confirm that you are a case manager or referral partner');
      toast.error('Please confirm that you are a case manager or referral partner');
      return;
    }
    setCheckboxError('');

    const errors = validateReferralForm({
      partnerAgencyName,
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
      setSubmitted(true);
      toast.success('Referral submitted successfully');
    } catch (error) {
      toast.error('Failed to submit referral. Please try again.');
      console.error(error);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <h2 className="text-2xl font-bold text-center">Referral Submitted Successfully</h2>
            <p className="text-center text-muted-foreground">
              Thank you for submitting a referral. Our staff will review it and contact you soon.
            </p>
            <Button
              onClick={() => {
                setSubmitted(false);
                setPartnerAgencyName('');
                setReferrerName('');
                setClientName('');
                setReason('');
                setProgramRequested('');
                setContactInfo('');
                setNotes('');
                setSource('');
                setReferralPartnerConfirm(false);
                setReferringAgency('');
                setWebsite('');
              }}
              variant="outline"
            >
              Submit Another Referral
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/neighbors-light-logo-transparent.dim_200x200.png"
              alt="Neighbors Light Logo"
              className="h-10 w-10"
            />
            <h1 className="text-xl font-bold">Neighbors Light</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Submit a Referral</CardTitle>
            <CardDescription>
              Submit a client referral for review by our staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="referral_partner_confirm" className="flex items-start gap-2">
                  <Checkbox
                    id="referral_partner_confirm"
                    checked={referralPartnerConfirm}
                    onCheckedChange={(checked) => {
                      setReferralPartnerConfirm(checked === true);
                      if (checked) setCheckboxError('');
                    }}
                    className={checkboxError ? 'border-destructive' : ''}
                  />
                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    I am a case manager or referral partner submitting this referral. <span className="text-destructive">*</span>
                  </span>
                </Label>
                {checkboxError && (
                  <p className="text-sm text-destructive ml-6">{checkboxError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referring_agency">
                  Agency or organization name (optional)
                </Label>
                <Input
                  id="referring_agency"
                  value={referringAgency}
                  onChange={(e) => setReferringAgency(e.target.value)}
                  placeholder="Enter your agency or organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partnerAgencyName">
                  Partner Agency Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="partnerAgencyName"
                  value={partnerAgencyName}
                  onChange={(e) => setPartnerAgencyName(e.target.value)}
                  placeholder="Enter partner agency name"
                  required
                />
                {validationErrors.partnerAgencyName && (
                  <p className="text-sm text-destructive">{validationErrors.partnerAgencyName}</p>
                )}
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

              <div className="space-y-2 pt-8">
                <Label htmlFor="website">
                  Website (leave blank)
                </Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder=""
                  className="text-sm"
                  tabIndex={-1}
                />
                <p className="text-sm text-muted-foreground">
                  Please leave this field empty.
                </p>
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
      </main>

      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2026. Built with love using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
