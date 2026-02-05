import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type Status = { #submitted; #needsInfo; #approved; #declined; #waitlisted };

  type Client = {
    name : Text;
    contactInfo : Text;
    notes : ?Text;
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

  type OldReferral = {
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
    documents : [Storage.ExternalBlob];
    internalNotes : ?Text;
    statusHistory : [StatusHistoryEntry];
  };

  type OldIntake = {
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
  };

  type OldActor = {
    referrals : Map.Map<Nat, OldReferral>;
    intakes : Map.Map<Nat, OldIntake>;
    nextReferralId : Nat;
    nextIntakeId : Nat;
  };

  type NewReferral = {
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
    documents : [Storage.ExternalBlob];
    internalNotes : ?Text;
    statusHistory : [StatusHistoryEntry];
    lastUpdatedBy : ?Principal;
  };

  type NewIntake = {
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

  type NewActor = {
    referrals : Map.Map<Nat, NewReferral>;
    intakes : Map.Map<Nat, NewIntake>;
    nextReferralId : Nat;
    nextIntakeId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let newReferrals = old.referrals.map<Nat, OldReferral, NewReferral>(
      func(_id, oldReferral) { { oldReferral with lastUpdatedBy = null } }
    );

    let newIntakes = old.intakes.map<Nat, OldIntake, NewIntake>(
      func(_id, oldIntake) { { oldIntake with lastUpdatedBy = null } }
    );

    { old with referrals = newReferrals; intakes = newIntakes };
  };
};
