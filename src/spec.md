# Specification

## Summary
**Goal:** Capture and display who last updated each Referral and Intake record, along with the corresponding last-updated timestamp.

**Planned changes:**
- Backend: Persist a nullable “last updated by” principal on Referral and Intake records and update it (and `updatedAt`) on every mutation that changes the record, including the specified referral and intake update paths (and ensuring intake bed assignment updates `updatedAt`).
- Backend: Ensure `updatedAt` for Referrals and Intakes always reflects the most recent mutation time across the same set of update paths.
- Frontend: Show “Last updated” and “Last updated by” in the Referral detail view, using `updatedAt` and the stored principal with existing user lookup and required fallbacks (“System” when absent; shortened principal when name unavailable).
- Frontend: Show “Last updated” and “Last updated by” in the Intake detail view and in the Admin Intake Data table view.
- Frontend: Update canister bindings/TypeScript types so the new last-updated-by fields are available without breaking existing queries/mutations and handle null/undefined safely.

**User-visible outcome:** Referral and Intake screens display “Last updated” and “Last updated by,” and the Admin Intake Data table shows the same fields per intake, reflecting the latest change made in the system.
