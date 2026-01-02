import { useState, useEffect, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Preload critical images
    if (priority) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    }
  }, [src, priority]);

  return (
    <div className={`relative overflow-hidden ${className || ''}`}>
      {placeholder && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-white/[0.02] animate-pulse"
          style={{ backgroundImage: placeholder ? `url(${placeholder})` : undefined }}
        />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${error ? 'hidden' : ''}`}
        {...props}
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/[0.02] border border-white/[0.05] rounded">
          <span className="text-xs text-slate-500">Image unavailable</span>
        </div>
      )}
    </div>
  );
}


