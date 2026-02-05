# Specification

## Summary
**Goal:** Simplify the public referral form’s anti-spam approach by replacing any honeypot behavior with a visible, non-blocking “Website (leave blank)” field.

**Planned changes:**
- Add a standard visible text input named `website` (id=`website`) to `frontend/src/pages/PublicReferralPage.tsx`, labeled exactly “Website (leave blank)”, placed at the bottom of the form (below existing fields and above the submit button/footer area), styled to be visually unobtrusive but still usable.
- Remove/avoid any honeypot or conditional submission logic tied to `website` (no hiding, no blocking, no ignoring submissions, no branching checks); keep the existing `useCreateReferral` / `actor.createReferral` mutation flow unchanged.

**User-visible outcome:** Users see an optional “Website (leave blank)” field at the bottom of the public referral form, and submitting the form works the same whether the field is filled or empty.
