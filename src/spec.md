# Specification

## Summary
**Goal:** Add combinable Status, Program requested, and Submission date range filters to the Admin Referrals Data View so admins can quickly narrow the referrals queue.

**Planned changes:**
- Add filter controls to the Admin Referrals Data View for Status (with an “All” option), Program requested (with an “All programs” option), and Submission date range (start/end date inputs).
- Implement AND-based filtering so only referrals matching all selected filters are shown, updating the visible list immediately when any filter changes.
- Populate the Program requested filter options by deriving a unique, sorted list of `programRequested` values from the currently loaded referrals data.
- Implement date range filtering using `referral.createdAt` as the submission timestamp with inclusive start/end boundaries and support for start-only or end-only filtering.

**User-visible outcome:** Admins can filter the referrals list by status, requested program, and/or submission date range, with results updating instantly without a page refresh.
