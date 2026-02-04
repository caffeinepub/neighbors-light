import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '../components/Header';
import Footer from '../components/Footer';
import StaffOverviewCompact from '../components/StaffOverviewCompact';
import ReferralsTab from '../components/ReferralsTab';
import IntakesTab from '../components/IntakesTab';
import BedsTab from '../components/BedsTab';
import { LayoutDashboard, Users, ClipboardList, BedDouble } from 'lucide-react';

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Staff Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage daily operations and client services
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
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
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <StaffOverviewCompact onNavigateToTab={setActiveTab} />
            </TabsContent>

            <TabsContent value="referrals">
              <ReferralsTab isAdmin={false} />
            </TabsContent>

            <TabsContent value="intakes">
              <IntakesTab isAdmin={false} />
            </TabsContent>

            <TabsContent value="beds">
              <BedsTab isAdmin={false} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
