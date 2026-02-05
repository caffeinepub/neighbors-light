import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsAdmin } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from './pages/LoginPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import PublicReferralPage from './pages/PublicReferralPage';
import AccessDeniedScreen from './components/AccessDeniedScreen';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // All hooks must be called at the top level, before any conditional returns
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    refetch: refetchProfile,
  } = useGetCallerUserProfile();

  const {
    data: isAdmin,
    isLoading: adminLoading,
    isFetched: adminFetched,
    refetch: refetchAdmin,
  } = useIsAdmin();

  // Trigger profile fetch immediately after authentication to ensure backend self-repair runs
  // IMPORTANT: This effect must remain read-only and must NOT trigger any bed inventory mutations.
  // Bed data persistence requires that no automatic initialization or reset occurs during app startup.
  useEffect(() => {
    if (isAuthenticated && !profileLoading && !profileFetched) {
      refetchProfile();
    }
  }, [isAuthenticated, profileLoading, profileFetched, refetchProfile]);

  // After profile is fetched, ensure admin status is checked
  // IMPORTANT: This effect must remain read-only and must NOT trigger any bed inventory mutations.
  useEffect(() => {
    if (isAuthenticated && profileFetched && !adminLoading && !adminFetched) {
      refetchAdmin();
    }
  }, [isAuthenticated, profileFetched, adminLoading, adminFetched, refetchAdmin]);

  // Check if we're on the public referral route (after all hooks are called)
  const isPublicReferralRoute = window.location.pathname === '/public/referral';

  // If on public referral route, render it without authentication
  if (isPublicReferralRoute) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <PublicReferralPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show loading state while fetching profile and admin status
  if (profileLoading || adminLoading || loginStatus === 'logging-in' || !profileFetched || !adminFetched) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // If user is Admin (backend recognition), show Admin dashboard immediately
  if (isAdmin) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AdminDashboard />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show profile setup if user doesn't have a profile yet (non-admin users only)
  const showProfileSetup = isAuthenticated && !profileLoading && profileFetched && userProfile === null;

  if (showProfileSetup) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ProfileSetupModal open={true} />
        <Toaster />
      </ThemeProvider>
    );
  }

  // For non-admin users, check if they have a role assigned in their profile
  const hasRole = userProfile?.role !== null && userProfile?.role !== undefined;
  
  if (!hasRole) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AccessDeniedScreen />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show appropriate dashboard based on profile role
  const isPartnerAgency = userProfile?.role === 'PartnerAgency';

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {isPartnerAgency ? <PartnerDashboard /> : <StaffDashboard />}
      <Toaster />
    </ThemeProvider>
  );
}
