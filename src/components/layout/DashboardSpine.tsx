/**
 * DashboardSpine - System status indicator
 * 
 * A discrete visual element that appears on ALL pages to show system status.
 * Palantir-style institutional indicator showing active monitoring.
 * 
 * Features:
 * - Fixed position at bottom of screen
 * - Shows system status, mode, and entity count
 * - Subtle but always visible
 * - Vertical bar indicator
 */

import { Activity } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardSpine() {
  const [status, setStatus] = useState<'monitoring' | 'active' | 'standby'>('monitoring');
  const [entityCount] = useState(1247); // Could be fetched from API in future
  const [sourceCount] = useState(47); // Could be fetched from API in future

  // Simulate status changes (in production, this would come from real system status)
  useEffect(() => {
    const interval = setInterval(() => {
      // Status remains 'monitoring' for now, but could change based on actual system state
      setStatus('monitoring');
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (status) {
      case 'monitoring':
        return 'Monitoring';
      case 'active':
        return 'Active';
      case 'standby':
        return 'Standby';
      default:
        return 'Monitoring';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'monitoring':
        return 'bg-green-400';
      case 'active':
        return 'bg-yellow-400';
      case 'standby':
        return 'bg-slate-500';
      default:
        return 'bg-green-400';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between py-2 px-3 backdrop-blur-xl bg-background-overlay/95 border-t border-borders-subtle border-l border-r rounded-t-lg shadow-lg">
          {/* Left: Status indicator with vertical bar */}
          <div className="flex items-center gap-3">
            {/* Vertical bar indicator - Palantir-style */}
            <div className="relative flex flex-col items-center justify-center h-6">
              <div className={`w-1 h-4 ${getStatusColor()} rounded-full animate-pulse`} />
            </div>
            
            {/* Status text */}
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-xs font-medium text-text-secondary">
                System status: <span className="text-text-primary font-semibold">{getStatusText()}</span>
              </span>
            </div>
          </div>

          {/* Center: Mode indicator */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-text-tertiary font-light">Low-noise mode active</span>
          </div>

          {/* Right: Entity count */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-text-tertiary">
              <span className="text-text-secondary font-semibold">{entityCount.toLocaleString()}</span> entities under watch
            </span>
            <span className="hidden lg:inline text-xs text-text-muted">•</span>
            <span className="hidden lg:inline text-xs text-text-tertiary">
              {sourceCount} sources
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
