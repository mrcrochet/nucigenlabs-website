/**
 * Metrics Analyzer
 * 
 * Analyzes API metrics to identify optimization opportunities.
 * Provides insights for parameter tuning and system optimization.
 */

import { getMetrics, getSummaryStats } from '../services/api-metrics';

export interface MetricsAnalysis {
  componentName: string;
  timeWindow: { start: Date; end: Date };
  summary: {
    totalCalls: number;
    totalCost: number;
    avgLatency: number;
    errorRate: number;
    cacheHitRate: number;
  };
  issues: OptimizationIssue[];
  recommendations: OptimizationRecommendation[];
  trends: TrendAnalysis[];
}

export interface OptimizationIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'high_cost' | 'high_latency' | 'high_error_rate' | 'low_cache_hit' | 'rate_limiting';
  description: string;
  impact: string;
  currentValue: number;
  targetValue: number;
}

export interface OptimizationRecommendation {
  priority: 'low' | 'medium' | 'high';
  action: string;
  expectedImprovement: string;
  riskLevel: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface TrendAnalysis {
  metric: string;
  trend: 'improving' | 'degrading' | 'stable';
  changePercentage: number;
  period: string;
}

/**
 * Analyze metrics for a component
 */
export async function analyzeMetrics(
  componentName: string,
  hours: number = 24
): Promise<MetricsAnalysis> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

  // Get metrics
  const metrics = await getMetrics(hours);
  const componentMetrics = metrics.filter(
    m => m.featureName === componentName || m.apiEndpoint?.includes(componentName)
  );

  // Get summary stats
  const summaryStats = await getSummaryStats(hours);
  const apiType = componentMetrics[0]?.apiType || 'openai';
  const componentStats = summaryStats.byApiType[apiType] || {
    calls: 0,
    cost: 0,
    cacheHitRate: 0,
    avgLatency: 0,
    errors: 0,
  };

  // Calculate summary
  const totalCalls = componentStats.calls;
  const totalCost = componentStats.cost;
  const avgLatency = componentStats.avgLatency;
  const errorRate = totalCalls > 0 ? componentStats.errors / totalCalls : 0;
  const cacheHitRate = componentStats.cacheHitRate;

  // Identify issues
  const issues = identifyIssues(componentStats, componentMetrics);

  // Generate recommendations
  const recommendations = generateRecommendations(issues, componentStats);

  // Analyze trends
  const trends = await analyzeTrends(componentName, hours);

  return {
    componentName,
    timeWindow: { start: startTime, end: endTime },
    summary: {
      totalCalls,
      totalCost,
      avgLatency,
      errorRate,
      cacheHitRate,
    },
    issues,
    recommendations,
    trends,
  };
}

/**
 * Identify optimization issues
 */
function identifyIssues(
  stats: any,
  metrics: any[]
): OptimizationIssue[] {
  const issues: OptimizationIssue[] = [];

  // High cost
  if (stats.cost > 10) { // $10 per day threshold
    issues.push({
      severity: 'high',
      type: 'high_cost',
      description: `High API costs: $${stats.cost.toFixed(2)} per day`,
      impact: 'Significant cost impact on operations',
      currentValue: stats.cost,
      targetValue: stats.cost * 0.7, // Target 30% reduction
    });
  }

  // High latency
  if (stats.avgLatency > 2000) { // 2 seconds threshold
    issues.push({
      severity: 'medium',
      type: 'high_latency',
      description: `High average latency: ${stats.avgLatency.toFixed(0)}ms`,
      impact: 'Poor user experience',
      currentValue: stats.avgLatency,
      targetValue: stats.avgLatency * 0.7, // Target 30% reduction
    });
  }

  // High error rate
  const errorRate = stats.calls > 0 ? stats.errors / stats.calls : 0;
  if (errorRate > 0.05) { // 5% threshold
    issues.push({
      severity: 'critical',
      type: 'high_error_rate',
      description: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
      impact: 'System reliability issues',
      currentValue: errorRate,
      targetValue: 0.02, // Target 2% error rate
    });
  }

  // Low cache hit rate
  if (stats.cacheHitRate < 0.5) { // 50% threshold
    issues.push({
      severity: 'medium',
      type: 'low_cache_hit',
      description: `Low cache hit rate: ${(stats.cacheHitRate * 100).toFixed(0)}%`,
      impact: 'Increased API costs and latency',
      currentValue: stats.cacheHitRate,
      targetValue: 0.7, // Target 70% cache hit rate
    });
  }

  // Rate limiting
  const rateLimitHits = metrics.reduce((sum, m) => sum + (m.rateLimitHits || 0), 0);
  if (rateLimitHits > 10) {
    issues.push({
      severity: 'high',
      type: 'rate_limiting',
      description: `Rate limit hits: ${rateLimitHits}`,
      impact: 'API throttling affecting performance',
      currentValue: rateLimitHits,
      targetValue: 0,
    });
  }

  return issues;
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(
  issues: OptimizationIssue[],
  stats: any
): OptimizationRecommendation[] {
  const recommendations: OptimizationRecommendation[] = [];

  for (const issue of issues) {
    switch (issue.type) {
      case 'high_cost':
        recommendations.push({
          priority: 'high',
          action: 'Optimize API model selection and reduce token usage',
          expectedImprovement: '30-50% cost reduction',
          riskLevel: 'low',
          reasoning: 'Cost optimization can be achieved by using cheaper models for non-critical tasks',
        });
        break;

      case 'high_latency':
        recommendations.push({
          priority: 'medium',
          action: 'Increase batch sizes and optimize concurrency',
          expectedImprovement: '20-40% latency reduction',
          riskLevel: 'medium',
          reasoning: 'Batch processing and concurrency tuning can improve throughput',
        });
        break;

      case 'high_error_rate':
        recommendations.push({
          priority: 'critical',
          action: 'Reduce concurrency and add retry logic with backoff',
          expectedImprovement: 'Error rate reduction to <2%',
          riskLevel: 'low',
          reasoning: 'Lower concurrency reduces API rate limit errors',
        });
        break;

      case 'low_cache_hit':
        recommendations.push({
          priority: 'medium',
          action: 'Increase cache TTL and improve cache key strategy',
          expectedImprovement: 'Cache hit rate increase to 70%+',
          riskLevel: 'low',
          reasoning: 'Longer TTL for stable data can significantly improve cache performance',
        });
        break;

      case 'rate_limiting':
        recommendations.push({
          priority: 'high',
          action: 'Implement rate limit detection and adaptive throttling',
          expectedImprovement: 'Eliminate rate limit hits',
          riskLevel: 'low',
          reasoning: 'Adaptive throttling prevents hitting API rate limits',
        });
        break;
    }
  }

  return recommendations;
}

/**
 * Analyze trends over time
 */
async function analyzeTrends(
  componentName: string,
  hours: number
): Promise<TrendAnalysis[]> {
  // Compare current period with previous period
  const currentMetrics = await getMetrics(hours);
  const previousMetrics = await getMetrics(hours * 2, undefined, undefined, undefined);

  const currentComponentMetrics = currentMetrics.filter(
    m => m.featureName === componentName || m.apiEndpoint?.includes(componentName)
  );
  const previousComponentMetrics = previousMetrics.filter(
    m => m.featureName === componentName || m.apiEndpoint?.includes(componentName)
  );

  const trends: TrendAnalysis[] = [];

  // Calculate averages
  const currentAvgLatency = currentComponentMetrics.reduce((sum, m) => sum + m.avgLatencyMs, 0) / currentComponentMetrics.length || 0;
  const previousAvgLatency = previousComponentMetrics.reduce((sum, m) => sum + m.avgLatencyMs, 0) / previousComponentMetrics.length || 0;

  const currentErrorRate = currentComponentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / currentComponentMetrics.length || 0;
  const previousErrorRate = previousComponentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / previousComponentMetrics.length || 0;

  const currentCacheHitRate = currentComponentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / currentComponentMetrics.length || 0;
  const previousCacheHitRate = previousComponentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / previousComponentMetrics.length || 0;

  // Latency trend
  if (previousAvgLatency > 0) {
    const latencyChange = ((currentAvgLatency - previousAvgLatency) / previousAvgLatency) * 100;
    trends.push({
      metric: 'latency',
      trend: latencyChange < -5 ? 'improving' : latencyChange > 5 ? 'degrading' : 'stable',
      changePercentage: latencyChange,
      period: `${hours}h`,
    });
  }

  // Error rate trend
  if (previousErrorRate > 0) {
    const errorChange = ((currentErrorRate - previousErrorRate) / previousErrorRate) * 100;
    trends.push({
      metric: 'error_rate',
      trend: errorChange < -10 ? 'improving' : errorChange > 10 ? 'degrading' : 'stable',
      changePercentage: errorChange,
      period: `${hours}h`,
    });
  }

  // Cache hit rate trend
  if (previousCacheHitRate > 0) {
    const cacheChange = ((currentCacheHitRate - previousCacheHitRate) / previousCacheHitRate) * 100;
    trends.push({
      metric: 'cache_hit_rate',
      trend: cacheChange > 5 ? 'improving' : cacheChange < -5 ? 'degrading' : 'stable',
      changePercentage: cacheChange,
      period: `${hours}h`,
    });
  }

  return trends;
}

/**
 * Get optimization opportunities across all components
 */
export async function getAllOptimizationOpportunities(hours: number = 24): Promise<{
  components: string[];
  totalOpportunities: number;
  highPriority: number;
  estimatedSavings: number;
}> {
  const summaryStats = await getSummaryStats(hours);
  const components = Object.keys(summaryStats.byApiType);

  let totalOpportunities = 0;
  let highPriority = 0;
  let estimatedSavings = 0;

  for (const component of components) {
    const analysis = await analyzeMetrics(component, hours);
    totalOpportunities += analysis.recommendations.length;
    highPriority += analysis.recommendations.filter(r => r.priority === 'high' || r.priority === 'critical').length;
    
    // Estimate savings from cost-related recommendations
    if (analysis.summary.totalCost > 0) {
      const costRecommendations = analysis.recommendations.filter(r => r.action.includes('cost'));
      estimatedSavings += analysis.summary.totalCost * 0.3 * costRecommendations.length; // 30% savings per recommendation
    }
  }

  return {
    components,
    totalOpportunities,
    highPriority,
    estimatedSavings,
  };
}
