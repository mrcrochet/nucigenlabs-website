/**
 * Performance Middleware for API Server
 * 
 * Tracks API response times and logs metrics
 */

import { Request, Response, NextFunction } from 'express';

interface PerformanceData {
  method: string;
  path: string;
  duration: number;
  statusCode: number;
  timestamp: number;
}

const performanceLog: PerformanceData[] = [];
const MAX_LOG_SIZE = 1000; // Keep last 1000 requests

export function performanceMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const method = req.method;
  const path = req.path;

  // Override res.end to measure response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log performance data
    performanceLog.push({
      method,
      path,
      duration,
      statusCode,
      timestamp: Date.now(),
    });

    // Keep only last N entries
    if (performanceLog.length > MAX_LOG_SIZE) {
      performanceLog.shift();
    }

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`[Performance] Slow request: ${method} ${path} took ${duration}ms`);
    }

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics() {
  const metrics = {
    totalRequests: performanceLog.length,
    averageDuration: 0,
    slowestRequests: [] as PerformanceData[],
    requestsByPath: {} as Record<string, { count: number; avgDuration: number }>,
    requestsByStatus: {} as Record<number, number>,
  };

  if (performanceLog.length === 0) {
    return metrics;
  }

  // Calculate average
  const totalDuration = performanceLog.reduce((sum, req) => sum + req.duration, 0);
  metrics.averageDuration = totalDuration / performanceLog.length;

  // Find slowest requests
  metrics.slowestRequests = [...performanceLog]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  // Group by path
  const pathGroups: Record<string, { durations: number[] }> = {};
  performanceLog.forEach(req => {
    if (!pathGroups[req.path]) {
      pathGroups[req.path] = { durations: [] };
    }
    pathGroups[req.path].durations.push(req.duration);
  });

  Object.entries(pathGroups).forEach(([path, data]) => {
    const avgDuration = data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length;
    metrics.requestsByPath[path] = {
      count: data.durations.length,
      avgDuration,
    };
  });

  // Group by status code
  performanceLog.forEach(req => {
    metrics.requestsByStatus[req.statusCode] = (metrics.requestsByStatus[req.statusCode] || 0) + 1;
  });

  return metrics;
}

/**
 * Get performance endpoint handler
 */
export function getPerformanceMetricsHandler(req: Request, res: Response) {
  const metrics = getPerformanceMetrics();
  res.json(metrics);
}
