/**
 * PublicRoute Component
 * 
 * Redirects authenticated users away from public pages (login, register, etc.)
 * This ensures proper separation between landing page and app
 */

import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export default function PublicRoute({ children, redirectTo = '/dashboard' }: PublicRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A] z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, redirect to app
  if (isSignedIn) {
    // Get return path from location state if available
    const returnPath = (location.state as any)?.from?.pathname || redirectTo;
    return <Navigate to={returnPath} replace />;
  }

  return <>{children}</>;
}

