import { useState } from 'react';
import { useGetAllUsers, useAssignUserRole } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UserCheck, UserX, Shield, Users as UsersIcon, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import type { Principal } from '@dfinity/principal';
import type { UserProfile } from '../backend';

export default function UserManagementTab() {
  const { data: allUsers = [], isLoading } = useGetAllUsers();
  const assignRole = useAssignUserRole();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});

  const handleAssignRole = async (userPrincipal: Principal, role: string) => {
    try {
      await assignRole.mutateAsync({ user: userPrincipal, role });
      toast.success(`Role "${role}" assigned successfully`);
      // Clear the selected role for this user
      setSelectedRoles(prev => {
        const updated = { ...prev };
        delete updated[userPrincipal.toString()];
        return updated;
      });
    } catch (error: any) {
      console.error('Error assigning role:', error);
      toast.error(error.message || 'Failed to assign role');
    }
  };

  const getRoleBadge = (role: string | null | undefined) => {
    if (!role) {
      return (
        <Badge variant="outline" className="gap-1">
          <UserX className="h-3 w-3" />
          No Role
        </Badge>
      );
    }

    switch (role) {
      case 'Admin':
        return (
          <Badge className="gap-1 bg-red-500 hover:bg-red-600">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        );
      case 'Staff':
        return (
          <Badge className="gap-1 bg-blue-500 hover:bg-blue-600">
            <UsersIcon className="h-3 w-3" />
            Staff
          </Badge>
        );
      case 'PartnerAgency':
        return (
          <Badge className="gap-1 bg-green-500 hover:bg-green-600">
            <Briefcase className="h-3 w-3" />
            Partner Agency
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {role}
          </Badge>
        );
    }
  };

  const pendingUsers = allUsers.filter(([_, profile]) => !profile.role);
  const activeUsers = allUsers.filter(([_, profile]) => !!profile.role);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage user roles and approve pending access requests
        </p>
      </div>

      {/* Pending Users Section */}
      {pendingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Access Pending ({pendingUsers.length})
            </CardTitle>
            <CardDescription>
              Users awaiting role assignment and approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingUsers.map(([principal, profile]) => {
                const principalStr = principal.toString();
                const selectedRole = selectedRoles[principalStr];

                return (
                  <div
                    key={principalStr}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {profile.name || 'Unnamed User'}
                        </p>
                        {getRoleBadge(profile.role)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {principalStr}
                      </p>
                      {profile.email && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {profile.email}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedRole || ''}
                        onValueChange={(value) => {
                          setSelectedRoles(prev => ({ ...prev, [principalStr]: value }));
                        }}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                          <SelectItem value="PartnerAgency">Partner Agency</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleAssignRole(principal, selectedRole)}
                        disabled={!selectedRole || assignRole.isPending}
                        size="sm"
                      >
                        {assignRole.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Approve'
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Active Users ({activeUsers.length})
          </CardTitle>
          <CardDescription>
            Users with assigned roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active users yet
            </p>
          ) : (
            <div className="space-y-3">
              {activeUsers.map(([principal, profile]) => {
                const principalStr = principal.toString();

                return (
                  <div
                    key={principalStr}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {profile.name || 'Unnamed User'}
                        </p>
                        {getRoleBadge(profile.role)}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {principalStr}
                      </p>
                      {profile.email && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {profile.email}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {allUsers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
