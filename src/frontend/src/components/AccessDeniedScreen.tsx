import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function AccessDeniedScreen() {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Access Pending</CardTitle>
          <CardDescription>
            Your account is awaiting approval. Please contact an administrator to request access to the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">What's next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>An administrator will review your request</li>
              <li>You'll be assigned a role (Admin, Staff, or Partner Agency)</li>
              <li>Once approved, you can log back in to access the application</li>
            </ul>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
