// Image optimization utilities

/**
 * Generate optimized image src with lazy loading
 */
export function getOptimizedImageSrc(
  src: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  }
): string {
  // For now, return original src
  // In production, you could integrate with:
  // - Image CDN (Cloudinary, Imgix, etc.)
  // - Next.js Image Optimization
  // - Vite plugin for image optimization
  
  return src;
}

/**
 * Lazy load image with intersection observer
 */
export function useLazyImage() {
  // This would be a hook for lazy loading
  // For now, we'll use native loading="lazy" attribute
  return {
    loading: 'lazy' as const,
    decoding: 'async' as const,
  };
}

/**
 * Preload critical images
 */
export function preloadImage(src: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}


