import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Client {
    contactInfo: string;
    name: string;
    notes?: string;
}
export type Time = bigint;
export interface IntakeStatusHistoryEntry {
    status: string;
    updatedBy?: Principal;
    timestamp: Time;
}
export interface AccessRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    contactName: string;
    createdAt: Time;
    rejectionReason?: string;
    email: string;
    agencyName: string;
    notes?: string;
    phone: string;
    assignedUser?: Principal;
}
export type Document = Uint8Array;
export interface Facility {
    id: bigint;
    contactInfo: string;
    name: string;
    facilityType: string;
    address: string;
}
export interface Intake {
    id: bigint;
    exitDate?: Time;
    status: string;
    client: Client;
    createdAt: Time;
    submittedBy: Principal;
    statusHistory: Array<IntakeStatusHistoryEntry>;
    reviewedBy?: Principal;
    updatedAt: Time;
    details: string;
    exitNotes?: string;
    internalNotes?: string;
    assignedBedId?: bigint;
    caseManager?: Principal;
}
export interface AdminStatusInfo {
    callerPrincipal: Principal;
    isAdmin: boolean;
    allAdminPrincipals: Array<Principal>;
}
export interface ActivityLogEntry {
    entity: EntityType;
    action: ActionType;
    user: Principal;
    timestamp: Time;
    recordId: bigint;
}
export interface StatusHistoryEntry {
    status: Status;
    updatedBy?: Principal;
    timestamp: Time;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface Bed {
    id: bigint;
    status: Status__1;
    occupant?: Client;
    lastUpdated: Time;
    bedNumber: string;
    isArchived: boolean;
    facilityId: bigint;
    program: Program;
}
export interface Referral {
    id: bigint;
    status: Status;
    client: Client;
    documents: Array<Document>;
    referrerName: string;
    clientName: string;
    source: string;
    partnerAgencyName: string;
    createdAt: Time;
    submittedBy?: Principal;
    statusHistory: Array<StatusHistoryEntry>;
    updatedAt: Time;
    assignedStaff?: Principal;
    programRequested: string;
    internalNotes?: string;
    requestMoreInfo?: string;
    reason: string;
}
export interface PartnerAgencyProfile {
    primaryContactName: string;
    email: string;
    agencyName: string;
    phone: string;
}
export interface UserProfile {
    name: string;
    role?: string;
    email?: string;
    phone?: string;
}
export enum ActionType {
    referralUpdated = "referralUpdated",
    bedArchived = "bedArchived",
    referralStatusChanged = "referralStatusChanged",
    bedAssigned = "bedAssigned",
    bedUnassigned = "bedUnassigned",
    intakeCreated = "intakeCreated",
    referralResubmitted = "referralResubmitted",
    referralCreated = "referralCreated",
    intakeStatusChanged = "intakeStatusChanged"
}
export enum EntityType {
    bed = "bed",
    referral = "referral",
    intake = "intake"
}
export enum Program {
    medicalStepDown = "medicalStepDown",
    workforceHousing = "workforceHousing"
}
export enum Status {
    submitted = "submitted",
    waitlisted = "waitlisted",
    approved = "approved",
    declined = "declined",
    needsInfo = "needsInfo"
}
export enum Status__1 {
    occupied = "occupied",
    available = "available",
    maintenance = "maintenance"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addIntakeInternalNotes(intakeId: bigint, notes: string): Promise<void>;
    addReferralInternalNotes(referralId: bigint, notes: string): Promise<void>;
    approveReferralAndCreateIntake(referralId: bigint, intakeDetails: string): Promise<Intake>;
    approveRequest(requestId: bigint, userId: Principal): Promise<void>;
    archiveBed(bedId: bigint): Promise<void>;
    assignBed(bedId: bigint, client: Client): Promise<void>;
    assignBedToIntake(bedId: bigint, intakeId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignCaseManager(intakeId: bigint, managerId: Principal | null): Promise<void>;
    assignUserRequest(userId: Principal, requestId: bigint): Promise<void>;
    assignUserRole(user: Principal, role: string): Promise<void>;
    createAccessRequest(agencyName: string, contactName: string, phone: string, email: string, notes: string | null): Promise<bigint>;
    createBed(facilityId: bigint, program: Program, bedNumber: string): Promise<bigint>;
    createFacility(name: string, facilityType: string, address: string, contactInfo: string): Promise<bigint>;
    createIntake(client: Client, details: string): Promise<bigint>;
    createReferral(referrerName: string, clientName: string, reason: string, programRequested: string, client: Client, source: string): Promise<bigint>;
    deleteBed(bedId: bigint): Promise<void>;
    deleteRequest(requestId: bigint): Promise<void>;
    ensureAdminRole(): Promise<void>;
    getActiveBeds(): Promise<Array<Bed>>;
    getActivityLogEntries(limit: bigint, offset: bigint): Promise<Array<ActivityLogEntry>>;
    getAdminStatusCheck(): Promise<AdminStatusInfo>;
    getAllBeds(): Promise<Array<Bed>>;
    getAllFacilities(): Promise<Array<Facility>>;
    getAllIntakes(): Promise<Array<Intake>>;
    getAllReferrals(): Promise<Array<Referral>>;
    getAllReferralsForPartnerAgency(): Promise<Array<Referral>>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getAvailableBedsByProgram(program: Program): Promise<Array<Bed>>;
    getBedsByProgram(program: Program): Promise<Array<Bed>>;
    getCallerPartnerAgencyProfile(): Promise<PartnerAgencyProfile | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getIntake(intakeId: bigint): Promise<Intake>;
    getIntakeStatusHistory(intakeId: bigint): Promise<Array<IntakeStatusHistoryEntry>>;
    getMyReferrals(): Promise<Array<Referral>>;
    getPendingRequests(): Promise<Array<AccessRequest>>;
    getReferral(referralId: bigint): Promise<Referral>;
    getReferralForPartnerAgency(referralId: bigint): Promise<Referral>;
    getReferralStatusHistory(referralId: bigint): Promise<Array<StatusHistoryEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isRequestApproved(userId: Principal): Promise<boolean>;
    listAdmins(): Promise<Array<Principal>>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    markIntakeExited(intakeId: bigint, exitDate: Time, exitNotes: string): Promise<void>;
    rejectRequest(requestId: bigint, rejectionReason: string): Promise<void>;
    removeUserRole(user: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    requestMoreInfo(referralId: bigint, message: string): Promise<void>;
    resubmitReferral(referralId: bigint, referrerName: string, clientName: string, reason: string, programRequested: string, updatedClient: Client, updatedSource: string): Promise<void>;
    reviewIntake(intakeId: bigint, status: string): Promise<void>;
    saveCallerPartnerAgencyProfile(profile: PartnerAgencyProfile): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    updateBed(bedId: bigint, newProgram: Program, newNumber: string, newStatus: Status__1, newOccupant: Client | null, newArchived: boolean): Promise<void>;
    updateBedStatus(bedId: bigint, status: Status__1): Promise<void>;
    updateReferral(referralId: bigint, referrerName: string, clientName: string, reason: string, programRequested: string, updatedClient: Client, updatedSource: string): Promise<void>;
    updateReferralStatus(referralId: bigint, status: Status, assignedStaff: Principal | null): Promise<void>;
    updateReferralStatusWithMessage(referralId: bigint, status: Status, message: string | null): Promise<void>;
    uploadReferralDocuments(referralId: bigint, newDocuments: Array<Document>): Promise<void>;
}
