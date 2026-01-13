/**
 * AppShell - Main application layout
 * 
 * Strict layout following UI spec:
 * - TopNav (64px height)
 * - SideNav (260px width, collapsible on desktop, drawer on mobile)
 * - MainContent (max-width 1280px, centered)
 * - RightInspector (optional, 360px width, drawer on mobile)
 * 
 * Mobile-friendly:
 * - SideNav becomes a drawer on mobile (< 1024px)
 * - RightInspector becomes a drawer/modal on mobile
 * - Layout stacks vertically on mobile
 */

import { useState, useEffect } from 'react';
import TopNav from './TopNav';
import SideNav from './SideNav';
import MainContent from './MainContent';
import RightInspector from './RightInspector';

interface AppShellProps {
  children: React.ReactNode;
  showRightInspector?: boolean;
  rightInspectorContent?: React.ReactNode;
}

export default function AppShell({
  children,
  showRightInspector = false,
  rightInspectorContent,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  // Close mobile menu when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setMobileInspectorOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background-base flex flex-col">
      {/* TopNav - Fixed height 64px */}
      <TopNav 
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Mobile overlay for drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background-overlay z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {mobileInspectorOpen && showRightInspector && (
        <div
          className="fixed inset-0 bg-background-overlay z-40 lg:hidden"
          onClick={() => setMobileInspectorOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* SideNav - Desktop: sidebar, Mobile: drawer */}
        <SideNav
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        {/* MainContent - Max-width 1280px, centered */}
        <MainContent>
          {children}
        </MainContent>

        {/* RightInspector - Desktop: sidebar, Mobile: drawer */}
        {showRightInspector && rightInspectorContent && (
          <RightInspector
            mobileOpen={mobileInspectorOpen}
            onMobileClose={() => setMobileInspectorOpen(false)}
            onMobileToggle={() => setMobileInspectorOpen(!mobileInspectorOpen)}
          >
            {rightInspectorContent}
          </RightInspector>
        )}
      </div>
    </div>
  );
}
