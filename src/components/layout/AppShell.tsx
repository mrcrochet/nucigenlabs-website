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
import AppNavMenu from './AppNavMenu';
import MainContent from './MainContent';
import RightInspector from './RightInspector';
import DashboardSpine from './DashboardSpine';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-base bg-grain flex flex-col relative">
      {/* TopNav - Fixed height 64px */}
      <TopNav 
        onMenuClick={() => setMenuOpen(!menuOpen)}
        mobileMenuOpen={menuOpen}
      />

      {/* Navigation Menu Drawer */}
      <AppNavMenu 
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      {mobileInspectorOpen && showRightInspector && (
        <div
          className="fixed inset-0 bg-background-overlay z-40 lg:hidden"
          onClick={() => setMobileInspectorOpen(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {/* MainContent - Full width (no sidebar taking space) */}
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

      {/* Dashboard Spine - System status indicator (visible on all pages) */}
      <DashboardSpine />
    </div>
  );
}
