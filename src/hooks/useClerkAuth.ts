import { useUser, useAuth as useClerkAuthHook } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook to replace useAuth with Clerk authentication
 * Provides a similar API to the existing useAuth hook for easier migration
 */
export function useClerkAuth() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerkAuthHook();
  const navigate = useNavigate();

  const loading = !userLoaded;

  async function logout() {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Map Clerk user to match existing User type structure
  const mappedUser = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        name:
          user.fullName ||
          user.firstName ||
          user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
          '',
        role: 'user' as const,
      }
    : null;

  return {
    user: mappedUser,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser: async () => {
      // Clerk automatically refreshes user data
      // This is a no-op for compatibility
    },
  };
}

