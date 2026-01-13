/**
 * ClerkWrapper - Safe wrapper for ClerkProvider
 * 
 * Always renders ClerkProvider to prevent "useAuth can only be used within ClerkProvider" errors
 * Shows a warning banner if Clerk key is not configured
 */

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter } from 'react-router-dom';

interface ClerkWrapperProps {
  children: ReactNode;
}

export default function ClerkWrapper({ children }: ClerkWrapperProps) {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  // If key is missing, show warning but still render ClerkProvider with empty key
  // This prevents "useAuth can only be used within ClerkProvider" errors
  // Clerk will handle the invalid key gracefully
  if (!clerkPublishableKey) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 text-center text-sm z-[9999]">
          ⚠️ <strong>Clerk not configured.</strong> Please add{' '}
          <code className="bg-red-700 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code>{' '}
          in Vercel Environment Variables. See{' '}
          <a 
            href="https://github.com/mrcrochet/nucigenlabs-website/blob/a11y-seo-perf/QUICK_FIX_CLERK_VERCEL.md" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            QUICK_FIX_CLERK_VERCEL.md
          </a>
        </div>
        <ClerkProvider publishableKey="">
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </ClerkProvider>
      </>
    );
  }

  // Normal render with valid key
  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      afterSignInUrl="/overview"
      afterSignUpUrl="/onboarding"
    >
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ClerkProvider>
  );
}
