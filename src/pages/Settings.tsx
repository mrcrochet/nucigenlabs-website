/**
 * PHASE 2D: Settings Page
 * 
 * Account settings
 * Notifications (placeholder)
 * API access (locked)
 */

import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import AppSidebar from '../components/AppSidebar';
import Card from '../components/ui/Card';
import SectionHeader from '../components/ui/SectionHeader';
import { Settings as SettingsIcon, Lock } from 'lucide-react';

function SettingsContent() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Settings — Nucigen Labs"
        description="Account and application settings"
      />

      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6">
            <SectionHeader
              title="Settings"
              subtitle="Account and preferences"
            />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 w-full">
        <div className="space-y-6">
          {/* Account */}
          <Card className="p-6">
            <h3 className="text-lg font-light text-white mb-4">Account</h3>
            <p className="text-sm text-slate-500 font-light">
              Account management features coming soon.
            </p>
          </Card>

          {/* Notifications */}
          <Card className="p-6">
            <h3 className="text-lg font-light text-white mb-4">Notifications</h3>
            <p className="text-sm text-slate-500 font-light">
              Notification preferences will be available soon.
            </p>
          </Card>

          {/* API Access */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-light text-white mb-2">API Access</h3>
                <p className="text-sm text-slate-500 font-light">
                  API access is currently locked. This feature will be available in a future update.
                </p>
              </div>
              <Lock className="w-5 h-5 text-slate-500" />
            </div>
          </Card>
        </div>
        </main>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

