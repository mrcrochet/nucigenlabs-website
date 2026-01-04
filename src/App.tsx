import { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import Home from './pages/Home';

// Lazy load routes for better performance
// Public marketing routes
const Pricing = lazy(() => import('./pages/Pricing'));
const PartnerProgram = lazy(() => import('./pages/PartnerProgram'));
// Auth routes - Preload critical auth routes for smooth transitions
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ConfirmEmail = lazy(() => import('./pages/ConfirmEmail'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
// Application core routes (PHASE 2D)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const IntelligenceFeed = lazy(() => import('./pages/IntelligenceFeed'));
const Events = lazy(() => import('./pages/Events'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
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

// Loading component for Suspense fallback - smoother transition
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A] z-50 transition-opacity duration-200">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
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
  const hideMarketingPaths = ['/login', '/register', '/auth', '/app', '/dashboard', '/intelligence', '/events', '/alerts', '/research', '/profile', '/settings', '/onboarding'];
  const shouldHideMarketing = hideMarketingPaths.some(path => location.pathname.startsWith(path));

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
        {/* Public Marketing Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/partners" element={<PartnerProgram />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Protected App Routes - PHASE 2D SITEMAP */}
        {/* Level 1 - Application Core */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> {/* Legacy redirect */}
        <Route path="/intelligence" element={<ProtectedRoute><IntelligenceFeed /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/events/:event_id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
        
        {/* Level 2 - Modules (Beta / Locked) */}
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="/research" element={<ProtectedRoute><Research /></ProtectedRoute>} />
        {/* Recommendations (PHASE 7) */}
        <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        
        {/* Level 3 - User / System */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/settings/alerts" element={<ProtectedRoute><AlertSettings /></ProtectedRoute>} />
        {/* Quality (PHASE 3B) */}
        <Route path="/quality" element={<ProtectedRoute><QualityDashboard /></ProtectedRoute>} />
        
        {/* Onboarding */}
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;
