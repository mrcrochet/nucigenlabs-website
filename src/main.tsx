import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ClerkWrapper from './components/ClerkWrapper';
import App from './App.tsx';
import './index.css';

// Warn if key is missing (for development)
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPublishableKey) {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY not found!');
  console.error('❌ Authentication will not work. Please configure VITE_CLERK_PUBLISHABLE_KEY in Vercel.');
  console.error('📝 See QUICK_FIX_CLERK_VERCEL.md for setup instructions.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkWrapper>
      <App />
    </ClerkWrapper>
  </StrictMode>
);
