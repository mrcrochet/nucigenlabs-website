/**
 * Safe Clerk hooks wrapper
 * 
 * Provides safe access to Clerk hooks that won't throw errors
 * if ClerkProvider is not available
 */

import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react';

/**
 * Check if Clerk is available (ClerkProvider is rendered)
 */
function isClerkAvailable(): boolean {
  try {
    // Try to access Clerk context
    // If ClerkProvider is not rendered, this will throw
    return typeof window !== 'undefined' && 
           (window as any).__CLERK_FRONTEND_API !== undefined;
  } catch {
    return false;
  }
}

/**
 * Safe useAuth hook
 * Returns safe defaults if Clerk is not available
 */
export function useAuthSafe() {
  try {
    const auth = useClerkAuth();
    return {
      isLoaded: auth.isLoaded,
      isSignedIn: auth.isSignedIn || false,
      signOut: auth.signOut || (() => Promise.resolve()),
      userId: auth.userId || null,
    };
  } catch (error) {
    // Clerk not available
    console.warn('Clerk not available, using safe defaults');
    return {
      isLoaded: true,
      isSignedIn: false,
      signOut: () => Promise.resolve(),
      userId: null,
    };
  }
}

/**
 * Safe useUser hook
 * Returns safe defaults if Clerk is not available
 */
export function useUserSafe() {
  try {
    const user = useClerkUser();
    return {
      isLoaded: user.isLoaded,
      user: user.user || null,
    };
  } catch (error) {
    // Clerk not available
    console.warn('Clerk not available, using safe defaults');
    return {
      isLoaded: true,
      user: null,
    };
  }
}
