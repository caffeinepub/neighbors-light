# Specification

## Summary
**Goal:** Redeploy the most recent successful build artifact (backend and frontend canisters) using the existing production deployment process, without introducing any new feature or UI changes.

**Planned changes:**
- Redeploy backend canister first, then redeploy frontend assets, following the documented deployment ordering/process.
- If redeploy fails, capture and surface the complete error output for the failing step and apply the minimal deployment/build correctness fix required to make redeploy succeed (no product functionality changes).

**User-visible outcome:** The app is redeployed successfully; users can log in via Internet Identity and reach the same role-gated dashboard (Admin/Staff/Partner) as in the last successful build, with no new behavior changes.
