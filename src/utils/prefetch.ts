// Prefetch utilities for critical routes

/**
 * Prefetch a route for faster navigation
 */
export function prefetchRoute(path: string) {
  // For React Router, prefetch happens automatically on hover
  // This utility can be used for manual prefetching if needed
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

/**
 * Prefetch critical routes on page load
 */
export function prefetchCriticalRoutes() {
  // Prefetch most visited routes
  const criticalRoutes = [
    '/intelligence',
    '/pricing',
    '/request-access',
  ];

  // Use requestIdleCallback for non-blocking prefetch
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      criticalRoutes.forEach(route => {
        prefetchRoute(route);
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      criticalRoutes.forEach(route => {
        prefetchRoute(route);
      });
    }, 2000);
  }
}


