# Production Smoke Test Procedure

This document outlines the manual smoke test flow to verify the production deployment is functioning correctly, with specific focus on confirming Admin users can access the Admin dashboard without encountering an "Access Pending" lockout.

## Test Environment

- **URL:** `https://<frontend-canister-id>.ic0.app`
- **Browser:** Chrome (latest), Firefox (latest), Safari (latest)
- **Network:** Production Internet Computer network

## Pre-Test Setup

1. Open browser in incognito/private mode (clean state)
2. Clear browser cache and cookies
3. Open browser DevTools (F12)
4. Navigate to Console tab to monitor for errors
5. Navigate to Network tab to monitor API calls

## Test 1: Application Loads Successfully

**Objective:** Verify the application loads without errors

**Steps:**
1. Navigate to `https://<frontend-canister-id>.ic0.app`
2. Wait for page to fully load

**Expected Results:**
- ✅ Page loads within 5 seconds
- ✅ No JavaScript errors in browser console
- ✅ Login page displays with "Neighbors" logo
- ✅ "Login with Internet Identity" button is visible and enabled
- ✅ "Request Access" button is visible

**Failure Indicators:**
- ❌ Blank white screen
- ❌ Console errors (red text in DevTools Console)
- ❌ Network errors (failed requests in Network tab)
- ❌ Missing UI elements

**Capture on Failure:**
- Screenshot of page
- Full console log (right-click → Save as...)
- Network tab HAR export (right-click → Save all as HAR)

## Test 2: Internet Identity Authentication

**Objective:** Verify Internet Identity login flow works

**Steps:**
1. Click "Login with Internet Identity" button
2. Complete Internet Identity authentication
3. Wait for redirect back to application

**Expected Results:**
- ✅ Internet Identity modal/window opens
- ✅ Authentication completes successfully
- ✅ Redirects back to application
- ✅ No authentication errors in console

**Failure Indicators:**
- ❌ Internet Identity window fails to open
- ❌ Authentication errors
- ❌ Redirect fails or loops
- ❌ Console errors related to auth

**Capture on Failure:**
- Screenshot of error state
- Console log showing authentication errors
- Network tab showing failed auth requests

## Test 3: Admin User - No Access Pending Lockout

**Objective:** Verify Admin users can access Admin dashboard without "Access Pending" screen

**Prerequisites:**
- Test with a principal ID that is recognized as Admin by the backend OR
- Test with the first user to log in (bootstrap admin)

**Steps:**
1. Complete Internet Identity login (Test 2)
2. If prompted for profile setup, enter name and submit
3. Wait for dashboard to load
4. Observe which dashboard/screen is displayed

**Expected Results:**
- ✅ Admin Dashboard loads successfully
- ✅ "Admin Dashboard" header is visible at top of page
- ✅ Eight tabs are visible: Overview, Referrals, Intakes, Beds, Facilities, Access, Users, Activity
- ✅ Overview tab is active by default
- ✅ Admin Status Check card is visible at the top of Overview tab
- ✅ Admin Status Check shows "Admin Status: Admin" badge
- ✅ Dashboard metrics cards are visible
- ✅ NO "Access Pending" message is shown
- ✅ NO "AccessDeniedScreen" component is displayed

**Failure Indicators:**
- ❌ "Access Pending" screen is displayed
- ❌ "Your access request is being reviewed" message appears
- ❌ User is blocked from accessing Admin dashboard
- ❌ Dashboard tabs are not visible
- ❌ Console errors related to role/permission checks
- ❌ Admin Status Check shows "Not Admin" when user should be admin

**Capture on Failure:**
- Screenshot showing "Access Pending" screen or incorrect dashboard
- Console log showing role check results
- Network tab showing `isAdmin` and `getCallerUserProfile` responses
- Copy the principal ID from browser console: `identity.getPrincipal().toString()`

**Debug Information to Collect:**
- Principal ID of the test user
- Response from `isAdmin()` backend call
- Response from `getCallerUserProfile()` backend call
- Any console errors or warnings

## Test 4: Admin Status Check Verification

**Objective:** Verify the Admin Status Check card displays correct information

**Prerequisites:**
- Logged in as Admin user (Test 3 passed)
- On Admin Dashboard Overview tab

**Steps:**
1. Locate the "Admin Status Check" card at the top of the Overview tab
2. Verify the displayed information

**Expected Results:**
- ✅ Card displays "Admin Status Check" title with shield icon
- ✅ "Your Principal" shows the current user's principal ID
- ✅ "Admin Status" shows green "Admin" badge with checkmark
- ✅ "All Admin Principals" section lists all admin principals
- ✅ Current user's principal is marked with "You" badge in the list
- ✅ No error messages or loading states persist

**Failure Indicators:**
- ❌ Card shows loading skeleton indefinitely
- ❌ Error message displayed in the card
- ❌ "Admin Status" shows "Not Admin" for an admin user
- ❌ Admin principals list is empty when admins exist
- ❌ Principal IDs are not displayed correctly

**Capture on Failure:**
- Screenshot of the Admin Status Check card
- Console log showing any errors
- Network tab showing `getAdminStatusCheck` response

## Test 5: Header Role Display

**Objective:** Verify the header displays "Admin" role for admin users

**Prerequisites:**
- Logged in as Admin user (Test 3 passed)

**Steps:**
1. Click on the user avatar/name in the top-right header
2. Observe the dropdown menu

**Expected Results:**
- ✅ Dropdown shows user's name
- ✅ Dropdown shows "Admin" as the role (not "Staff" or other role)

**Failure Indicators:**
- ❌ Role shows "Staff" when user is admin
- ❌ Role shows incorrect value
- ❌ Role is missing or shows as undefined

**Capture on Failure:**
- Screenshot of the user dropdown menu
- Console log showing user profile and admin status

## Test 6: Non-Admin User Access Control

**Objective:** Verify non-admin users are properly routed based on their role

**Prerequisites:**
- Test with a non-admin user (Staff or Partner Agency)

**Steps:**
1. Complete Internet Identity login
2. Wait for dashboard to load
3. Observe which dashboard is displayed

**Expected Results:**
- ✅ Staff users see Staff Dashboard (not Admin Dashboard)
- ✅ Partner Agency users see Partner Dashboard
- ✅ Users without roles see "Access Pending" screen
- ✅ Header shows correct role (Staff or PartnerAgency)

**Failure Indicators:**
- ❌ Non-admin users can access Admin Dashboard
- ❌ Users are incorrectly routed
- ❌ Role display is incorrect

**Capture on Failure:**
- Screenshot of the dashboard
- Console log showing role check results
- Network tab showing backend responses
