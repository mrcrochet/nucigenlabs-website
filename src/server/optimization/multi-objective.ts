/**
 * Multi-Objective Optimizer
 * 
 * Optimizes multiple objectives simultaneously (quality, cost, latency, satisfaction).
 * Uses Pareto optimization to find best trade-offs.
 */

import { predictCostQuality, ApiConfig } from '../ml/cost-quality-optimizer';

export interface Objective {
  name: string;
  weight: number; // 0-1, importance weight
  minimize: boolean; // true = minimize, false = maximize
  currentValue: number;
  targetValue?: number;
}

export interface Solution {
  config: ApiConfig;
  objectives: Record<string, number>;
  score: number; // Weighted sum or Pareto rank
  dominated: boolean; // For Pareto optimization
}

export interface OptimizationResult {
  solutions: Solution[];
  paretoFront: Solution[]; // Non-dominated solutions
  recommended: Solution | null;
  tradeOffAnalysis: TradeOffAnalysis[];
}

export interface TradeOffAnalysis {
  objectiveA: string;
  objectiveB: string;
  correlation: number; // -1 to 1
  tradeOff: string; // Description of trade-off
}

/**
 * Optimize for multiple objectives using weighted sum
 */
export async function optimizeWeightedSum(
  objectives: Objective[],
  taskType: string,
  promptLength: number,
  candidateConfigs: ApiConfig[]
): Promise<OptimizationResult> {
  const solutions: Solution[] = [];

  // Evaluate each candidate configuration
  for (const config of candidateConfigs) {
    const prediction = await predictCostQuality(taskType, promptLength, config);

    const solutionObjectives: Record<string, number> = {
      cost: prediction.estimatedCost,
      quality: prediction.estimatedQuality,
      latency: prediction.estimatedLatency,
    };

    // Calculate weighted score
    let score = 0;
    for (const objective of objectives) {
      let value = solutionObjectives[objective.name] || 0;
      
      // Normalize value (0-1)
      if (objective.name === 'cost') {
        value = Math.min(1, value / 0.1); // Normalize assuming max cost of $0.1
      } else if (objective.name === 'latency') {
        value = Math.min(1, value / 5000); // Normalize assuming max latency of 5s
      }
      // Quality is already 0-1

      if (objective.minimize) {
        value = 1 - value; // Invert for minimization
      }

      score += value * objective.weight;
    }

    solutions.push({
      config,
      objectives: solutionObjectives,
      score,
      dominated: false,
    });
  }

  // Find Pareto front
  const paretoFront = findParetoFront(solutions, objectives);

  // Select best solution (highest score)
  solutions.sort((a, b) => b.score - a.score);
  const recommended = solutions[0] || null;

  // Analyze trade-offs
  const tradeOffAnalysis = analyzeTradeOffs(solutions, objectives);

  return {
    solutions,
    paretoFront,
    recommended,
    tradeOffAnalysis,
  };
}

/**
 * Find Pareto-optimal solutions (non-dominated)
 */
function findParetoFront(solutions: Solution[], objectives: Objective[]): Solution[] {
  const paretoFront: Solution[] = [];

  for (const solution of solutions) {
    let dominated = false;

    for (const other of solutions) {
      if (solution === other) continue;

      // Check if other dominates solution
      let otherBetter = true;
      let solutionBetter = false;

      for (const objective of objectives) {
        const solutionValue = solution.objectives[objective.name] || 0;
        const otherValue = other.objectives[objective.name] || 0;

        if (objective.minimize) {
          if (otherValue < solutionValue) {
            otherBetter = true;
          } else if (solutionValue < otherValue) {
            solutionBetter = true;
            otherBetter = false;
            break;
          }
        } else {
          if (otherValue > solutionValue) {
            otherBetter = true;
          } else if (solutionValue > otherValue) {
            solutionBetter = true;
            otherBetter = false;
            break;
          }
        }
      }

      if (otherBetter && !solutionBetter) {
        dominated = true;
        break;
      }
    }

    if (!dominated) {
      paretoFront.push(solution);
    }
  }

  return paretoFront;
}

/**
 * Analyze trade-offs between objectives
 */
function analyzeTradeOffs(solutions: Solution[], objectives: Objective[]): TradeOffAnalysis[] {
  const tradeOffs: TradeOffAnalysis[] = [];

  // Analyze correlation between objectives
  for (let i = 0; i < objectives.length; i++) {
    for (let j = i + 1; j < objectives.length; j++) {
      const objA = objectives[i];
      const objB = objectives[j];

      const valuesA = solutions.map(s => s.objectives[objA.name] || 0);
      const valuesB = solutions.map(s => s.objectives[objB.name] || 0);

      const correlation = calculateCorrelation(valuesA, valuesB);

      let tradeOff = '';
      if (Math.abs(correlation) > 0.7) {
        if (correlation > 0) {
          tradeOff = `${objA.name} and ${objB.name} are positively correlated - improving one improves the other`;
        } else {
          tradeOff = `${objA.name} and ${objB.name} are negatively correlated - improving one degrades the other`;
        }
      } else {
        tradeOff = `${objA.name} and ${objB.name} are weakly correlated - can be optimized independently`;
      }

      tradeOffs.push({
        objectiveA: objA.name,
        objectiveB: objB.name,
        correlation,
        tradeOff,
      });
    }
  }

  return tradeOffs;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumSqX += diffX * diffX;
    sumSqY += diffY * diffY;
  }

  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator > 0 ? numerator / denominator : 0;
}

/**
 * Get recommended configuration for multi-objective optimization
 */
export async function getRecommendedConfig(
  objectives: Objective[],
  taskType: string,
  promptLength: number
): Promise<ApiConfig | null> {
  // Generate candidate configurations
  const candidates: ApiConfig[] = [
    { model: 'gpt-4o', temperature: 0.1, maxTokens: 2000 },
    { model: 'gpt-4o-mini', temperature: 0.1, maxTokens: 2000 },
    { model: 'gpt-4o-mini', temperature: 0.1, maxTokens: 1000 },
    { model: 'gpt-4o', temperature: 0.2, maxTokens: 1500 },
  ];

  const result = await optimizeWeightedSum(objectives, taskType, promptLength, candidates);

  return result.recommended?.config || null;
}
