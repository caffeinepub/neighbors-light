import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DashboardOverview from '../components/DashboardOverview';
import AdminRiskOverviewCompact from '../components/AdminRiskOverviewCompact';
import AdminStatusCheckCard from '../components/AdminStatusCheckCard';
import ReferralsTab from '../components/ReferralsTab';
import IntakesTab from '../components/IntakesTab';
import BedsTab from '../components/BedsTab';
import FacilitiesTab from '../components/FacilitiesTab';
import AccessRequestsTab from '../components/AccessRequestsTab';
import UserManagementTab from '../components/UserManagementTab';
import ActivityLogTab from '../components/ActivityLogTab';
import { LayoutDashboard, Users, ClipboardList, BedDouble, Building2, UserCheck, Settings, ScrollText } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage all operations and view comprehensive analytics
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 lg:w-auto lg:inline-grid">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="referrals" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Referrals</span>
              </TabsTrigger>
              <TabsTrigger value="intakes" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Intakes</span>
              </TabsTrigger>
              <TabsTrigger value="beds" className="gap-2">
                <BedDouble className="h-4 w-4" />
                <span className="hidden sm:inline">Beds</span>
              </TabsTrigger>
              <TabsTrigger value="facilities" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Facilities</span>
              </TabsTrigger>
              <TabsTrigger value="access-requests" className="gap-2">
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Access</span>
              </TabsTrigger>
              <TabsTrigger value="user-management" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-2">
                <ScrollText className="h-4 w-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AdminStatusCheckCard />
              <AdminRiskOverviewCompact onNavigateToTab={setActiveTab} />
              <DashboardOverview isAdmin={true} />
            </TabsContent>

            <TabsContent value="referrals">
              <ReferralsTab isAdmin={true} />
            </TabsContent>

            <TabsContent value="intakes">
              <IntakesTab isAdmin={true} />
            </TabsContent>

            <TabsContent value="beds">
              <BedsTab isAdmin={true} />
            </TabsContent>

            <TabsContent value="facilities">
              <FacilitiesTab />
            </TabsContent>

            <TabsContent value="access-requests">
              <AccessRequestsTab />
            </TabsContent>

            <TabsContent value="user-management">
              <UserManagementTab />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityLogTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
