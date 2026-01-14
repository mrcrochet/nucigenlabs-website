/**
 * FullscreenWrapper - Wrapper component that enables fullscreen mode for charts/tables
 */

import { useState, useEffect, ReactNode } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface FullscreenWrapperProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function FullscreenWrapper({ 
  children, 
  title = 'Fullscreen View',
  className = '' 
}: FullscreenWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      // Enter fullscreen
      const element = document.getElementById('fullscreen-container');
      if (element) {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if ((element as any).webkitRequestFullscreen) {
          (element as any).webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          (element as any).msRequestFullscreen();
        }
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement)
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 z-20 p-2 bg-background-overlay/80 backdrop-blur-sm border border-borders-subtle rounded-lg hover:bg-background-glass-subtle transition-colors"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4 text-text-secondary" />
        ) : (
          <Maximize2 className="w-4 h-4 text-text-secondary" />
        )}
      </button>

      {/* Content */}
      <div id="fullscreen-container" className="w-full h-full">
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-background-overlay p-6 overflow-auto">
            <div className="max-w-[1920px] mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-background-glass-subtle rounded-lg transition-colors"
                  aria-label="Exit fullscreen"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>
              <div className="bg-background-glass-subtle border border-borders-subtle rounded-xl p-6">
                {children}
              </div>
            </div>
          </div>
        )}
        <div className={isFullscreen ? 'hidden' : ''}>{children}</div>
      </div>
    </div>
  );
}
