import { useState, useEffect } from 'react';
import { supabase, getCurrentUser, signOut, User } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session ? 'session exists' : 'no session');
      if (session) {
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Error getting user after auth change:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await signOut();
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
    refreshUser: checkUser,
  };
}

