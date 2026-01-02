import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut, TrendingUp, Globe, AlertCircle, BarChart3, Settings, Bell, Activity, Zap, Clock, Target, ArrowRight, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import SEO from '../components/SEO';
import SearchBar from '../components/SearchBar';
import MarketPredictions from '../components/MarketPredictions';
import IntelligenceFeed from '../components/IntelligenceFeed';

function DashboardContent() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'predictions' | 'alerts'>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  // Mock data - à remplacer par de vraies données plus tard
  const metrics = [
    { label: 'Events Analyzed Today', value: '2,847', change: '+12%', icon: Activity },
    { label: 'Avg Prediction Accuracy', value: '87.3%', change: '+2.1%', icon: Target },
    { label: 'Markets Monitored', value: '47', change: '+3', icon: Globe },
    { label: 'Avg Lead Time', value: '14.2h', change: '+1.8h', icon: Clock },
  ];

  const recentEvents = [
    {
      id: 1,
      title: 'Taiwan Semiconductor Factory Closure',
      level: 'Industrial',
      impact: 'High',
      time: '2h ago',
      prediction: 'Supply chain disruption expected in 12-24h',
    },
    {
      id: 2,
      title: 'New Sanctions on Russian Energy',
      level: 'Geopolitical',
      impact: 'Critical',
      time: '4h ago',
      prediction: 'Energy prices to adjust within 6-12h',
    },
    {
      id: 3,
      title: 'Shanghai Port Capacity Reduction',
      level: 'Supply Chain',
      impact: 'Medium',
      time: '6h ago',
      prediction: 'Logistics delays expected in 24-48h',
    },
  ];

  const predictions = [
    {
      asset: 'Crude Oil (WTI)',
      direction: 'up',
      confidence: 87,
      timeframe: '12-24h',
      reason: 'Supply constraints from sanctions',
    },
    {
      asset: 'Semiconductor ETF',
      direction: 'down',
      confidence: 72,
      timeframe: '24-48h',
      reason: 'Factory closure impact',
    },
    {
      asset: 'Shipping Index',
      direction: 'down',
      confidence: 65,
      timeframe: '48-72h',
      reason: 'Port capacity reduction',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <SEO 
        title="Dashboard — Nucigen Labs"
        description="Your Nucigen Labs dashboard"
      />

      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/[0.02] bg-[#0A0A0A]/20 backdrop-blur-xl">
        <div className="p-6 border-b border-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#E1463E] to-[#E1463E]/50 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-white font-light text-lg">NUCIGEN</span>
          </div>
          <p className="text-xs text-slate-600">Intelligence Platform</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-sm font-light">Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('intelligence')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'intelligence'
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-light">Intelligence</span>
          </button>
          <button
            onClick={() => setActiveTab('predictions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'predictions'
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-light">Predictions</span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'alerts'
                ? 'bg-white/[0.06] text-white'
                : 'text-slate-600 hover:text-white hover:bg-white/[0.02]'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-sm font-light">Alerts</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/[0.02]">
          <button
            onClick={() => navigate('/onboarding')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-white hover:bg-white/[0.02] transition-all"
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-light">Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-white hover:bg-white/[0.02] transition-all mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-light">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-white/[0.02] bg-[#0F0F0F]/30 backdrop-blur-xl">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden text-white p-2 hover:bg-white/[0.03] rounded-xl transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-light text-white leading-tight mb-1">
                    {activeTab === 'overview' && 'Dashboard'}
                    {activeTab === 'intelligence' && 'Intelligence'}
                    {activeTab === 'predictions' && 'Predictions'}
                    {activeTab === 'alerts' && 'Alerts'}
                  </h1>
                  {activeTab === 'overview' && (
                    <p className="text-sm text-slate-600 font-light">
                      Welcome back, {user?.name || user?.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/[0.02] rounded-xl">
                  <div className="w-2 h-2 bg-green-500/70 rounded-full animate-pulse"></div>
                  <span className="text-xs text-slate-600">Live</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/[0.03] transition-colors min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-white/[0.04] bg-[#0F0F0F]/40 backdrop-blur-xl">
            <nav className="p-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('overview');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[44px] ${
                  activeTab === 'overview'
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Activity className="w-5 h-5" />
                <span className="text-sm font-light">Overview</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('intelligence');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[44px] ${
                  activeTab === 'intelligence'
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-light">Intelligence Feed</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('predictions');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[44px] ${
                  activeTab === 'predictions'
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="text-sm font-light">Predictions</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('alerts');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all min-h-[44px] ${
                  activeTab === 'alerts'
                    ? 'bg-white/[0.06] text-white'
                    : 'text-slate-500 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span className="text-sm font-light">Alerts</span>
              </button>
              <button
                onClick={() => {
                  navigate('/onboarding');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.03] transition-all min-h-[44px]"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-light">Settings</span>
              </button>
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0F0F0F]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12">
            {activeTab === 'overview' && (
              <>
                {/* Welcome Section */}
                {(!user?.company || !user?.sector || !user?.intended_use) && (
                  <div className="mb-10 bg-gradient-to-br from-[#E1463E]/8 to-[#E1463E]/4 rounded-2xl p-6 border border-[#E1463E]/15">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-light text-white mb-2">Complete Your Profile</h3>
                        <p className="text-base text-slate-500 font-light mb-5 leading-relaxed">
                          Help us personalize your experience and provide better insights.
                        </p>
                        <button
                          onClick={() => navigate('/onboarding')}
                          className="px-5 py-2.5 bg-[#E1463E] text-white rounded-xl hover:bg-[#E1463E]/90 transition-colors text-sm font-light"
                        >
                          Complete Profile
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Bar - Prominent */}
                <div className="mb-10 flex justify-center">
                  <div className="w-full max-w-3xl">
                    <SearchBar 
                      placeholder="Ask anything about global markets, events, or assets..."
                      onSearch={(query) => {
                        console.log('Search:', query);
                        // TODO: Implement search
                      }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                  {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    return (
                      <div
                        key={index}
                        className="bg-white/[0.02] rounded-2xl p-6 hover:bg-white/[0.03] transition-all"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-10 h-10 bg-[#E1463E]/15 rounded-xl flex items-center justify-center">
                            <Icon className="w-5 h-5 text-[#E1463E]" />
                          </div>
                          <span className="text-xs text-green-500/70 font-light">{metric.change}</span>
                        </div>
                        <p className="text-2xl font-light text-white mb-2 leading-tight">{metric.value}</p>
                        <p className="text-sm text-slate-600 font-light leading-relaxed">{metric.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Market Predictions Section */}
                <div className="mb-12">
                  <MarketPredictions />
                </div>

                {/* Recent Events */}
                <div className="bg-white/[0.02] rounded-2xl p-7">
                  <div className="flex items-center justify-between mb-7">
                    <h2 className="text-xl font-light text-white">Recent Events</h2>
                    <button
                      onClick={() => setActiveTab('intelligence')}
                      className="text-sm text-[#E1463E] hover:text-[#E1463E]/80 transition-colors flex items-center gap-1.5 font-light"
                    >
                      View all <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-5">
                    {recentEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-5 bg-white/[0.015] rounded-xl hover:bg-white/[0.025] transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-base font-light text-white leading-snug pr-4">{event.title}</h3>
                          <span className="text-xs text-slate-600 whitespace-nowrap">{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs px-2.5 py-1 bg-white/[0.05] rounded-lg text-slate-500">{event.level}</span>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg font-light ${
                              event.impact === 'Critical'
                                ? 'bg-[#E1463E]/15 text-[#E1463E]'
                                : event.impact === 'High'
                                ? 'bg-orange-500/15 text-orange-500/80'
                                : 'bg-yellow-500/15 text-yellow-500/80'
                            }`}
                          >
                            {event.impact}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 font-light leading-relaxed">{event.prediction}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'intelligence' && (
              <div className="space-y-8">
                {/* Search Bar */}
                <div className="flex justify-center">
                  <SearchBar 
                    placeholder="Search for events, assets, regions, or ask a question..."
                    onSearch={(query) => {
                      console.log('Search:', query);
                      // TODO: Implement search
                    }}
                  />
                </div>

                {/* Intelligence Feed */}
                <IntelligenceFeed showFilters={true} />
              </div>
            )}

            {activeTab === 'predictions' && (
              <div className="space-y-8">
                {/* Search Bar */}
                <div className="flex justify-center">
                  <SearchBar 
                    placeholder="Search for assets, markets, or ask about predictions..."
                    onSearch={(query) => {
                      console.log('Search:', query);
                      // TODO: Implement search
                    }}
                  />
                </div>

                {/* Market Predictions */}
                <MarketPredictions />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="bg-white/[0.02] rounded-2xl p-12">
                <div className="max-w-2xl mx-auto text-center">
                  <Bell className="w-12 h-12 text-slate-700 mx-auto mb-6" />
                  <h3 className="text-xl font-light text-white mb-3">Alerts & Notifications</h3>
                  <p className="text-base text-slate-500 font-light leading-relaxed mb-2">
                    Configure custom alerts for events matching your criteria: specific regions, asset classes, impact levels, or keywords.
                  </p>
                  <p className="text-sm text-slate-600 font-light leading-relaxed">
                    Alerts can be delivered via email, in-app notifications, or webhook integrations to your existing systems.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
