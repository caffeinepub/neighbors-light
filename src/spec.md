# Specification

## Summary
**Goal:** Adjust the public referral submission form’s website field label, helper text, and spacing for clearer guidance without changing behavior.

**Planned changes:**
- In `frontend/src/pages/PublicReferralPage.tsx`, update the existing website field (`website` if present, otherwise `company_website`) label text to exactly “Website (leave blank)”.
- Add helper text directly below the website input reading exactly “Please leave this field empty.”.
- Increase vertical spacing above the website field so it is visually separated from the main referral questions.

**User-visible outcome:** On `/public/referral`, users see the website field clearly marked as “Website (leave blank)” with the helper line “Please leave this field empty.” and additional spacing separating it from the main questions, while submission behavior remains unchanged.
