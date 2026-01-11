/**
 * Logger utility
 * Replaces console.log with environment-aware logging
 */

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error('[ERROR]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
};

