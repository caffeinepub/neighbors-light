import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Referral, Intake, Bed, Facility, Client, Status, UserRole, Program, Document, AccessRequest, Status__1, UserApprovalInfo, ActivityLogEntry, PartnerAgencyProfile, StatusHistoryEntry, IntakeStatusHistoryEntry, AdminStatusInfo, TrainingRecord, TrainingChecklist, Variant_notStarted_complete_inProgress, Variant_foodService_maintenance_janitorial, PlacementEmployeeRecord } from '../backend';
import { Principal } from '@dfinity/principal';

// Admin Status Queries
export function useIsAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isAdmin();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useGetAdminStatusCheck() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<AdminStatusInfo>({
    queryKey: ['adminStatusCheck'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAdminStatusCheck();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      // Only send fields that are explicitly set, never send role field
      const profileToSave: UserProfile = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        // Explicitly omit role to prevent overwriting existing role
      };
      return actor.saveCallerUserProfile(profileToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

// Partner Agency Profile Queries
export function useGetCallerPartnerAgencyProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<PartnerAgencyProfile | null>({
    queryKey: ['currentPartnerAgencyProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerPartnerAgencyProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerPartnerAgencyProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: PartnerAgencyProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerPartnerAgencyProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentPartnerAgencyProfile'] });
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

// User Management Queries (Admin only)
export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['userApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

// User Approval Queries (Admin only)
export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['userApprovals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, approved }: { user: Principal; approved: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      // ApprovalStatus is { approved: null } or { rejected: null }
      const status = approved ? { approved: null } : { rejected: null };
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userApprovals'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
  });
}

// Activity Log Queries (Admin only)
export function useGetActivityLogEntries(limit: bigint, offset: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<ActivityLogEntry[]>({
    queryKey: ['activityLog', limit.toString(), offset.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActivityLogEntries(limit, offset);
    },
    enabled: !!actor && !isFetching,
  });
}

// Access Request Queries
export function useCreateAccessRequest() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      agencyName,
      contactName,
      phone,
      email,
      notes,
    }: {
      agencyName: string;
      contactName: string;
      phone: string;
      email: string;
      notes: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createAccessRequest(agencyName, contactName, phone, email, notes);
    },
  });
}

export function useGetPendingRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<AccessRequest[]>({
    queryKey: ['pendingRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, userId }: { requestId: bigint; userId: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveRequest(requestId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    },
  });
}

export function useRejectRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, rejectionReason }: { requestId: bigint; rejectionReason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectRequest(requestId, rejectionReason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    },
  });
}

export function useDeleteRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteRequest(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
    },
  });
}

// Referrals Queries
export function useGetAllReferrals() {
  const { actor, isFetching } = useActor();

  return useQuery<Referral[]>({
    queryKey: ['referrals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReferrals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyReferrals() {
  const { actor, isFetching } = useActor();

  return useQuery<Referral[]>({
    queryKey: ['myReferrals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyReferrals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetReferralStatusHistory(referralId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<StatusHistoryEntry[]>({
    queryKey: ['referralStatusHistory', referralId?.toString()],
    queryFn: async () => {
      if (!actor || !referralId) return [];
      return actor.getReferralStatusHistory(referralId);
    },
    enabled: !!actor && !isFetching && !!referralId,
  });
}

export function useCreateReferral() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referrerName,
      clientName,
      reason,
      programRequested,
      client,
      source,
    }: {
      referrerName: string;
      clientName: string;
      reason: string;
      programRequested: string;
      client: Client;
      source: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createReferral(
        referrerName,
        clientName,
        reason,
        programRequested,
        client,
        source
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
    },
  });
}

export function useUpdateReferralStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      status,
      assignedStaff,
    }: {
      referralId: bigint;
      status: Status;
      assignedStaff: Principal | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateReferralStatus(referralId, status, assignedStaff);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
      queryClient.invalidateQueries({ queryKey: ['referralStatusHistory'] });
    },
  });
}

export function useUpdateReferralStatusWithMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      status,
      message,
    }: {
      referralId: bigint;
      status: Status;
      message: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateReferralStatusWithMessage(referralId, status, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
      queryClient.invalidateQueries({ queryKey: ['referralStatusHistory'] });
    },
  });
}

export function useRequestMoreInfo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      message,
    }: {
      referralId: bigint;
      message: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestMoreInfo(referralId, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
      queryClient.invalidateQueries({ queryKey: ['referralStatusHistory'] });
    },
  });
}

export function useResubmitReferral() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      referrerName,
      clientName,
      reason,
      programRequested,
      updatedClient,
      updatedSource,
    }: {
      referralId: bigint;
      referrerName: string;
      clientName: string;
      reason: string;
      programRequested: string;
      updatedClient: Client;
      updatedSource: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resubmitReferral(
        referralId,
        referrerName,
        clientName,
        reason,
        programRequested,
        updatedClient,
        updatedSource
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
      queryClient.invalidateQueries({ queryKey: ['referralStatusHistory'] });
    },
  });
}

export function useUploadReferralDocuments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      documents,
    }: {
      referralId: bigint;
      documents: Document[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadReferralDocuments(referralId, documents);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
    },
  });
}

export function useAddReferralInternalNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      notes,
    }: {
      referralId: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReferralInternalNotes(referralId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
    },
  });
}

export function useAddReferralReviewNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      notes,
    }: {
      referralId: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addReferralReviewNotes(referralId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
    },
  });
}

export function useApproveReferralAndCreateIntake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      referralId,
      intakeDetails,
    }: {
      referralId: bigint;
      intakeDetails: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveReferralAndCreateIntake(referralId, intakeDetails);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals'] });
      queryClient.invalidateQueries({ queryKey: ['myReferrals'] });
      queryClient.invalidateQueries({ queryKey: ['intakes'] });
      queryClient.invalidateQueries({ queryKey: ['referralStatusHistory'] });
    },
  });
}

// Intakes Queries
export function useGetAllIntakes() {
  const { actor, isFetching } = useActor();

  return useQuery<Intake[]>({
    queryKey: ['intakes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllIntakes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetIntake() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (intakeId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getIntake(intakeId);
    },
  });
}

export function useGetIntakeStatusHistory(intakeId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<IntakeStatusHistoryEntry[]>({
    queryKey: ['intakeStatusHistory', intakeId?.toString()],
    queryFn: async () => {
      if (!actor || !intakeId) return [];
      return actor.getIntakeStatusHistory(intakeId);
    },
    enabled: !!actor && !isFetching && !!intakeId,
  });
}

export function useCreateIntake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ client, details }: { client: Client; details: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createIntake(client, details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakes'] });
    },
  });
}

export function useReviewIntake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ intakeId, status }: { intakeId: bigint; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reviewIntake(intakeId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakes'] });
      queryClient.invalidateQueries({ queryKey: ['intakeStatusHistory'] });
    },
  });
}

export function useMarkIntakeExited() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      intakeId, 
      exitDate, 
      exitNotes 
    }: { 
      intakeId: bigint; 
      exitDate: bigint; 
      exitNotes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markIntakeExited(intakeId, exitDate, exitNotes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakes'] });
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['activeBeds'] });
      queryClient.invalidateQueries({ queryKey: ['intakeStatusHistory'] });
    },
  });
}

export function useAddIntakeInternalNotes() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      intakeId,
      notes,
    }: {
      intakeId: bigint;
      notes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addIntakeInternalNotes(intakeId, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakes'] });
    },
  });
}

export function useAssignCaseManager() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      intakeId,
      managerId,
    }: {
      intakeId: bigint;
      managerId: Principal | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCaseManager(intakeId, managerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['intakes'] });
    },
  });
}

// Beds Queries
export function useGetAllBeds() {
  const { actor, isFetching } = useActor();

  return useQuery<Bed[]>({
    queryKey: ['beds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBeds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetActiveBeds() {
  const { actor, isFetching } = useActor();

  return useQuery<Bed[]>({
    queryKey: ['activeBeds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getActiveBeds();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAvailableBedsByProgram() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (program: Program) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAvailableBedsByProgram(program);
    },
  });
}

export function useCreateBed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ facilityId, program, bedNumber }: { facilityId: bigint; program: Program; bedNumber: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBed(facilityId, program, bedNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['activeBeds'] });
    },
  });
}

export function useUpdateBedStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bedId, status }: { bedId: bigint; status: Status__1 }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBedStatus(bedId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['activeBeds'] });
    },
  });
}

export function useAssignBed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bedId, client }: { bedId: bigint; client: Client }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignBed(bedId, client);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['activeBeds'] });
    },
  });
}

export function useAssignBedToIntake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bedId, intakeId }: { bedId: bigint; intakeId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignBedToIntake(bedId, intakeId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['activeBeds'] });
      queryClient.invalidateQueries({ queryKey: ['intakes'] });
    },
  });
}

export function useUpdateBed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      bedId, 
      program, 
      bedNumber, 
      status, 
      occupant, 
      archived 
    }: { 
      bedId: bigint; 
      program: Program; 
      bedNumber: string;
      status: Status__1;
      occupant: Client | null;
      archived: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBed(bedId, program, bedNumber, status, occupant, archived);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['activeBeds'] });
    },
  });
}

export function useArchiveBed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bedId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.archiveBed(bedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['activeBeds'] });
    },
  });
}

export function useDeleteBed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bedId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteBed(bedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['activeBeds'] });
    },
  });
}

// Facilities Queries
export function useGetAllFacilities() {
  const { actor, isFetching } = useActor();

  return useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFacilities();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateFacility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      facilityType,
      address,
      contactInfo,
    }: {
      name: string;
      facilityType: string;
      address: string;
      contactInfo: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createFacility(name, facilityType, address, contactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    },
  });
}

// Training and Placement/Employment Queries (Staff only)
export function useGetTrainingRecord(clientId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<TrainingRecord | null>({
    queryKey: ['trainingRecord', clientId?.toString()],
    queryFn: async () => {
      if (!actor || !clientId) return null;
      return actor.getTrainingRecord(clientId);
    },
    enabled: !!actor && !isFetching && !!clientId,
  });
}

export function useUpdateTrainingRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      trainingStatus,
      track,
      checklist,
      staffNotes,
    }: {
      clientId: bigint;
      trainingStatus: Variant_notStarted_complete_inProgress;
      track: Variant_foodService_maintenance_janitorial;
      checklist: TrainingChecklist;
      staffNotes: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTrainingRecord(clientId, trainingStatus, track, checklist, staffNotes);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainingRecord', variables.clientId.toString()] });
    },
  });
}

export function useUpdateClientPlacementRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      placementRecord,
    }: {
      clientId: bigint;
      placementRecord: PlacementEmployeeRecord;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateClientPlacementRecord(clientId, placementRecord);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trainingRecord', variables.clientId.toString()] });
    },
  });
}
