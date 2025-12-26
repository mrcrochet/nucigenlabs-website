import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PremiumNavigation from './components/PremiumNavigation';
import AnimatedBackground from './components/AnimatedBackground';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';
import Home from './pages/Home';

// Lazy load routes for better performance
const Intelligence = lazy(() => import('./pages/Intelligence'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Papers = lazy(() => import('./pages/Papers'));
const CaseStudies = lazy(() => import('./pages/CaseStudies'));
const LevelNews = lazy(() => import('./pages/LevelNews'));
const EarlyAccessConfirmation = lazy(() => import('./pages/EarlyAccessConfirmation'));
const RequestAccess = lazy(() => import('./pages/RequestAccess'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A]">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-sm text-slate-500 font-light">Loading...</p>
    </div>
  </div>
);

function App() {
  const { toast, showToast, hideToast } = useToast();

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <PremiumNavigation />

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
          <Route 
            path="/intelligence" 
            element={<Intelligence />} 
          />
          <Route 
            path="/case-studies" 
            element={<CaseStudies />} 
          />
          <Route 
            path="/pricing" 
            element={<Pricing />} 
          />
          <Route 
            path="/papers" 
            element={<Papers />} 
          />
          <Route 
            path="/level/:level" 
            element={<LevelNews />} 
          />
          <Route 
            path="/early-access-confirmation" 
            element={<EarlyAccessConfirmation />} 
          />
          <Route 
            path="/request-access" 
            element={<RequestAccess />} 
          />
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;
