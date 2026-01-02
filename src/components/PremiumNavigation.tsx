import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Terminal, TrendingUp, FileText, DollarSign, Layers, Users, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function PremiumNavigation() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Hide navigation on auth and app pages
  const hideNavPaths = ['/login', '/register', '/auth', '/app', '/onboarding'];
  const shouldHideNav = hideNavPaths.some(path => location.pathname.startsWith(path));
  
  if (shouldHideNav) {
    return null;
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Platform', icon: Terminal },
    { path: '/intelligence', label: 'Intelligence', icon: Layers },
    { path: '/case-studies', label: 'Case Studies', icon: TrendingUp },
    { path: '/papers', label: 'Research', icon: FileText },
    { path: '/pricing', label: 'Pricing', icon: DollarSign },
    { path: '/partners', label: 'Partners', icon: Users },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/60 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_1px_0_0_rgba(255,255,255,0.02)]'
          : 'bg-transparent'
      }`}
      role="banner"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4" aria-label="Main navigation">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="group flex items-center gap-2 text-white font-light text-lg sm:text-xl tracking-tight min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Nucigen Labs - Home"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 blur-lg group-hover:blur-xl transition-all duration-300"></div>
              <Terminal
                size={20}
                className="sm:w-6 sm:h-6 relative text-red-400 group-hover:text-red-300 transition-colors"
              />
            </div>
            <span className="relative hidden sm:inline">
              NUCIGEN
              <div className="absolute -bottom-1 left-0 w-0 h-[1px] bg-gradient-to-r from-red-400 to-orange-400 group-hover:w-full transition-all duration-300"></div>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative px-4 py-2 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 focus:ring-offset-2 focus:ring-offset-black min-h-[44px] flex items-center ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      size={16}
                      className="transition-transform group-hover:scale-110"
                    />
                    <span className="text-sm font-light tracking-wide">
                      {item.label}
                    </span>
                  </div>

                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.1] rounded-lg"></div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></div>

                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-red-400 to-transparent"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/app"
                  className="px-4 py-2 text-slate-300 hover:text-white text-sm font-light transition-colors min-h-[44px] flex items-center"
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="px-4 py-2 text-slate-300 hover:text-white text-sm font-light transition-colors min-h-[44px] flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-slate-300 hover:text-white text-sm font-light transition-colors min-h-[44px] flex items-center"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="group relative px-6 py-2 bg-gradient-to-r from-red-600/90 to-red-500/90 hover:from-red-500 hover:to-red-400 text-white rounded-lg text-sm font-light tracking-wide transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#E1463E] focus:ring-offset-2 focus:ring-offset-black min-h-[44px] flex items-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <span className="relative">Register</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white p-2 hover:bg-white/[0.05] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-white/[0.08] pt-4 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group relative px-4 py-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50 min-h-[44px] flex items-center ${
                      isActive
                        ? 'text-white bg-white/[0.08]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span className="text-sm font-light">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/app"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-lg text-sm font-light transition-all min-h-[44px] flex items-center"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      setMobileMenuOpen(false);
                      navigate('/');
                    }}
                    className="mt-2 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-lg text-sm font-light transition-all min-h-[44px] flex items-center gap-2 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-lg text-sm font-light transition-all min-h-[44px] flex items-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 px-4 py-3 bg-gradient-to-r from-red-600/90 to-red-500/90 hover:from-red-500 hover:to-red-400 text-white rounded-lg text-sm font-light tracking-wide transition-all duration-300 min-h-[44px] flex items-center justify-center"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      )}
    </header>
  );
}
