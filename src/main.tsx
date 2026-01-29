import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { initSentry } from './lib/sentry';
import ClerkWrapper from './components/ClerkWrapper';
import ClerkErrorBoundary from './components/ClerkErrorBoundary';
import App from './App.tsx';
import { queryClient } from './lib/react-query';
import { registerServiceWorker } from './lib/service-worker';
import { apiUrl } from './lib/api-base';
import './index.css';

// In production, relative /api/* requests must go to the deployed backend (VITE_API_URL)
const base = import.meta.env.VITE_API_URL ?? '';
if (base) {
  const origFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string' && input.startsWith('/')
        ? apiUrl(input)
        : input;
    return origFetch(url, init);
  };
}

// Initialize Sentry as early as possible
initSentry();

// Register service worker for offline support (production only)
if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error);
}

// Warn if key is missing (for development)
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPublishableKey) {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY not found!');
  console.error('❌ Authentication will not work. Please configure VITE_CLERK_PUBLISHABLE_KEY in Vercel.');
  console.error('📝 See QUICK_FIX_CLERK_VERCEL.md for setup instructions.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkErrorBoundary>
        <ClerkWrapper>
          <App />
        </ClerkWrapper>
      </ClerkErrorBoundary>
    </QueryClientProvider>
  </StrictMode>
);
