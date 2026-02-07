# Specification

## Summary
**Goal:** Add a new `staff_review_notes` field to Referrals and allow Staff/Admin users to view and edit it from the Referral review screen.

**Planned changes:**
- Extend the backend Referral record to persist an optional/nullable text field `staff_review_notes` and include it in Referral responses for Staff/Admin users.
- Add a Staff/Admin-only backend method to update `staff_review_notes` for a given Referral, preserving existing values unless explicitly changed and updating audit fields per existing patterns.
- Update frontend generated bindings/types and React Query wiring to read and update `staff_review_notes`, including cache invalidation after saves.
- Update the Staff/Admin Referral review UI to display a “Staff Review Notes” textarea directly below the existing “Referral Review Status” section and allow explicit save.
- If applicable, adjust upgrade/migration logic so existing stored Referrals get a safe default for `staff_review_notes` and upgrades do not trap.

**User-visible outcome:** Staff/Admin users can see and edit “Staff Review Notes” on the Referral review screen, and those notes persist on the Referral.
