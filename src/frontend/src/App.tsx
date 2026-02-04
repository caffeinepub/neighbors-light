import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useIsAdmin } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from './pages/LoginPage';
import ProfileSetupModal from './components/ProfileSetupModal';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import AccessDeniedScreen from './components/AccessDeniedScreen';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const {
    data: isAdmin,
    isLoading: adminLoading,
    isFetched: adminFetched,
  } = useIsAdmin();

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
  if (profileLoading || adminLoading || loginStatus === 'logging-in') {
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
