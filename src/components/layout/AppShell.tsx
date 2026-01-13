/**
 * AppShell - Main application layout
 * 
 * Strict layout following UI spec:
 * - TopNav (64px height)
 * - SideNav (260px width, collapsible)
 * - MainContent (max-width 1280px, centered)
 * - RightInspector (optional, 360px width)
 */

import { useState } from 'react';
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

  return (
    <div className="min-h-screen bg-background-base flex flex-col">
      {/* TopNav - Fixed height 64px */}
      <TopNav />

      <div className="flex flex-1 overflow-hidden">
        {/* SideNav - Width 260px, collapsible */}
        <SideNav
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* MainContent - Max-width 1280px, centered */}
        <MainContent>
          {children}
        </MainContent>

        {/* RightInspector - Optional, width 360px */}
        {showRightInspector && rightInspectorContent && (
          <RightInspector>
            {rightInspectorContent}
          </RightInspector>
        )}
      </div>
    </div>
  );
}
