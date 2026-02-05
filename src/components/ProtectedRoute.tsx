import { ReactNode, useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

const AUTH_SLOW_THRESHOLD_MS = 5000;

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    if (isLoaded) return;
    const t = setTimeout(() => setShowSlowMessage(true), AUTH_SLOW_THRESHOLD_MS);
    return () => clearTimeout(t);
  }, [isLoaded]);

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0A] z-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 border-2 border-white/20 border-t-[#E1463E] rounded-full animate-spin mx-auto mb-4" aria-hidden />
          <p className="text-sm text-slate-500 font-light">Verifying authentication...</p>
          {showSlowMessage && (
            <p className="mt-3 text-xs text-slate-500 font-light">
              This is taking longer than usual. Check your connection and refresh the page if it persists.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    // Redirect to login with return URL
    // Store the intended destination
    const returnPath = location.pathname + location.search;
    return <Navigate to="/login" state={{ from: { pathname: returnPath } }} replace />;
  }

  return <>{children}</>;
}

