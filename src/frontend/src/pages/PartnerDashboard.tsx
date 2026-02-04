import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PartnerReferralsTab from '../components/PartnerReferralsTab';
import PartnerAgencyProfileTab from '../components/PartnerAgencyProfileTab';
import { FileText, Plus, Building2 } from 'lucide-react';

export default function PartnerDashboard() {
  const [activeTab, setActiveTab] = useState('my-referrals');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Partner Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your agency profile and submit referrals
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="my-referrals" className="gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">My Referrals</span>
              </TabsTrigger>
              <TabsTrigger value="submit" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Submit Referral</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="gap-2">
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">Agency Profile</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-referrals">
              <PartnerReferralsTab mode="list" />
            </TabsContent>

            <TabsContent value="submit">
              <PartnerReferralsTab mode="create" />
            </TabsContent>

            <TabsContent value="profile">
              <PartnerAgencyProfileTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
