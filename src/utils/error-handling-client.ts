/**
 * Client-side Error Handling Utilities
 * 
 * Provides error handling, retry logic, and user-friendly error messages
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatusCodes?: number[];
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Network errors are retryable
  if (error.message?.includes('network') || error.message?.includes('fetch failed')) {
    return true;
  }
  
  // 5xx errors are retryable
  if (error.status >= 500 && error.status < 600) {
    return true;
  }
  
  // 429 (rate limit) is retryable
  if (error.status === 429) {
    return true;
  }
  
  // 408 (timeout) is retryable
  if (error.status === 408) {
    return true;
  }
  
  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }
  
  // Check for network errors
  if (error.message?.includes('network') || error.message?.includes('fetch failed')) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  
  // Check for timeout
  if (error.message?.includes('timeout') || error.status === 408) {
    return 'The request took too long. Please try again.';
  }
  
  // Check for rate limit
  if (error.status === 429) {
    return 'Too many requests. Please wait a moment before trying again.';
  }
  
  // Check for authentication errors
  if (error.status === 401 || error.status === 403) {
    return 'Authentication failed. Please log in again.';
  }
  
  // Check for server errors
  if (error.status >= 500) {
    return 'The server is temporarily unavailable. Please try again later.';
  }
  
  // Use API error message if available
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }
  
  // Default message
  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Retry fetch with exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryableStatusCodes = [408, 429, 500, 502, 503, 504],
  } = retryOptions;
  
  let lastError: any;
  let delay = initialDelay;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if status code is retryable
      if (!response.ok && retryableStatusCodes.includes(response.status)) {
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(delay * backoffMultiplier, maxDelay);
          continue;
        }
      }
      
      return response;
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on abort (timeout)
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      
      // Retry on network errors
      if (isRetryableError(error) && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
        continue;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  throw lastError || new Error('Request failed after retries');
}

/**
 * Safe API call with error handling
 */
export async function safeApiCall<T>(
  apiCall: () => Promise<T>,
  options: {
    onError?: (error: any) => void;
    fallback?: T;
    retry?: RetryOptions;
  } = {}
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error: any) {
    console.error('[SafeApiCall] Error:', error);
    
    if (options.onError) {
      options.onError(error);
    }
    
    if (options.fallback !== undefined) {
      return options.fallback;
    }
    
    return null;
  }
}

/**
 * Handle API response with error checking
 */
export async function handleApiResponse<T>(
  response: Response,
  options: {
    fallback?: T;
    onError?: (error: any) => void;
  } = {}
): Promise<T | null> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
    }
    
    const error = {
      status: response.status,
      message: errorMessage,
    };
    
    if (options.onError) {
      options.onError(error);
    }
    
    if (options.fallback !== undefined) {
      return options.fallback;
    }
    
    throw error;
  }
  
  try {
    const data = await response.json();
    return data.success ? data.data : data;
  } catch (error) {
    console.error('[HandleApiResponse] Failed to parse JSON:', error);
    return options.fallback !== undefined ? options.fallback : null;
  }
}
