import { useState } from 'react';
import { useGetPendingRequests, useApproveRequest, useDeleteRequest } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, UserPlus, Trash2, Clock, Mail, Phone, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import type { AccessRequest } from '../backend';

export default function AccessRequestsTab() {
  const { data: requests = [], isLoading } = useGetPendingRequests();
  const approveRequest = useApproveRequest();
  const deleteRequest = useDeleteRequest();

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [principalId, setPrincipalId] = useState('');

  const handleApprove = (request: AccessRequest) => {
    setSelectedRequest(request);
    setPrincipalId('');
    setApproveDialogOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest || !principalId.trim()) {
      toast.error('Please enter a valid Principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(principalId.trim());
      await approveRequest.mutateAsync({
        requestId: selectedRequest.id,
        userId: principal,
      });
      toast.success('Access request approved and Partner Agency role assigned');
      setApproveDialogOpen(false);
      setSelectedRequest(null);
      setPrincipalId('');
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request. Please check the Principal ID and try again.');
    }
  };

  const handleDelete = async (requestId: bigint) => {
    if (!confirm('Are you sure you want to delete this access request?')) {
      return;
    }

    try {
      await deleteRequest.mutateAsync(requestId);
      toast.success('Access request deleted');
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
          <p className="text-sm text-muted-foreground text-center">
            There are no access requests waiting for approval at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Access Requests</h2>
            <p className="text-sm text-muted-foreground">
              Review and approve pending access requests from partner agencies
            </p>
          </div>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {requests.length} Pending
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <Card key={request.id.toString()}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{request.agencyName}</CardTitle>
                    <CardDescription>
                      Submitted {new Date(Number(request.createdAt) / 1000000).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Contact:</span>
                    <span className="text-muted-foreground">{request.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span className="text-muted-foreground">{request.phone}</span>
                  </div>
                  {request.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span className="text-muted-foreground">{request.email}</span>
                    </div>
                  )}
                  {request.notes && (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className="text-muted-foreground">{request.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(request)}
                    className="flex-1"
                    disabled={approveRequest.isPending}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleDelete(request.id)}
                    variant="outline"
                    disabled={deleteRequest.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Access Request</DialogTitle>
            <DialogDescription>
              Enter the user's Internet Identity Principal ID to approve their request and assign the Partner Agency role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
                <p><span className="font-medium">Agency:</span> {selectedRequest.agencyName}</p>
                <p><span className="font-medium">Contact:</span> {selectedRequest.contactName}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="principalId">User Principal ID</Label>
              <Input
                id="principalId"
                value={principalId}
                onChange={(e) => setPrincipalId(e.target.value)}
                placeholder="Enter the user's Principal ID"
              />
              <p className="text-xs text-muted-foreground">
                The user must log in with Internet Identity first to obtain their Principal ID
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={approveRequest.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmApprove}
              disabled={approveRequest.isPending || !principalId.trim()}
            >
              {approveRequest.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve & Assign Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
