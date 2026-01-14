/**
 * Sentry Configuration
 * 
 * Initialize Sentry for error tracking and performance monitoring
 */

import * as Sentry from '@sentry/react';
import { browserTracingIntegration } from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';
  const release = import.meta.env.VITE_APP_VERSION || 'unknown';

  // Only initialize if DSN is provided
  if (!dsn) {
    console.warn('⚠️ Sentry DSN not configured. Error tracking will be disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    
    // Performance Monitoring
    integrations: [
      browserTracingIntegration({
        // Set tracing origins
        tracePropagationTargets: ['localhost', /^\//],
      }),
    ],

    // Set sample rates
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    
    // Session Replay (optional, requires Sentry Replay addon)
    replaysSessionSampleRate: environment === 'production' ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Always capture replays on errors

    // Filter out common non-actionable errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      'conduitPage',
      // Network errors that are often not actionable
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      // Third-party scripts
      'Non-Error promise rejection captured',
    ],

    // Filter out URLs that shouldn't be tracked
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Facebook plugins
      /connect\.facebook\.net/i,
      // Other third-party scripts
      /doubleclick\.net/i,
    ],

    // Before sending event, you can modify it
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly testing
      if (environment === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
        console.log('Sentry event (dev mode, not sent):', event);
        return null;
      }

      // Add custom context
      if (event.user) {
        // User context is already set by Sentry.setUser()
      }

      return event;
    },

    // Configure which errors to capture
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
        return null;
      }
      return breadcrumb;
    },
  });

  console.log('✅ Sentry initialized for', environment);
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}
