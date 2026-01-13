/**
 * Performance Monitoring Utilities
 * 
 * Simple performance tracking for page loads and API calls
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // Keep last 100 metrics

  /**
   * Mark the start of an operation
   */
  markStart(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`, metadata || '');
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average duration for a metric name
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure page load time
 */
export function measurePageLoad(pageName: string): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    performanceMonitor.recordMetric(`page_load:${pageName}`, loadTime);
  });
}

/**
 * Measure API call duration
 */
export async function measureAPICall<T>(
  name: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const endMeasure = performanceMonitor.markStart(`api:${name}`);
  
  try {
    const result = await apiCall();
    endMeasure();
    return result;
  } catch (error) {
    endMeasure();
    performanceMonitor.recordMetric(`api:${name}:error`, 0, { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

/**
 * Measure component render time (React)
 */
export function measureComponentRender(componentName: string): () => void {
  return performanceMonitor.markStart(`render:${componentName}`);
}
