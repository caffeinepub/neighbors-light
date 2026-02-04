import { useGetAdminStatusCheck } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminStatusCheckCard() {
  const { data: statusInfo, isLoading, isError, error } = useGetAdminStatusCheck();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Status Check
          </CardTitle>
          <CardDescription>Loading admin status information...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Status Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load admin status: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!statusInfo) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Status Check
        </CardTitle>
        <CardDescription>Current admin status and principal information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Your Principal:</span>
            <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
              {statusInfo.callerPrincipal.toString()}
            </code>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Admin Status:</span>
            <Badge variant={statusInfo.isAdmin ? 'default' : 'secondary'} className="gap-1">
              {statusInfo.isAdmin ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Admin
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Not Admin
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <h4 className="text-sm font-medium">All Admin Principals ({statusInfo.allAdminPrincipals.length})</h4>
          {statusInfo.allAdminPrincipals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins found</p>
          ) : (
            <div className="space-y-1">
              {statusInfo.allAdminPrincipals.map((principal, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
                >
                  <Shield className="h-3 w-3 text-primary" />
                  <code className="text-xs font-mono flex-1 truncate">
                    {principal.toString()}
                  </code>
                  {principal.toString() === statusInfo.callerPrincipal.toString() && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
