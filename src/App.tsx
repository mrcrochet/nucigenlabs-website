import { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PremiumNavigation from './components/PremiumNavigation';
import AnimatedBackground from './components/AnimatedBackground';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';
import ExitIntentModal from './components/ExitIntentModal';
import StickyCTA from './components/StickyCTA';
import { useExitIntent } from './hooks/useExitIntent';
import StructuredData from './components/StructuredData';
import Breadcrumbs from './components/Breadcrumbs';
import { prefetchCriticalRoutes } from './utils/prefetch';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import OnboardingGuard from './components/OnboardingGuard';
import ErrorBoundary from './components/ErrorBoundary';
import { useSentryUser } from './hooks/useSentryUser';
import Home from './pages/Home';

// Lazy load routes for better performance
// Public marketing routes
const Pricing = lazy(() => import('./pages/Pricing'));
const PartnerProgram = lazy(() => import('./pages/PartnerProgram'));
const Intelligence = lazy(() => import('./pages/Intelligence'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));
const Papers = lazy(() => import('./pages/Papers'));
// Auth routes - Preload critical auth routes for smooth transitions
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ConfirmEmail = lazy(() => import('./pages/ConfirmEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
// Application core routes (PHASE 2D)
// Legacy pages - now redirected to /overview
// const Dashboard = lazy(() => import('./pages/Dashboard'));
const IntelligenceFeed = lazy(() => import('./pages/IntelligenceFeed'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
// New Dashboard UI (UI Spec compliant)
const Overview = lazy(() => import('./pages/Overview'));
const EventsFeed = lazy(() => import('./pages/EventsFeed'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const SignalsFeed = lazy(() => import('./pages/SignalsFeed'));
const SignalDetailPage = lazy(() => import('./pages/SignalDetailPage'));
const MarketsPage = lazy(() => import('./pages/MarketsPage'));
const AssetDetailPage = lazy(() => import('./pages/AssetDetailPage'));
const ImpactsPage = lazy(() => import('./pages/ImpactsPage'));
const ImpactDetailPage = lazy(() => import('./pages/ImpactDetailPage'));
// Modules (Beta / Locked)
const Alerts = lazy(() => import('./pages/Alerts'));
const Research = lazy(() => import('./pages/Research'));
// User / System
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
// Quality (PHASE 3B)
const QualityDashboard = lazy(() => import('./pages/QualityDashboard'));
// Alerts (PHASE 3C)
const AlertSettings = lazy(() => import('./pages/AlertSettings'));
// Recommendations (PHASE 7)
const Recommendations = lazy(() => import('./pages/Recommendations'));
// Legal & Info Pages
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const FAQ = lazy(() => import('./pages/FAQ'));

// Loading component for Suspense fallback - smoother transition
const PageLoader = () => (
  <div 
    className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A] z-50 transition-opacity duration-300"
    role="status"
    aria-label="Loading page"
  >
    <div className="text-center">
      <div 
        className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"
        aria-hidden="true"
      ></div>
      <p className="text-sm text-slate-500 font-light">Loading...</p>
    </div>
  </div>
);

// Smooth page transition wrapper
const PageTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="animate-in fade-in duration-200">
      {children}
    </div>
  );
};

function App() {
  const { toast, showToast, hideToast } = useToast();
  const [showExitModal, setShowExitModal] = useState(false);
  const location = useLocation();

  // Sync Clerk user with Sentry
  useSentryUser();

  // Prefetch critical routes on mount
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);

  useExitIntent(() => {
    // Only show if user hasn't already submitted
    const hasSubmitted = localStorage.getItem('access-request-submitted');
    if (!hasSubmitted && !showExitModal) {
      setShowExitModal(true);
    }
  });

  // Hide navigation and marketing components on auth/app pages
  // All app routes should hide marketing components (landing page navigation, background, etc.)
  // NOTE: Marketing pages (/intelligence-page, /case-studies, /papers) are PUBLIC and should show marketing navigation
  const hideMarketingPaths = [
    // Auth routes
    '/login', '/register', '/auth', '/confirm-email', '/forgot-password', '/reset-password',
    // App routes (all protected routes)
    '/app', '/dashboard', '/overview',
    '/events', '/events-feed',
    '/signals', '/signals-feed',
    '/markets', '/impacts',
    '/alerts', '/research', '/recommendations', '/quality',  // App Research, NOT /papers (marketing)
    '/profile', '/settings', '/onboarding'
  ];
  
  // Special handling for /intelligence vs /intelligence-page
  // /intelligence = app route (hide marketing), /intelligence-page = marketing route (show marketing)
  // We need exact match or starts with /intelligence/ but NOT /intelligence-page
  const isAppIntelligence = (location.pathname === '/intelligence' || location.pathname.startsWith('/intelligence/')) && 
                            !location.pathname.startsWith('/intelligence-page');
  const shouldHideMarketing = hideMarketingPaths.some(path => location.pathname.startsWith(path)) || isAppIntelligence;

  return (
    <div className="relative min-h-screen">
      <StructuredData type="Organization" />
      <StructuredData type="WebSite" />
      {!shouldHideMarketing && <AnimatedBackground />}
      {!shouldHideMarketing && <PremiumNavigation />}
      {!shouldHideMarketing && <Breadcrumbs />}
      {!shouldHideMarketing && <StickyCTA />}

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <ExitIntentModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
      />

      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Marketing Routes - Accessible without authentication */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/partners" element={<PartnerProgram />} />
        <Route path="/intelligence-page" element={<Intelligence />} /> {/* Marketing Intelligence - Public */}
        <Route path="/case-studies" element={<CaseStudies />} /> {/* Marketing Case Studies - Public */}
        <Route path="/papers" element={<Papers />} /> {/* Marketing Research - Public */}
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<FAQ />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/confirm-email" element={<PublicRoute><ConfirmEmail /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected App Routes - PHASE 2D SITEMAP */}
        {/* Level 1 - Application Core */}
        {/* Note: Onboarding is now optional. Users can access all features and complete onboarding when ready via the banner */}
        {/* Legacy redirect: /dashboard → /overview (new UI spec compliant page) */}
        <Route path="/dashboard" element={<Navigate to="/overview" replace />} />
        <Route path="/app" element={<Navigate to="/overview" replace />} /> {/* Legacy redirect */}
        <Route path="/intelligence" element={<ProtectedRoute><IntelligenceFeed /></ProtectedRoute>} /> {/* App Intelligence - Protected, different from /intelligence-page */}
        
        {/* Legacy redirect: /events → /events-feed (new UI spec compliant page) */}
        <Route path="/events" element={<Navigate to="/events-feed" replace />} />
        <Route path="/events/:event_id" element={<Navigate to="/events-feed/:id" replace />} />
        
        {/* New Dashboard UI (UI Spec compliant) */}
        <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
        <Route path="/events-feed" element={<ProtectedRoute><EventsFeed /></ProtectedRoute>} />
        <Route path="/events-feed/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
        <Route path="/signals-feed" element={<ProtectedRoute><SignalsFeed /></ProtectedRoute>} />
        <Route path="/signals/:id" element={<ProtectedRoute><SignalDetailPage /></ProtectedRoute>} />
        <Route path="/markets" element={<ProtectedRoute><MarketsPage /></ProtectedRoute>} />
        <Route path="/markets/:symbol" element={<ProtectedRoute><AssetDetailPage /></ProtectedRoute>} />
        <Route path="/impacts" element={<ProtectedRoute><ImpactsPage /></ProtectedRoute>} />
        <Route path="/impacts/:id" element={<ProtectedRoute><ImpactDetailPage /></ProtectedRoute>} />
        
        {/* Level 2 - Modules (Beta / Locked) */}
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} /> {/* App Research - Protected, different from /papers (marketing) */}
        {/* Recommendations (PHASE 7) */}
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        
        {/* Level 3 - User / System */}
        {/* Profile and Settings */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/alerts" element={<ProtectedRoute><AlertSettings /></ProtectedRoute>} />
        {/* Quality (PHASE 3B) */}
        <Route path="/quality" element={<ProtectedRoute><QualityDashboard /></ProtectedRoute>} />
        
        {/* Onboarding */}
        <Route path="/onboarding" element={<ProtectedRoute><ErrorBoundary><Onboarding /></ErrorBoundary></ProtectedRoute>} />
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;
