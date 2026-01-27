import { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import PremiumNavigation from './components/PremiumNavigation';
import AnimatedBackground from './components/AnimatedBackground';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';
import { Toaster } from './components/ui/Toaster';
import ExitIntentModal from './components/ExitIntentModal';
import StickyCTA from './components/StickyCTA';
import { useExitIntent } from './hooks/useExitIntent';
import StructuredData from './components/StructuredData';
import Breadcrumbs from './components/Breadcrumbs';
import { prefetchCriticalRoutes } from './utils/prefetch';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
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

// Auth routes
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ConfirmEmail = lazy(() => import('./pages/ConfirmEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));

// NEW ARCHITECTURE: Core 5 Pillars
const Overview = lazy(() => import('./pages/Overview'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const SignalsPage = lazy(() => import('./pages/SignalsPage')); // Unified Signals
const EventsFeed = lazy(() => import('./pages/EventsFeed'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const ScenariosPage = lazy(() => import('./pages/ScenariosPage')); // Renamed from Impacts
const Alerts = lazy(() => import('./pages/Alerts'));

// Detail pages
const SignalDetailPage = lazy(() => import('./pages/SignalDetailPage'));
const ImpactDetailPage = lazy(() => import('./pages/ImpactDetailPage'));
const PredictionPage = lazy(() => import('./pages/PredictionPage'));

// Other modules (kept for now)
const Research = lazy(() => import('./pages/Research'));
const SearchHome = lazy(() => import('./pages/SearchHome'));
const SearchWorkspace = lazy(() => import('./pages/SearchWorkspace'));
const Recommendations = lazy(() => import('./pages/Recommendations'));

// User / System
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const AlertSettings = lazy(() => import('./pages/AlertSettings'));
const QualityDashboard = lazy(() => import('./pages/QualityDashboard'));

// Legal & Info Pages
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const FAQ = lazy(() => import('./pages/FAQ'));

// Loading component for Suspense fallback
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

function App() {
  const { toast, hideToast } = useToast();
  const [showExitModal, setShowExitModal] = useState(false);
  const location = useLocation();

  // Sync Clerk user with Sentry
  useSentryUser();

  // Prefetch critical routes on mount
  useEffect(() => {
    prefetchCriticalRoutes();
  }, []);

  useExitIntent(() => {
    const hasSubmitted = localStorage.getItem('access-request-submitted');
    if (!hasSubmitted && !showExitModal) {
      setShowExitModal(true);
    }
  });

  // Hide navigation and marketing components on auth/app pages
  // NEW ARCHITECTURE: Updated paths for 5 core pillars
  // All routes that use AppShell should be in this list
  const hideMarketingPaths = [
    // Auth routes
    '/login', '/register', '/auth', '/confirm-email', '/forgot-password', '/reset-password',
    // Command Center (primary dashboard)
    '/command-center',
    // Core 5 pillars
    '/app', '/dashboard', '/overview',
    '/signals', '/events', '/scenarios', '/alerts',
    // Legacy routes (redirected)
    '/intelligence', '/signals-feed', '/corporate-impact', '/discover', '/impacts',
    // Other app routes
    '/research', '/search', '/recommendations', '/quality',
    '/profile', '/settings', '/onboarding'
  ];
  
  // Special handling for /intelligence vs /intelligence-page
  const isAppIntelligence = (location.pathname === '/intelligence' || location.pathname.startsWith('/intelligence/')) && 
                            !location.pathname.startsWith('/intelligence-page');
  
  // Check if current path is an app page (uses AppShell)
  // This covers all routes including dynamic ones (e.g., /signals/:id, /events/:id, etc.)
  const shouldHideMarketing = hideMarketingPaths.some(path => location.pathname.startsWith(path)) || isAppIntelligence;

  // Define all routes once
  const routes = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Marketing Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/partners" element={<PartnerProgram />} />
        <Route path="/intelligence-page" element={<Intelligence />} />
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/papers" element={<Papers />} />
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
        
        {/* NEW ARCHITECTURE: Command Center + 5 Pillars */}
        <Route path="/command-center" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
        <Route path="/overview" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
        <Route path="/signals" element={<ProtectedRoute><SignalsPage /></ProtectedRoute>} />
        <Route path="/signals/:id" element={<ProtectedRoute><SignalDetailPage /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><EventsFeed /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
        <Route path="/scenarios" element={<ProtectedRoute><ScenariosPage /></ProtectedRoute>} />
        <Route path="/scenarios/:id" element={<ProtectedRoute><ImpactDetailPage /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        
        {/* Legacy Redirects - all go to Command Center */}
        <Route path="/dashboard" element={<Navigate to="/command-center" replace />} />
        <Route path="/app" element={<Navigate to="/command-center" replace />} />
        
        {/* Legacy Intelligence/Corporate Impact/Discover → Signals */}
        <Route path="/intelligence" element={<Navigate to="/signals" replace />} />
        <Route path="/intelligence/*" element={<Navigate to="/signals" replace />} />
        <Route path="/signals-feed" element={<Navigate to="/signals" replace />} />
        <Route path="/corporate-impact" element={<Navigate to="/signals" replace />} />
        <Route path="/discover" element={<Navigate to="/signals" replace />} />
        
        {/* Legacy Impacts → Scenarios */}
        <Route path="/impacts" element={<Navigate to="/scenarios" replace />} />
        <Route path="/impacts/:id" element={<Navigate to="/scenarios/:id" replace />} />
        
        {/* Legacy Events → Events (simplified) */}
        <Route path="/events-feed" element={<Navigate to="/events" replace />} />
        <Route path="/events-feed/:id" element={<Navigate to="/events/:id" replace />} />
        <Route path="/events/:eventId/predictions" element={<ProtectedRoute><PredictionPage /></ProtectedRoute>} />
        
        {/* Other Modules */}
        <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchHome /></ProtectedRoute>} />
        <Route path="/search/session/:sessionId" element={<ProtectedRoute><SearchWorkspace /></ProtectedRoute>} />
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        
        {/* User / System */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/alerts" element={<ProtectedRoute><AlertSettings /></ProtectedRoute>} />
        <Route path="/quality" element={<ProtectedRoute><QualityDashboard /></ProtectedRoute>} />
        
        {/* Onboarding */}
        <Route path="/onboarding" element={<ProtectedRoute><ErrorBoundary><Onboarding /></ErrorBoundary></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );

  // Common components
  const commonComponents = (
    <>
      <StructuredData type="Organization" />
      <StructuredData type="WebSite" />

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

      <Toaster />
    </>
  );

  // For app pages, render without the wrapper to avoid extra spacing
  // AppShell already has min-h-screen and handles its own layout
  if (shouldHideMarketing) {
    return (
      <>
        {commonComponents}
        {routes}
      </>
    );
  }

  // For marketing pages, use the wrapper
  return (
    <div className="relative min-h-screen">
      {commonComponents}
      {!shouldHideMarketing && <AnimatedBackground />}
      {!shouldHideMarketing && <PremiumNavigation />}
      {!shouldHideMarketing && <Breadcrumbs />}
      {!shouldHideMarketing && <StickyCTA />}
      {routes}
    </div>
  );
}

export default App;
