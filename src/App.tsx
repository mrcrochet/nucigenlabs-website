import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import PremiumNavigation from './components/PremiumNavigation';
import CustomCursor from './components/CustomCursor';
import AnimatedBackground from './components/AnimatedBackground';
import AccessRequestModal from './components/AccessRequestModal';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';
import Home from './pages/Home';
import Intelligence from './pages/Intelligence';
import Pricing from './pages/Pricing';
import Papers from './pages/Papers';
import CaseStudies from './pages/CaseStudies';

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

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/intelligence" element={<Intelligence onRequestClearance={() => openModal('intelligence')} />} />
        <Route path="/case-studies" element={<CaseStudies onRequestClearance={() => openModal('case-studies')} />} />
        <Route path="/pricing" element={<Pricing onRequestClearance={() => openModal('pricing')} />} />
        <Route path="/papers" element={<Papers onRequestClearance={() => openModal('papers')} />} />
      </Routes>
    </div>
  );
}

export default App;
