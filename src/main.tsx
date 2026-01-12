import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

// Get Clerk publishable key from environment variables
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Graceful fallback if Clerk key is missing (for development/build)
if (!clerkPublishableKey) {
  console.warn('⚠️ VITE_CLERK_PUBLISHABLE_KEY not found. App will run in limited mode.');
}

// Render app with or without Clerk
const AppWrapper = clerkPublishableKey ? (
  <ClerkProvider publishableKey={clerkPublishableKey}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ClerkProvider>
) : (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {AppWrapper}
  </StrictMode>
);
