import { useState, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PremiumNavigation from './components/PremiumNavigation';
import CustomCursor from './components/CustomCursor';
import AnimatedBackground from './components/AnimatedBackground';
import AccessRequestModal from './components/AccessRequestModal';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSourcePage, setModalSourcePage] = useState('');
  const { toast, showToast, hideToast } = useToast();

  const openModal = (sourcePage: string) => {
    setModalSourcePage(sourcePage);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <CustomCursor />
      <PremiumNavigation />

      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

      <AccessRequestModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={(message) => showToast(message, 'success')}
        onError={(message) => showToast(message, 'error')}
        sourcePage={modalSourcePage}
      />

      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
          <Route 
            path="/intelligence" 
            element={<Intelligence onRequestClearance={() => openModal('intelligence')} />} 
          />
          <Route 
            path="/case-studies" 
            element={<CaseStudies onRequestClearance={() => openModal('case-studies')} />} 
          />
          <Route 
            path="/pricing" 
            element={<Pricing onRequestClearance={() => openModal('pricing')} />} 
          />
          <Route 
            path="/papers" 
            element={<Papers onRequestClearance={() => openModal('papers')} />} 
          />
          <Route 
            path="/level/:level" 
            element={<LevelNews />} 
          />
          <Route 
            path="/early-access-confirmation" 
            element={<EarlyAccessConfirmation />} 
          />
      </Routes>
      </Suspense>
    </div>
  );
}

export default App;
