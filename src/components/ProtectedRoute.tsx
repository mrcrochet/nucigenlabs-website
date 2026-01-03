import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A] z-50">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-slate-500 font-light">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login with return URL
    // Store the intended destination
    const returnPath = location.pathname + location.search;
    return <Navigate to="/login" state={{ from: { pathname: returnPath } }} replace />;
  }

  return <>{children}</>;
}

