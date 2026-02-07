import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";

module {
  type PlacementStatus = { #notPlaced; #placed; #employed; #completed };

  type WeeklyCheckIn = {
    attendanceOk : Bool;
    issuesReported : Bool;
    weeklyNotes : Text;
  };

  type PlacementEmployeeRecord = {
    placementStatus : PlacementStatus;
    employerName : Text;
    jobRole : Text;
    startDate : ?Text;
    shiftSchedule : Text;
    transportationPlan : Text;
    placementNotes : Text;
    follow_up_notes : ?Text;
    weeklyCheckIn : ?WeeklyCheckIn;
    needs_attention : Bool;
  };

  type Document = Storage.ExternalBlob;

  type UserProfile = {
    name : Text;
    email : ?Text;
    phone : ?Text;
    role : ?Text;
  };

  type PartnerAgencyProfile = {
    agencyName : Text;
    primaryContactName : Text;
    phone : Text;
    email : Text;
  };

  type Client = {
    name : Text;
    contactInfo : Text;
    notes : ?Text;
  };

  type Status = {
    #submitted;
    #needsInfo;
    #approved;
    #declined;
    #waitlisted;
  };

  type StatusHistoryEntry = {
    status : Status;
    timestamp : Time.Time;
    updatedBy : ?Principal;
  };

  type IntakeStatusHistoryEntry = {
    status : Text;
    timestamp : Time.Time;
    updatedBy : ?Principal;
  };

  type Referral_Old = {
    id : Nat;
    partnerAgencyName : Text;
    referrerName : Text;
    clientName : Text;
    reason : Text;
    programRequested : Text;
    client : Client;
    source : Text;
    status : Status;
    assignedStaff : ?Principal;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    submittedBy : ?Principal;
    requestMoreInfo : ?Text;
    documents : [Document];
    internalNotes : ?Text;
    statusHistory : [StatusHistoryEntry];
    lastUpdatedBy : ?Principal;
    convertedIntakeId : ?Nat;
  };

  type Referral_New = {
    id : Nat;
    partnerAgencyName : Text;
    referrerName : Text;
    clientName : Text;
    reason : Text;
    programRequested : Text;
    client : Client;
    source : Text;
    status : Status;
    assignedStaff : ?Principal;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    submittedBy : ?Principal;
    requestMoreInfo : ?Text;
    documents : [Document];
    internalNotes : ?Text;
    statusHistory : [StatusHistoryEntry];
    lastUpdatedBy : ?Principal;
    convertedIntakeId : ?Nat;
    staff_review_notes : Text;
  };

  type Intake = {
    id : Nat;
    client : Client;
    details : Text;
    status : Text;
    submittedBy : Principal;
    reviewedBy : ?Principal;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    assignedBedId : ?Nat;
    exitDate : ?Time.Time;
    exitNotes : ?Text;
    internalNotes : ?Text;
    caseManager : ?Principal;
    statusHistory : [IntakeStatusHistoryEntry];
    lastUpdatedBy : ?Principal;
  };

  module Bed {
    public type Status = { #available; #occupied; #maintenance };
    public type Program = { #medicalStepDown; #workforceHousing };
    public type Bed = {
      id : Nat;
      facilityId : Nat;
      status : Status;
      occupant : ?Client;
      program : Program;
      bedNumber : Text;
      isArchived : Bool;
      lastUpdated : Time.Time;
    };
  };

  type Facility = {
    id : Nat;
    name : Text;
    facilityType : Text;
    address : Text;
    contactInfo : Text;
  };

  type AccessRequest = {
    id : Nat;
    agencyName : Text;
    contactName : Text;
    phone : Text;
    email : Text;
    notes : ?Text;
    createdAt : Time.Time;
    status : { #pending; #approved; #rejected };
    rejectionReason : ?Text;
    assignedUser : ?Principal;
  };

  type ActionType = {
    #referralCreated;
    #referralUpdated;
    #referralStatusChanged;
    #referralResubmitted;
    #intakeCreated;
    #intakeStatusChanged;
    #bedAssigned;
    #bedUnassigned;
    #bedArchived;
  };

  type EntityType = {
    #referral;
    #intake;
    #bed;
  };

  type ActivityLogEntry = {
    timestamp : Time.Time;
    user : Principal;
    action : ActionType;
    entity : EntityType;
    recordId : Nat;
  };

  type TrainingChecklist = {
    core : [Bool];
    track : [Bool];
  };

  type TrainingRecord = {
    trainingStatus : {
      #notStarted;
      #inProgress;
      #complete;
    };
    track : {
      #janitorial;
      #maintenance;
      #foodService;
    };
    checklist : TrainingChecklist;
    staffNotes : Text;
    placement : PlacementEmployeeRecord;
  };

  type OldActor = {
    nextReferralId : Nat;
    nextIntakeId : Nat;
    nextBedId : Nat;
    nextFacilityId : Nat;
    nextRequestId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
    partnerAgencyProfiles : Map.Map<Principal, PartnerAgencyProfile>;
    referrals : Map.Map<Nat, Referral_Old>;
    intakes : Map.Map<Nat, Intake>;
    beds : Map.Map<Nat, Bed.Bed>;
    facilities : Map.Map<Nat, Facility>;
    pendingRequests : Map.Map<Nat, AccessRequest>;
    activityLog : List.List<ActivityLogEntry>;
    trainingRecords : Map.Map<Nat, TrainingRecord>;
    approvalState : UserApproval.UserApprovalState;
    accessControlState : AccessControl.AccessControlState;
  };

  public type NewActor = {
    nextReferralId : Nat;
    nextIntakeId : Nat;
    nextBedId : Nat;
    nextFacilityId : Nat;
    nextRequestId : Nat;
    userProfiles : Map.Map<Principal, UserProfile>;
    partnerAgencyProfiles : Map.Map<Principal, PartnerAgencyProfile>;
    referrals : Map.Map<Nat, Referral_New>;
    intakes : Map.Map<Nat, Intake>;
    beds : Map.Map<Nat, Bed.Bed>;
    facilities : Map.Map<Nat, Facility>;
    pendingRequests : Map.Map<Nat, AccessRequest>;
    activityLog : List.List<ActivityLogEntry>;
    trainingRecords : Map.Map<Nat, TrainingRecord>;
    approvalState : UserApproval.UserApprovalState;
    accessControlState : AccessControl.AccessControlState;
  };

  // Upgrade migration: Converts old referral types to new ones and copies state.
  public func run(old : OldActor) : NewActor {
    let newReferrals = old.referrals.map<Nat, Referral_Old, Referral_New>(
      func(_id, oldReferral) { { oldReferral with staff_review_notes = "" } }
    );
    { old with referrals = newReferrals };
  };
};

