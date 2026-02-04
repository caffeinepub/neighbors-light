import { useState } from 'react';
import { useCreateAccessRequest } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2, CheckCircle2, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface RequestAccessFormProps {
  onBack: () => void;
}

export default function RequestAccessForm({ onBack }: RequestAccessFormProps) {
  const [agencyName, setAgencyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const createRequest = useCreateAccessRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agencyName.trim() || !contactName.trim() || !phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createRequest.mutateAsync({
        agencyName: agencyName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        notes: notes.trim() || null,
      });

      setSubmitted(true);
      toast.success('Access request submitted successfully');
    } catch (error) {
      console.error('Error submitting access request:', error);
      toast.error('Failed to submit access request. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
        <header className="flex items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/neighbors-light-logo-transparent.dim_200x200.png"
              alt="Neighbors Light"
              className="h-10 w-10 sm:h-12 sm:w-12"
            />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
              Neighbors Light
            </h1>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Request Submitted</CardTitle>
              <CardDescription>
                Your access request has been successfully submitted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-2">What happens next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>An administrator will review your request</li>
                  <li>You'll be contacted via the information you provided</li>
                  <li>Once approved, you can log in with Internet Identity</li>
                  <li>You'll be assigned the Partner Agency role</li>
                </ul>
              </div>
              <Button onClick={onBack} className="w-full">
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </main>

        <footer className="border-t border-gray-200 px-4 py-6 text-center dark:border-gray-800">
          <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
            © 2025. Built with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/neighbors-light-logo-transparent.dim_200x200.png"
            alt="Neighbors Light"
            className="h-10 w-10 sm:h-12 sm:w-12"
          />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Neighbors Light
          </h1>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="w-fit -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
            <CardTitle className="text-2xl">Request Access</CardTitle>
            <CardDescription>
              Submit your information to request access to Neighbors Light
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactName">
                  Contact Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
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
                  placeholder="Enter your phone number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information you'd like to share"
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createRequest.isPending}
              >
                {createRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-gray-200 px-4 py-6 text-center dark:border-gray-800">
        <p className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          © 2025. Built with <Heart className="h-4 w-4 fill-red-500 text-red-500" /> using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
