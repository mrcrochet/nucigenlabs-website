import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavigationProps {
  onRequestClearance: () => void;
}

export default function Navigation({ onRequestClearance }: NavigationProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-2xl bg-white/[0.03] border border-white/[0.10] rounded-full px-8 py-4 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between">
            <Link to="/" className="group flex items-center gap-3 transition-all" onClick={closeMobileMenu}>
              <div className="text-slate-500 text-sm font-light group-hover:text-slate-300 transition-colors">▸</div>
              <span className="text-base font-semibold text-white tracking-tight group-hover:text-slate-100 transition-colors">Nucigen Labs</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link
                to="/intelligence"
                className={`relative text-sm font-light transition-all duration-300 ${
                  isActive('/intelligence')
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Intelligence
                {isActive('/intelligence') && (
                  <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
                )}
              </Link>
              <Link
                to="/case-studies"
                className={`relative text-sm font-light transition-all duration-300 ${
                  isActive('/case-studies')
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Case Studies
                {isActive('/case-studies') && (
                  <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
                )}
              </Link>
              <Link
                to="/pricing"
                className={`relative text-sm font-light transition-all duration-300 ${
                  isActive('/pricing')
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pricing
                {isActive('/pricing') && (
                  <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
                )}
              </Link>
              <Link
                to="/papers"
                className={`relative text-sm font-light transition-all duration-300 ${
                  isActive('/papers')
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Papers
                {isActive('/papers') && (
                  <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
                )}
              </Link>
              <button
                onClick={onRequestClearance}
                className="ml-2 px-6 py-2 text-sm text-white border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-lg transition-all duration-300 font-light tracking-wide"
              >
                Join Early Access
              </button>
            </div>

            <button
              className="md:hidden text-white p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 backdrop-blur-2xl bg-white/[0.03] border border-white/[0.10] rounded-2xl overflow-hidden shadow-2xl shadow-black/20 animate-in fade-in duration-200">
            <div className="flex flex-col p-4 space-y-1">
              <Link
                to="/intelligence"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg text-sm font-light transition-all duration-200 ${
                  isActive('/intelligence')
                    ? 'text-white bg-white/[0.08]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Intelligence
              </Link>
              <Link
                to="/case-studies"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg text-sm font-light transition-all duration-200 ${
                  isActive('/case-studies')
                    ? 'text-white bg-white/[0.08]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Case Studies
              </Link>
              <Link
                to="/pricing"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg text-sm font-light transition-all duration-200 ${
                  isActive('/pricing')
                    ? 'text-white bg-white/[0.08]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Pricing
              </Link>
              <Link
                to="/papers"
                onClick={closeMobileMenu}
                className={`px-4 py-3 rounded-lg text-sm font-light transition-all duration-200 ${
                  isActive('/papers')
                    ? 'text-white bg-white/[0.08]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Papers
              </Link>
              <button
                onClick={() => {
                  closeMobileMenu();
                  onRequestClearance();
                }}
                className="mt-2 px-4 py-3 text-sm text-white border border-white/20 hover:border-white/40 hover:bg-white/[0.05] rounded-lg transition-all duration-200 font-light tracking-wide"
              >
                Join Early Access
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
