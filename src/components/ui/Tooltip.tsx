/**
 * Tooltip Component
 * 
 * Simple tooltip for help text and documentation
 */

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export default function Tooltip({ 
  content, 
  children, 
  position = 'top',
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children || (
        <HelpCircle 
          className="w-4 h-4 text-slate-500 hover:text-slate-400 transition-colors cursor-help" 
          aria-label="Help"
        />
      )}
      
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-xs text-white bg-slate-900 border border-white/20 rounded-lg shadow-xl backdrop-blur-sm max-w-xs ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-slate-900 border-r border-b border-white/20 ${
              position === 'top' ? 'top-full left-1/2 -translate-x-1/2 rotate-45' :
              position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -rotate-45' :
              position === 'left' ? 'left-full top-1/2 -translate-y-1/2 rotate-45' :
              'right-full top-1/2 -translate-y-1/2 -rotate-45'
            }`}
          />
        </div>
      )}
    </div>
  );
}
