/**
 * Error Tracking Utility
 * 
 * Centralized error logging and tracking
 */

interface ErrorLog {
  message: string;
  stack?: string;
  component?: string;
  userId?: string;
  timestamp: number;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 100; // Keep last 100 errors

  /**
   * Log an error
   */
  logError(
    error: Error | string,
    component?: string,
    metadata?: Record<string, any>
  ): void {
    const errorLog: ErrorLog = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      component,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      metadata,
    };

    this.errors.push(errorLog);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Always log to console
    console.error(`[ErrorTracker] ${component || 'Unknown'}:`, errorLog.message, metadata || '');

    // In production, you could send to error tracking service (Sentry, etc.)
    if (import.meta.env.PROD) {
      // TODO: Send to error tracking service
      // this.sendToErrorService(errorLog);
    }
  }

  /**
   * Get all errors
   */
  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  /**
   * Get errors by component
   */
  getErrorsByComponent(component: string): ErrorLog[] {
    return this.errors.filter(e => e.component === component);
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Send error to external service (placeholder for future implementation)
   */
  private async sendToErrorService(errorLog: ErrorLog): Promise<void> {
    // Placeholder for future error tracking service integration
    // Example: Sentry, LogRocket, etc.
    try {
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorLog),
      // });
    } catch (err) {
      console.error('Failed to send error to tracking service:', err);
    }
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

/**
 * React Error Boundary helper
 */
export function logErrorToTracker(error: Error, errorInfo?: React.ErrorInfo): void {
  errorTracker.logError(error, 'ErrorBoundary', {
    componentStack: errorInfo?.componentStack,
  });
}

/**
 * API Error helper
 */
export function logAPIError(error: Error, endpoint: string, metadata?: Record<string, any>): void {
  errorTracker.logError(error, `API:${endpoint}`, metadata);
}

/**
 * Component Error helper
 */
export function logComponentError(error: Error, componentName: string, metadata?: Record<string, any>): void {
  errorTracker.logError(error, `Component:${componentName}`, metadata);
}
