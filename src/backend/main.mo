import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import Text "mo:core/Text";
import Time "mo:core/Time";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import UserApproval "user-approval/approval";
import Migration "migration";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  let approvalState = UserApproval.initState(accessControlState);

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  let MaxActiveBeds = 12;

  public type Document = Storage.ExternalBlob;

  public type UserProfile = {
    name : Text;
    email : ?Text;
    phone : ?Text;
    role : ?Text;
  };

  public type PartnerAgencyProfile = {
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

  public type Status = {
    #submitted;
    #needsInfo;
    #approved;
    #declined;
    #waitlisted;
  };

  public type StatusHistoryEntry = {
    status : Status;
    timestamp : Time.Time;
    updatedBy : ?Principal;
  };

  public type IntakeStatusHistoryEntry = {
    status : Text;
    timestamp : Time.Time;
    updatedBy : ?Principal;
  };

  type Referral = {
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

  public type AccessRequest = {
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

  public type ActivityLogEntry = {
    timestamp : Time.Time;
    user : Principal;
    action : ActionType;
    entity : EntityType;
    recordId : Nat;
  };

  public type AdminStatusInfo = {
    callerPrincipal : Principal;
    isAdmin : Bool;
    allAdminPrincipals : [Principal];
  };

  var nextReferralId = 1;
  var nextIntakeId = 1;
  var nextBedId = 1;
  var nextFacilityId = 1;
  var nextRequestId = 1;

  let userProfiles = Map.empty<Principal, UserProfile>();
  var partnerAgencyProfiles = Map.empty<Principal, PartnerAgencyProfile>();
  let referrals = Map.empty<Nat, Referral>();
  let intakes = Map.empty<Nat, Intake>();
  let beds = Map.empty<Nat, Bed.Bed>();
  let facilities = Map.empty<Nat, Facility>();
  let pendingRequests = Map.empty<Nat, AccessRequest>();
  let activityLog = List.empty<ActivityLogEntry>();

  func safeComparePrincipal(a : ?Principal, b : ?Principal) : Bool {
    switch (a, b) {
      case (?aVal, ?bVal) { aVal == bVal };
      case (null, null) { true };
      case (_) { false };
    };
  };

  func logActivity(user : Principal, action : ActionType, entity : EntityType, recordId : Nat) {
    let entry : ActivityLogEntry = {
      timestamp = Time.now();
      user;
      action;
      entity;
      recordId;
    };
    activityLog.add(entry);
  };

  func isStaffOrAdmin(caller : Principal) : Bool {
    if (isAdminInBothSystems(caller)) {
      return true;
    };

    switch (userProfiles.get(caller)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (?"Staff") { true };
          case (_) { false };
        };
      };
    };
  };

  func isAdminInBothSystems(user : Principal) : Bool {
    let isAdminInAccessControl = AccessControl.isAdmin(accessControlState, user);
    let isAdminInProfile = switch (userProfiles.get(user)) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (?"Admin") { true };
          case (_) { false };
        };
      };
    };
    isAdminInAccessControl and isAdminInProfile;
  };

  func syncAdminStatus(user : Principal) {
    let isAdminInAccessControl = AccessControl.isAdmin(accessControlState, user);
    let profileOpt = userProfiles.get(user);

    let isAdminInProfile = switch (profileOpt) {
      case (null) { false };
      case (?profile) {
        switch (profile.role) {
          case (?"Admin") { true };
          case (_) { false };
        };
      };
    };

    if (isAdminInAccessControl or isAdminInProfile) {
      if (not isAdminInAccessControl) {
        AccessControl.assignRole(accessControlState, user, user, #admin);
      };

      if (not isAdminInProfile) {
        let updatedProfile : UserProfile = switch (profileOpt) {
          case (null) {
            {
              name = "";
              email = null;
              phone = null;
              role = ?"Admin";
            };
          };
          case (?existing) {
            {
              name = existing.name;
              email = existing.email;
              phone = existing.phone;
              role = ?"Admin";
            };
          };
        };
        userProfiles.add(user, updatedProfile);
      };
    };
  };

  func hasAnyAdmin() : Bool {
    let allUsers = userProfiles.keys().toArray();
    allUsers.any(
      func(principal : Principal) : Bool {
        isAdminInBothSystems(principal)
      }
    );
  };

  func ensureAtLeastOneAdmin(caller : Principal) {
    if (not hasAnyAdmin()) {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);

      let existingProfile = userProfiles.get(caller);
      let updatedProfile : UserProfile = switch (existingProfile) {
        case (null) {
          {
            name = "";
            email = null;
            phone = null;
            role = ?"Admin";
          };
        };
        case (?existing) {
          {
            name = existing.name;
            email = existing.email;
            phone = existing.phone;
            role = ?"Admin";
          };
        };
      };
      userProfiles.add(caller, updatedProfile);
    };
  };

  public query ({ caller }) func getActivityLogEntries(limit : Nat, offset : Nat) : async [ActivityLogEntry] {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only admins can view activity log");
    };

    let entries = activityLog.toArray();
    let totalEntries = entries.size();

    let start = if (offset < totalEntries) { offset } else { totalEntries };
    let end = if (start + limit <= totalEntries) { start + limit } else { totalEntries };

    entries.sliceToArray<ActivityLogEntry>(start, end);
  };

  func canAccessReferral(caller : Principal, referral : Referral) : Bool {
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      return true;
    };

    if (isStaffOrAdmin(caller)) {
      return true;
    };

    switch (referral.submittedBy) {
      case (?submittedBy) { safeComparePrincipal(?caller, referral.submittedBy) };
      case (null) { false };
    };
  };

  func requireReferralAccess(caller : Principal, referral : Referral) {
    if (not canAccessReferral(caller, referral)) {
      Runtime.trap("Unauthorized: You do not have access to this referral");
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile unless you are an admin");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };

    ensureAtLeastOneAdmin(caller);

    let existingProfile = userProfiles.get(caller);
    let roleToUse = switch (existingProfile) {
      case (null) { null };
      case (?existing) { existing.role };
    };

    let updatedProfile : UserProfile = {
      name = profile.name;
      email = profile.email;
      phone = profile.phone;
      role = roleToUse;
    };

    userProfiles.add(caller, updatedProfile);
    syncAdminStatus(caller);
  };

  public query ({ caller }) func getCallerPartnerAgencyProfile() : async ?PartnerAgencyProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view Partner Agency profiles");
    };
    partnerAgencyProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerPartnerAgencyProfile(profile : PartnerAgencyProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can save Partner Agency profiles");
    };

    ensureAtLeastOneAdmin(caller);

    if (profile.agencyName == "" or profile.primaryContactName == "" or profile.phone == "" or profile.email == "") {
      Runtime.trap("Invalid Input: Missing required Partner Agency profile fields");
    };

    partnerAgencyProfiles.add(caller, profile);
  };

  func countAdmins() : Nat {
    userProfiles.keys().toArray().filter(
      func(principal) {
        isAdminInBothSystems(principal)
      }
    ).size();
  };

  func isUserAdmin(user : Principal) : Bool {
    isAdminInBothSystems(user);
  };

  public shared ({ caller }) func assignUserRole(user : Principal, role : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign roles");
    };

    if (role != "Admin" and role != "Staff" and role != "PartnerAgency") {
      Runtime.trap("Invalid role: Must be Admin, Staff, or PartnerAgency");
    };

    if (isUserAdmin(user) and role != "Admin") {
      let adminCount = countAdmins();
      if (adminCount <= 1) {
        Runtime.trap("Cannot remove or downgrade the last Admin. At least one Admin must exist.");
      };
    };

    let existingProfile = userProfiles.get(user);
    let updatedProfile : UserProfile = switch (existingProfile) {
      case (null) {
        {
          name = "";
          email = null;
          phone = null;
          role = ?role;
        };
      };
      case (?existing) {
        {
          name = existing.name;
          email = existing.email;
          phone = existing.phone;
          role = ?role;
        };
      };
    };

    userProfiles.add(user, updatedProfile);

    if (role == "Admin") {
      AccessControl.assignRole(accessControlState, caller, user, #admin);
    };

    syncAdminStatus(user);
  };

  public shared ({ caller }) func removeUserRole(user : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove roles");
    };

    if (isUserAdmin(user)) {
      let adminCount = countAdmins();
      if (adminCount <= 1) {
        Runtime.trap("Cannot remove the last Admin. At least one Admin must exist.");
      };
    };

    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?existing) {
        let updatedProfile : UserProfile = {
          name = existing.name;
          email = existing.email;
          phone = existing.phone;
          role = null;
        };
        userProfiles.add(user, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getAllUsers() : async [(Principal, UserProfile)] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    userProfiles.entries().toArray();
  };

  public query ({ caller }) func getAdminStatusCheck() : async AdminStatusInfo {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can check admin status");
    };

    let isCallerAdmin = AccessControl.isAdmin(accessControlState, caller);

    let allUsers = userProfiles.keys().toArray();
    let adminPrincipals = allUsers.filter(
      func(principal : Principal) : Bool {
        isAdminInBothSystems(principal)
      }
    );

    {
      callerPrincipal = caller;
      isAdmin = isCallerAdmin;
      allAdminPrincipals = adminPrincipals;
    };
  };

  func filterReferralForPartnerAgency(referral : Referral) : Referral {
    {
      id = referral.id;
      partnerAgencyName = referral.partnerAgencyName;
      referrerName = referral.referrerName;
      clientName = referral.clientName;
      reason = referral.reason;
      programRequested = referral.programRequested;
      client = referral.client;
      source = referral.source;
      status = referral.status;
      assignedStaff = referral.assignedStaff;
      createdAt = referral.createdAt;
      updatedAt = referral.updatedAt;
      submittedBy = referral.submittedBy;
      requestMoreInfo = referral.requestMoreInfo;
      documents = referral.documents;
      internalNotes = null;
      statusHistory = referral.statusHistory;
      lastUpdatedBy = referral.lastUpdatedBy;
    };
  };

  func processReferralsForPartnerAgency(refs : [Referral]) : [Referral] {
    refs.map<Referral, Referral>(
      func(referral) { filterReferralForPartnerAgency(referral) }
    );
  };

  public query ({ caller }) func getAllReferrals() : async [Referral] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view all referrals");
    };
    referrals.values().toArray();
  };

  public query ({ caller }) func getAllReferralsForPartnerAgency() : async [Referral] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view referrals");
    };
    processReferralsForPartnerAgency(referrals.values().toArray());
  };

  public query ({ caller }) func getReferralForPartnerAgency(referralId : Nat) : async Referral {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view referrals");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        requireReferralAccess(caller, referral);
        filterReferralForPartnerAgency(referral);
      };
    };
  };

  public shared ({ caller }) func addReferralInternalNotes(referralId : Nat, notes : Text) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can add internal notes");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        let updatedReferral : Referral = {
          id = referral.id;
          partnerAgencyName = referral.partnerAgencyName;
          referrerName = referral.referrerName;
          clientName = referral.clientName;
          reason = referral.reason;
          programRequested = referral.programRequested;
          client = referral.client;
          source = referral.source;
          status = referral.status;
          assignedStaff = referral.assignedStaff;
          createdAt = referral.createdAt;
          updatedAt = Time.now();
          submittedBy = referral.submittedBy;
          requestMoreInfo = referral.requestMoreInfo;
          documents = referral.documents;
          internalNotes = ?notes;
          statusHistory = referral.statusHistory;
          lastUpdatedBy = ?caller;
        };
        referrals.add(referralId, updatedReferral);
      };
    };
  };

  public shared ({ caller }) func addIntakeInternalNotes(intakeId : Nat, notes : Text) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can add internal notes");
    };

    switch (intakes.get(intakeId)) {
      case (null) { Runtime.trap("Intake not found") };
      case (?intake) {
        let updatedIntake : Intake = {
          id = intake.id;
          client = intake.client;
          details = intake.details;
          status = intake.status;
          submittedBy = intake.submittedBy;
          reviewedBy = intake.reviewedBy;
          createdAt = intake.createdAt;
          updatedAt = Time.now();
          assignedBedId = intake.assignedBedId;
          exitDate = intake.exitDate;
          exitNotes = intake.exitNotes;
          internalNotes = ?notes;
          caseManager = intake.caseManager;
          statusHistory = intake.statusHistory;
          lastUpdatedBy = ?caller;
        };
        intakes.add(intakeId, updatedIntake);
      };
    };
  };

  public shared ({ caller }) func createReferral(
    referrerName : Text,
    clientName : Text,
    reason : Text,
    programRequested : Text,
    client : Client,
    source : Text,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can create referrals");
    };

    ensureAtLeastOneAdmin(caller);

    if (referrerName == "" or clientName == "" or reason == "" or programRequested == "") {
      Runtime.trap("Invalid Input: Missing required referral fields");
    };

    let partnerAgencyName = switch (partnerAgencyProfiles.get(caller)) {
      case (null) {
        Runtime.trap("Partner Agency profile not found. Please create your profile first");
      };
      case (?profile) { profile.agencyName };
    };

    let newId = nextReferralId;
    nextReferralId += 1;

    let initialStatusHistoryEntry : StatusHistoryEntry = {
      status = #submitted;
      timestamp = Time.now();
      updatedBy = ?caller;
    };

    let referral : Referral = {
      id = newId;
      partnerAgencyName;
      referrerName;
      clientName;
      reason;
      programRequested;
      client;
      source;
      status = #submitted;
      assignedStaff = null;
      createdAt = Time.now();
      updatedAt = Time.now();
      submittedBy = ?caller;
      requestMoreInfo = null;
      documents = [];
      internalNotes = null;
      statusHistory = [initialStatusHistoryEntry];
      lastUpdatedBy = ?caller;
    };

    referrals.add(newId, referral);
    logActivity(caller, #referralCreated, #referral, newId);
    newId;
  };

  public shared ({ caller }) func updateReferralStatus(
    referralId : Nat,
    status : Status,
    assignedStaff : ?Principal,
  ) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can update referral status");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        let newHistoryEntry : StatusHistoryEntry = {
          status;
          timestamp = Time.now();
          updatedBy = ?caller;
        };

        let updatedReferral : Referral = {
          id = referral.id;
          partnerAgencyName = referral.partnerAgencyName;
          referrerName = referral.referrerName;
          clientName = referral.clientName;
          reason = referral.reason;
          programRequested = referral.programRequested;
          client = referral.client;
          source = referral.source;
          status;
          assignedStaff;
          createdAt = referral.createdAt;
          updatedAt = Time.now();
          submittedBy = referral.submittedBy;
          requestMoreInfo = referral.requestMoreInfo;
          documents = referral.documents;
          internalNotes = referral.internalNotes;
          statusHistory = referral.statusHistory.concat([newHistoryEntry]);
          lastUpdatedBy = ?caller;
        };
        referrals.add(referralId, updatedReferral);
        logActivity(caller, #referralStatusChanged, #referral, referralId);
      };
    };
  };

  public query ({ caller }) func getMyReferrals() : async [Referral] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view referrals");
    };

    if (isStaffOrAdmin(caller)) {
      return referrals.values().toArray();
    };

    let myReferrals = referrals.values().toArray().filter(
      func(referral) {
        switch (referral.submittedBy) {
          case (?submittedBy) { safeComparePrincipal(?caller, referral.submittedBy) };
          case (null) { false };
        };
      }
    );

    processReferralsForPartnerAgency(myReferrals);
  };

  public query ({ caller }) func getReferral(referralId : Nat) : async Referral {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can view referrals");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        requireReferralAccess(caller, referral);

        if (not isStaffOrAdmin(caller)) {
          return filterReferralForPartnerAgency(referral);
        };

        referral;
      };
    };
  };

  public shared ({ caller }) func updateReferralStatusWithMessage(
    referralId : Nat,
    status : Status,
    message : ?Text,
  ) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can update referral status");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        let newHistoryEntry : StatusHistoryEntry = {
          status;
          timestamp = Time.now();
          updatedBy = ?caller;
        };

        let updatedReferral : Referral = {
          id = referral.id;
          partnerAgencyName = referral.partnerAgencyName;
          referrerName = referral.referrerName;
          clientName = referral.clientName;
          reason = referral.reason;
          programRequested = referral.programRequested;
          client = referral.client;
          source = referral.source;
          status;
          assignedStaff = referral.assignedStaff;
          createdAt = referral.createdAt;
          updatedAt = Time.now();
          submittedBy = referral.submittedBy;
          requestMoreInfo = message;
          documents = referral.documents;
          internalNotes = referral.internalNotes;
          statusHistory = referral.statusHistory.concat([newHistoryEntry]);
          lastUpdatedBy = ?caller;
        };
        referrals.add(referralId, updatedReferral);
        logActivity(caller, #referralStatusChanged, #referral, referralId);
      };
    };
  };

  public shared ({ caller }) func requestMoreInfo(
    referralId : Nat,
    message : Text,
  ) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can request more info");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        let newHistoryEntry : StatusHistoryEntry = {
          status = #needsInfo;
          timestamp = Time.now();
          updatedBy = ?caller;
        };

        let updatedReferral : Referral = {
          id = referral.id;
          partnerAgencyName = referral.partnerAgencyName;
          referrerName = referral.referrerName;
          clientName = referral.clientName;
          reason = referral.reason;
          programRequested = referral.programRequested;
          client = referral.client;
          source = referral.source;
          status = #needsInfo;
          assignedStaff = referral.assignedStaff;
          createdAt = referral.createdAt;
          updatedAt = Time.now();
          submittedBy = referral.submittedBy;
          requestMoreInfo = ?message;
          documents = referral.documents;
          internalNotes = referral.internalNotes;
          statusHistory = referral.statusHistory.concat([newHistoryEntry]);
          lastUpdatedBy = ?caller;
        };
        referrals.add(referralId, updatedReferral);
        logActivity(caller, #referralStatusChanged, #referral, referralId);
      };
    };
  };

  public shared ({ caller }) func uploadReferralDocuments(
    referralId : Nat,
    newDocuments : [Document],
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can upload documents");
    };

    ensureAtLeastOneAdmin(caller);

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        requireReferralAccess(caller, referral);

        let updatedReferral : Referral = {
          id = referral.id;
          partnerAgencyName = referral.partnerAgencyName;
          referrerName = referral.referrerName;
          clientName = referral.clientName;
          reason = referral.reason;
          programRequested = referral.programRequested;
          client = referral.client;
          source = referral.source;
          status = referral.status;
          assignedStaff = referral.assignedStaff;
          createdAt = referral.createdAt;
          updatedAt = Time.now();
          submittedBy = referral.submittedBy;
          requestMoreInfo = referral.requestMoreInfo;
          documents = referral.documents.concat(newDocuments);
          internalNotes = referral.internalNotes;
          statusHistory = referral.statusHistory;
          lastUpdatedBy = ?caller;
        };
        referrals.add(referralId, updatedReferral);
      };
    };
  };

  public shared ({ caller }) func updateReferral(
    referralId : Nat,
    referrerName : Text,
    clientName : Text,
    reason : Text,
    programRequested : Text,
    updatedClient : Client,
    updatedSource : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can update referrals");
    };

    ensureAtLeastOneAdmin(caller);

    if (referrerName == "" or clientName == "" or reason == "" or programRequested == "") {
      Runtime.trap("Invalid Input: Missing required referral fields");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        requireReferralAccess(caller, referral);

        if (not isStaffOrAdmin(caller) and referral.status != #needsInfo) {
          Runtime.trap("Unauthorized: Non-admin users can only update referrals with 'Needs Info' status");
        };

        let updatedReferral : Referral = {
          id = referral.id;
          partnerAgencyName = referral.partnerAgencyName;
          referrerName;
          clientName;
          reason;
          programRequested;
          client = updatedClient;
          source = updatedSource;
          status = referral.status;
          assignedStaff = referral.assignedStaff;
          createdAt = referral.createdAt;
          updatedAt = Time.now();
          submittedBy = referral.submittedBy;
          requestMoreInfo = referral.requestMoreInfo;
          documents = referral.documents;
          internalNotes = referral.internalNotes;
          statusHistory = referral.statusHistory;
          lastUpdatedBy = ?caller;
        };
        referrals.add(referralId, updatedReferral);
        logActivity(caller, #referralUpdated, #referral, referralId);
      };
    };
  };

  public shared ({ caller }) func resubmitReferral(
    referralId : Nat,
    referrerName : Text,
    clientName : Text,
    reason : Text,
    programRequested : Text,
    updatedClient : Client,
    updatedSource : Text,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can resubmit referrals");
    };

    ensureAtLeastOneAdmin(caller);

    if (referrerName == "" or clientName == "" or reason == "" or programRequested == "") {
      Runtime.trap("Invalid Input: Missing required referral fields");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        requireReferralAccess(caller, referral);

        if (referral.status != #needsInfo) {
          Runtime.trap("Referral can only be resubmitted when status is 'needsInfo'");
        };

        let newHistoryEntry : StatusHistoryEntry = {
          status = #submitted;
          timestamp = Time.now();
          updatedBy = ?caller;
        };

        let updatedReferral : Referral = {
          id = referral.id;
          partnerAgencyName = referral.partnerAgencyName;
          referrerName;
          clientName;
          reason;
          programRequested;
          client = updatedClient;
          source = updatedSource;
          status = #submitted;
          assignedStaff = referral.assignedStaff;
          createdAt = referral.createdAt;
          updatedAt = Time.now();
          submittedBy = referral.submittedBy;
          requestMoreInfo = referral.requestMoreInfo;
          documents = referral.documents;
          internalNotes = referral.internalNotes;
          statusHistory = referral.statusHistory.concat([newHistoryEntry]);
          lastUpdatedBy = ?caller;
        };
        referrals.add(referralId, updatedReferral);
        logActivity(caller, #referralResubmitted, #referral, referralId);
      };
    };
  };

  public shared ({ caller }) func approveReferralAndCreateIntake(referralId : Nat, intakeDetails : Text) : async Intake {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can approve referrals and create intakes");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) {
        let newHistoryEntry : StatusHistoryEntry = {
          status = #approved;
          timestamp = Time.now();
          updatedBy = ?caller;
        };

        let updatedReferral : Referral = {
          id = referral.id;
          partnerAgencyName = referral.partnerAgencyName;
          referrerName = referral.referrerName;
          clientName = referral.clientName;
          reason = referral.reason;
          programRequested = referral.programRequested;
          client = referral.client;
          source = referral.source;
          status = #approved;
          assignedStaff = ?caller;
          createdAt = referral.createdAt;
          updatedAt = Time.now();
          submittedBy = referral.submittedBy;
          requestMoreInfo = referral.requestMoreInfo;
          documents = referral.documents;
          internalNotes = referral.internalNotes;
          statusHistory = referral.statusHistory.concat([newHistoryEntry]);
          lastUpdatedBy = ?caller;
        };
        referrals.add(referralId, updatedReferral);

        let newIntakeId = nextIntakeId;
        nextIntakeId += 1;

        let initialStatusHistoryEntry : IntakeStatusHistoryEntry = {
          status = "pending";
          timestamp = Time.now();
          updatedBy = ?caller;
        };

        let newIntake : Intake = {
          id = newIntakeId;
          client = referral.client;
          details = intakeDetails;
          status = "pending";
          submittedBy = caller;
          reviewedBy = null;
          createdAt = Time.now();
          updatedAt = Time.now();
          assignedBedId = null;
          exitDate = null;
          exitNotes = null;
          internalNotes = null;
          caseManager = null;
          statusHistory = [initialStatusHistoryEntry];
          lastUpdatedBy = ?caller;
        };
        intakes.add(newIntakeId, newIntake);

        newIntake;
      };
    };
  };

  public shared ({ caller }) func createIntake(client : Client, details : Text) : async Nat {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can create intakes");
    };

    let newId = nextIntakeId;
    nextIntakeId += 1;

    let initialStatusHistoryEntry : IntakeStatusHistoryEntry = {
      status = "pending";
      timestamp = Time.now();
      updatedBy = ?caller;
    };

    let intake : Intake = {
      id = newId;
      client;
      details;
      status = "pending";
      submittedBy = caller;
      reviewedBy = null;
      createdAt = Time.now();
      updatedAt = Time.now();
      assignedBedId = null;
      exitDate = null;
      exitNotes = null;
      internalNotes = null;
      caseManager = null;
      statusHistory = [initialStatusHistoryEntry];
      lastUpdatedBy = ?caller;
    };

    intakes.add(newId, intake);
    logActivity(caller, #intakeCreated, #intake, newId);
    newId;
  };

  public shared ({ caller }) func assignCaseManager(intakeId : Nat, managerId : ?Principal) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can assign case managers");
    };

    switch (intakes.get(intakeId)) {
      case (null) { Runtime.trap("Intake not found") };
      case (?intake) {
        let updatedIntake : Intake = {
          id = intake.id;
          client = intake.client;
          details = intake.details;
          status = intake.status;
          submittedBy = intake.submittedBy;
          reviewedBy = intake.reviewedBy;
          createdAt = intake.createdAt;
          updatedAt = Time.now();
          assignedBedId = intake.assignedBedId;
          exitDate = intake.exitDate;
          exitNotes = intake.exitNotes;
          internalNotes = intake.internalNotes;
          caseManager = managerId;
          statusHistory = intake.statusHistory;
          lastUpdatedBy = ?caller;
        };
        intakes.add(intakeId, updatedIntake);
      };
    };
  };

  public shared ({ caller }) func reviewIntake(intakeId : Nat, status : Text) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can review intakes");
    };

    switch (intakes.get(intakeId)) {
      case (null) { Runtime.trap("Intake not found") };
      case (?intake) {
        let newHistoryEntry : IntakeStatusHistoryEntry = {
          status;
          timestamp = Time.now();
          updatedBy = ?caller;
        };

        let updatedIntake : Intake = {
          id = intake.id;
          client = intake.client;
          details = intake.details;
          status = status;
          submittedBy = intake.submittedBy;
          reviewedBy = ?caller;
          createdAt = intake.createdAt;
          updatedAt = Time.now();
          assignedBedId = intake.assignedBedId;
          exitDate = intake.exitDate;
          exitNotes = intake.exitNotes;
          internalNotes = intake.internalNotes;
          caseManager = intake.caseManager;
          statusHistory = intake.statusHistory.concat([newHistoryEntry]);
          lastUpdatedBy = ?caller;
        };
        intakes.add(intakeId, updatedIntake);
        logActivity(caller, #intakeStatusChanged, #intake, intakeId);
      };
    };
  };

  public shared ({ caller }) func markIntakeExited(
    intakeId : Nat,
    exitDate : Time.Time,
    exitNotes : Text,
  ) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can mark intakes as exited");
    };

    switch (intakes.get(intakeId)) {
      case (null) { Runtime.trap("Intake not found") };
      case (?intake) {
        if (intake.status == "exited") {
          Runtime.trap("Intake is already exited");
        };

        let newHistoryEntry : IntakeStatusHistoryEntry = {
          status = "exited";
          timestamp = Time.now();
          updatedBy = ?caller;
        };

        let updatedIntake : Intake = {
          id = intake.id;
          client = intake.client;
          details = intake.details;
          status = "exited";
          submittedBy = intake.submittedBy;
          reviewedBy = ?caller;
          createdAt = intake.createdAt;
          updatedAt = Time.now();
          assignedBedId = intake.assignedBedId;
          exitDate = ?exitDate;
          exitNotes = ?exitNotes;
          internalNotes = intake.internalNotes;
          caseManager = intake.caseManager;
          statusHistory = intake.statusHistory.concat([newHistoryEntry]);
          lastUpdatedBy = ?caller;
        };
        intakes.add(intakeId, updatedIntake);

        switch (intake.assignedBedId) {
          case (null) { () };
          case (?bedId) {
            switch (beds.get(bedId)) {
              case (null) { () };
              case (?bed) {
                let updatedBed : Bed.Bed = {
                  id = bed.id;
                  facilityId = bed.facilityId;
                  status = #available;
                  occupant = null;
                  program = bed.program;
                  bedNumber = bed.bedNumber;
                  isArchived = bed.isArchived;
                  lastUpdated = Time.now();
                };
                beds.add(bedId, updatedBed);
                logActivity(caller, #bedUnassigned, #bed, bedId);
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func assignBedToIntake(bedId : Nat, intakeId : Nat) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can assign beds");
    };

    switch (beds.get(bedId)) {
      case (null) { Runtime.trap("Bed not found") };
      case (?bed) {
        switch (intakes.get(intakeId)) {
          case (null) { Runtime.trap("Intake not found") };
          case (?intake) {
            let updatedBed : Bed.Bed = {
              id = bed.id;
              facilityId = bed.facilityId;
              status = #occupied;
              occupant = ?intake.client;
              program = bed.program;
              bedNumber = bed.bedNumber;
              isArchived = bed.isArchived;
              lastUpdated = Time.now();
            };
            beds.add(bedId, updatedBed);

            let updatedIntake : Intake = {
              id = intake.id;
              client = intake.client;
              details = intake.details;
              status = intake.status;
              submittedBy = intake.submittedBy;
              reviewedBy = intake.reviewedBy;
              createdAt = intake.createdAt;
              updatedAt = intake.updatedAt;
              assignedBedId = ?bedId;
              exitDate = intake.exitDate;
              exitNotes = intake.exitNotes;
              internalNotes = intake.internalNotes;
              caseManager = intake.caseManager;
              statusHistory = intake.statusHistory;
              lastUpdatedBy = ?caller;
            };
            intakes.add(intakeId, updatedIntake);
            logActivity(caller, #bedAssigned, #bed, bedId);
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllIntakes() : async [Intake] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view all intakes");
    };
    intakes.values().toArray();
  };

  public query ({ caller }) func getIntake(intakeId : Nat) : async Intake {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view intakes");
    };

    switch (intakes.get(intakeId)) {
      case (null) { Runtime.trap("Intake not found") };
      case (?intake) { intake };
    };
  };

  public query ({ caller }) func getReferralStatusHistory(referralId : Nat) : async [StatusHistoryEntry] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view referral status history");
    };

    switch (referrals.get(referralId)) {
      case (null) { Runtime.trap("Referral not found") };
      case (?referral) { referral.statusHistory };
    };
  };

  public query ({ caller }) func getIntakeStatusHistory(intakeId : Nat) : async [IntakeStatusHistoryEntry] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view intake status history");
    };

    switch (intakes.get(intakeId)) {
      case (null) { Runtime.trap("Intake not found") };
      case (?intake) { intake.statusHistory };
    };
  };

  public shared ({ caller }) func createBed(
    facilityId : Nat,
    program : Bed.Program,
    bedNumber : Text,
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create beds");
    };

    let activeBedsCount = beds.values().toArray().filter(
      func(bed) { not bed.isArchived }
    ).size();

    if (activeBedsCount >= MaxActiveBeds) {
      Runtime.trap("Cannot add bed. Maximum of 12 active beds reached (ignoring archived beds).");
    };

    let newId = nextBedId;
    nextBedId += 1;

    let bed : Bed.Bed = {
      id = newId;
      facilityId;
      status = #available;
      occupant = null;
      program;
      bedNumber;
      isArchived = false;
      lastUpdated = Time.now();
    };

    beds.add(newId, bed);
    newId;
  };

  public shared ({ caller }) func updateBedStatus(bedId : Nat, status : Bed.Status) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update bed status");
    };

    switch (beds.get(bedId)) {
      case (null) { Runtime.trap("Bed not found") };
      case (?bed) {
        let updatedBed : Bed.Bed = {
          id = bed.id;
          facilityId = bed.facilityId;
          status;
          occupant = bed.occupant;
          program = bed.program;
          bedNumber = bed.bedNumber;
          isArchived = bed.isArchived;
          lastUpdated = Time.now();
        };
        beds.add(bedId, updatedBed);
      };
    };
  };

  public shared ({ caller }) func assignBed(bedId : Nat, client : Client) : async () {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can assign beds");
    };

    switch (beds.get(bedId)) {
      case (null) { Runtime.trap("Bed not found") };
      case (?bed) {
        let updatedBed : Bed.Bed = {
          id = bed.id;
          facilityId = bed.facilityId;
          status = #occupied;
          occupant = ?client;
          program = bed.program;
          bedNumber = bed.bedNumber;
          isArchived = bed.isArchived;
          lastUpdated = Time.now();
        };
        beds.add(bedId, updatedBed);
        logActivity(caller, #bedAssigned, #bed, bedId);
      };
    };
  };

  public query ({ caller }) func getAvailableBedsByProgram(program : Bed.Program) : async [Bed.Bed] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view beds");
    };

    beds.values().toArray().filter(
      func(bed) {
        let matchesProgram = switch (program, bed.program) {
          case (#medicalStepDown, #medicalStepDown) { true };
          case (#workforceHousing, #workforceHousing) { true };
          case (_) { false };
        };
        let isAvailable = switch (bed.status) {
          case (#available) { true };
          case (_) { false };
        };
        matchesProgram and isAvailable and not bed.isArchived;
      }
    );
  };

  public query ({ caller }) func getBedsByProgram(program : Bed.Program) : async [Bed.Bed] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view beds");
    };

    beds.values().toArray().filter(
      func(bed) {
        let matchesProgram = switch (program, bed.program) {
          case (#medicalStepDown, #medicalStepDown) { true };
          case (#workforceHousing, #workforceHousing) { true };
          case (_) { false };
        };
        matchesProgram and not bed.isArchived;
      }
    );
  };

  public query ({ caller }) func getAllBeds() : async [Bed.Bed] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view all beds");
    };
    beds.values().toArray();
  };

  public query ({ caller }) func getActiveBeds() : async [Bed.Bed] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view beds");
    };
    beds.values().toArray().filter(
      func(bed) { not bed.isArchived }
    );
  };

  public shared ({ caller }) func archiveBed(bedId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can archive beds");
    };

    switch (beds.get(bedId)) {
      case (null) { Runtime.trap("Bed not found") };
      case (?bed) {
        let archivedBed : Bed.Bed = {
          id = bed.id;
          facilityId = bed.facilityId;
          status = bed.status;
          occupant = bed.occupant;
          program = bed.program;
          bedNumber = bed.bedNumber;
          isArchived = true;
          lastUpdated = Time.now();
        };
        beds.add(bedId, archivedBed);
        logActivity(caller, #bedArchived, #bed, bedId);
      };
    };
  };

  public shared ({ caller }) func deleteBed(bedId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete beds");
    };

    switch (beds.get(bedId)) {
      case (null) { Runtime.trap("Bed not found") };
      case (?_) { beds.remove(bedId) };
    };
  };

  public shared ({ caller }) func updateBed(
    bedId : Nat,
    newProgram : Bed.Program,
    newNumber : Text,
    newStatus : Bed.Status,
    newOccupant : ?Client,
    newArchived : Bool,
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update bed info");
    };

    switch (beds.get(bedId)) {
      case (null) { Runtime.trap("Bed not found") };
      case (?bed) {
        let updatedBed : Bed.Bed = {
          id = bed.id;
          facilityId = bed.facilityId;
          status = newStatus;
          occupant = newOccupant;
          program = newProgram;
          bedNumber = newNumber;
          isArchived = newArchived;
          lastUpdated = Time.now();
        };
        beds.add(bedId, updatedBed);
      };
    };
  };

  public shared ({ caller }) func createFacility(
    name : Text,
    facilityType : Text,
    address : Text,
    contactInfo : Text,
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create facilities");
    };

    let newId = nextFacilityId;
    nextFacilityId += 1;

    let facility : Facility = {
      id = newId;
      name;
      facilityType;
      address;
      contactInfo;
    };

    facilities.add(newId, facility);
    newId;
  };

  public query ({ caller }) func getAllFacilities() : async [Facility] {
    if (not isStaffOrAdmin(caller)) {
      Runtime.trap("Unauthorized: Only Staff and Admin users can view facilities");
    };
    facilities.values().toArray();
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can check approval status");
    };
    AccessControl.isAdmin(accessControlState, caller) or UserApproval.isApproved(approvalState, caller);
  };

  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public query ({ caller }) func listAdmins() : async [Principal] {
    let allUsers = userProfiles.keys().toArray();
    allUsers.filter(
      func(principal : Principal) : Bool {
        isAdminInBothSystems(principal)
      }
    );
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can request approval");
    };

    ensureAtLeastOneAdmin(caller);

    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public shared func createAccessRequest(
    agencyName : Text,
    contactName : Text,
    phone : Text,
    email : Text,
    notes : ?Text,
  ) : async Nat {
    if (agencyName.size() == 0) {
      Runtime.trap("Agency name is required");
    };
    if (contactName.size() == 0 or phone.size() == 0) {
      Runtime.trap("Contact name and phone are required");
    };

    let newId = nextRequestId;
    nextRequestId += 1;

    let request : AccessRequest = {
      id = newId;
      agencyName;
      contactName;
      phone;
      email;
      notes;
      createdAt = Time.now();
      status = #pending;
      rejectionReason = null;
      assignedUser = null;
    };

    pendingRequests.add(newId, request);
    newId;
  };

  public query ({ caller }) func getPendingRequests() : async [AccessRequest] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending access requests");
    };

    let iter = pendingRequests.values();
    let entries = iter.toArray();
    entries.filter(
      func(request) { request.status == #pending }
    );
  };

  public shared ({ caller }) func approveRequest(requestId : Nat, userId : Principal) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can approve requests");
    };

    switch (pendingRequests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        let updatedRequest : AccessRequest = {
          id = request.id;
          agencyName = request.agencyName;
          contactName = request.contactName;
          phone = request.phone;
          email = request.email;
          notes = request.notes;
          createdAt = request.createdAt;
          status = #approved;
          rejectionReason = null;
          assignedUser = ?userId;
        };
        pendingRequests.add(requestId, updatedRequest);

        let existingProfile = userProfiles.get(userId);
        let updatedProfile : UserProfile = switch (existingProfile) {
          case (null) {
            {
              name = "";
              email = ?request.email;
              phone = ?request.phone;
              role = ?"PartnerAgency";
            };
          };
          case (?existing) {
            {
              name = existing.name;
              email = existing.email;
              phone = existing.phone;
              role = ?"PartnerAgency";
            };
          };
        };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  public shared ({ caller }) func rejectRequest(requestId : Nat, rejectionReason : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reject requests");
    };

    switch (pendingRequests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        let updatedRequest : AccessRequest = {
          id = request.id;
          agencyName = request.agencyName;
          contactName = request.contactName;
          phone = request.phone;
          email = request.email;
          notes = request.notes;
          createdAt = request.createdAt;
          status = #rejected;
          rejectionReason = ?rejectionReason;
          assignedUser = request.assignedUser;
        };
        pendingRequests.add(requestId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func deleteRequest(requestId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete requests");
    };

    switch (pendingRequests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?_) {
        pendingRequests.remove(requestId);
      };
    };
  };

  public shared ({ caller }) func assignUserRequest(userId : Principal, requestId : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign requests to users");
    };

    switch (pendingRequests.get(requestId)) {
      case (null) { Runtime.trap("Request not found") };
      case (?request) {
        let updatedRequest : AccessRequest = {
          id = request.id;
          agencyName = request.agencyName;
          contactName = request.contactName;
          phone = request.phone;
          email = request.email;
          notes = request.notes;
          createdAt = request.createdAt;
          status = #pending;
          rejectionReason = null;
          assignedUser = ?userId;
        };
        pendingRequests.add(requestId, updatedRequest);
      };
    };
  };

  public query ({ caller }) func isRequestApproved(userId : Principal) : async Bool {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can check request approval status for other users");
    };

    let requests = pendingRequests.values().toArray();
    requests.any(
      func(request) {
        (request.status == #approved) and ?userId == request.assignedUser
      }
    );
  };
};
