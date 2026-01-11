/**
 * PHASE 2D: Profile Page
 * 
 * User profile settings
 * Sector of interest, regions, use case
 * Serves later for scoring
 */

import { useState, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { getUserProfile } from '../lib/supabase';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import OnboardingBanner from '../components/OnboardingBanner';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';

function ProfileContent() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isLoaded: authLoaded } = useClerkAuth();
  
  // Force user to load by accessing auth state
  const isFullyLoaded = userLoaded && authLoaded;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      // Wait for user and auth to be fully loaded
      if (!isFullyLoaded || !user?.id) {
        if (isFullyLoaded && !user?.id) {
          setLoading(false);
        }
        return;
      }
      
      try {
        setLoading(true);
        const data = await getUserProfile(user.id);
        setProfile(data);
      } catch (err) {
        console.error('Error loading profile :', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user?.id, isFullyLoaded]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Profile — Nucigen Labs"
        description="User profile and preferences"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <SectionHeader
              title="Profile"
              subtitle="Your preferences and settings"
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
          <OnboardingBanner />
        <Card className="p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-light text-slate-400 mb-2">Email</label>
              <p className="text-base text-white font-light">{user?.primaryEmailAddress?.emailAddress || profile?.email || 'N/A'}</p>
            </div>
            {profile && (
              <>
                {profile.company && (
                  <div>
                    <label className="block text-sm font-light text-slate-400 mb-2">Company</label>
                    <p className="text-base text-white font-light">{profile.company}</p>
                  </div>
                )}
                {profile.professional_role && (
                  <div>
                    <label className="block text-sm font-light text-slate-400 mb-2">Role</label>
                    <p className="text-base text-white font-light">{profile.professional_role}</p>
                  </div>
                )}
                {profile.sector && (
                  <div>
                    <label className="block text-sm font-light text-slate-400 mb-2">Sector of Interest</label>
                    <p className="text-base text-white font-light">{profile.sector}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>
        </main>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

