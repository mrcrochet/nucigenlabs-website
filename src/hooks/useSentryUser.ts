/**
 * useSentryUser - Hook to sync Clerk user with Sentry
 * 
 * Automatically sets Sentry user context when Clerk user is available
 */

import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { setSentryUser, clearSentryUser } from '../lib/sentry';

export function useSentryUser() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      // Set Sentry user context
      setSentryUser({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress,
        username: user.username || user.firstName || undefined,
      });
    } else {
      // Clear Sentry user context on logout
      clearSentryUser();
    }
  }, [user, isLoaded]);
}
