/**
 * PHASE 2D: App Sidebar Navigation
 * 
 * Shared sidebar component for all app pages
 * Provides navigation to all sitemap routes
 */

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  LayoutDashboard, 
  Brain, 
  FileText, 
  Bell, 
  BookOpen, 
  User, 
  Settings, 
  LogOut,
  Menu,
  X,
  BarChart3,
  Target
} from 'lucide-react';
import { useState } from 'react';

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  // Access useUser to force Clerk to load user profile
  useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/intelligence', label: 'Intelligence', icon: Brain },
    { path: '/events', label: 'Events', icon: FileText },
    { path: '/recommendations', label: 'Recommendations', icon: Target },
    { path: '/alerts', label: 'Alerts', icon: Bell },
    { path: '/research', label: 'Research', icon: BookOpen },
    { path: '/quality', label: 'Quality', icon: BarChart3 },
  ];

  const userItems = [
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/app';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white hover:bg-white/[0.03] transition-all"
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 flex flex-col
          border-r border-white/[0.02] bg-[#0A0A0A]/20 backdrop-blur-xl
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.02]">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-white font-light text-lg tracking-tight"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#E1463E] to-[#E1463E]/50 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span>NUCIGEN</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  text-sm font-light transition-all
                  ${
                    active
                      ? 'bg-white/[0.05] text-white border border-white/[0.15]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/[0.02] space-y-1">
          {userItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  text-sm font-light transition-all
                  ${
                    active
                      ? 'bg-white/[0.05] text-white border border-white/[0.15]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-light text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

