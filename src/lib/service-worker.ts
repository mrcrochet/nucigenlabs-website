/**
 * Service Worker Registration
 * 
 * Registers and manages the service worker for offline support
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[SW] Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[SW] Service worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New service worker available');
            // Optionally show update notification to user
          }
        });
      }
    });

    // Handle controller change (new SW activated)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW] New service worker activated');
      // Optionally reload page
      // window.location.reload();
    });

    return registration;
  } catch (error) {
    console.error('[SW] Service worker registration failed:', error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const unregistered = await registration.unregister();
    if (unregistered) {
      console.log('[SW] Service worker unregistered');
    }
    return unregistered;
  } catch (error) {
    console.error('[SW] Service worker unregistration failed:', error);
    return false;
  }
}

export async function clearCache(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[SW] All caches cleared');
  } catch (error) {
    console.error('[SW] Failed to clear cache:', error);
  }
}
