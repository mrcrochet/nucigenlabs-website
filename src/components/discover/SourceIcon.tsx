/**
 * SourceIcon Component
 * 
 * Displays an icon/logo for a source domain
 * Falls back to a letter-based icon if no favicon available
 */

import { useState } from 'react';

interface SourceIconProps {
  domain: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function SourceIcon({ domain, name, size = 'md' }: SourceIconProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-6 h-6 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  // Extract domain from URL if needed
  let cleanDomain = domain;
  try {
    if (domain.startsWith('http')) {
      const url = new URL(domain);
      cleanDomain = url.hostname.replace('www.', '');
    }
  } catch {
    // If parsing fails, use domain as-is
  }

  // Get first letter for fallback
  const firstLetter = name.charAt(0).toUpperCase() || cleanDomain.charAt(0).toUpperCase();

  // Try to get favicon
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=32`;

  return (
    <div className={`flex-shrink-0 ${sizeClasses[size]} bg-white/5 rounded flex items-center justify-center overflow-hidden`}>
      {!imageError ? (
        <img
          src={faviconUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-medium text-slate-400">{firstLetter}</span>
      )}
    </div>
  );
}
