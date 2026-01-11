/**
 * Multi-Armed Bandit
 * 
 * Implements UCB (Upper Confidence Bound) and Thompson Sampling algorithms
 * for balancing exploration vs exploitation in A/B testing.
 */

export interface BanditArm {
  name: string;
  pulls: number; // Number of times this arm was selected
  successes: number; // Number of successful outcomes
  failures: number; // Number of failed outcomes
  successRate: number; // successes / pulls
}

export interface BanditSelection {
  arm: string;
  method: 'ucb' | 'thompson';
  confidence: number;
  reasoning: string;
}

/**
 * UCB (Upper Confidence Bound) algorithm
 * Balances exploration and exploitation by selecting arms with highest upper confidence bound
 */
export function selectArmUCB(arms: BanditArm[], c: number = 1.414): BanditSelection {
  const totalPulls = arms.reduce((sum, arm) => sum + arm.pulls, 0);

  if (totalPulls === 0) {
    // First pull: select randomly
    const randomArm = arms[Math.floor(Math.random() * arms.length)];
    return {
      arm: randomArm.name,
      method: 'ucb',
      confidence: 0.5,
      reasoning: 'Initial random selection',
    };
  }

  // Calculate UCB for each arm
  let bestArm = arms[0];
  let bestUCB = -Infinity;

  for (const arm of arms) {
    if (arm.pulls === 0) {
      // Never pulled: high exploration value
      return {
        arm: arm.name,
        method: 'ucb',
        confidence: 1.0,
        reasoning: 'Unexplored arm - high exploration value',
      };
    }

    const successRate = arm.successRate;
    const explorationBonus = c * Math.sqrt(Math.log(totalPulls) / arm.pulls);
    const ucb = successRate + explorationBonus;

    if (ucb > bestUCB) {
      bestUCB = ucb;
      bestArm = arm;
    }
  }

  return {
    arm: bestArm.name,
    method: 'ucb',
    confidence: Math.min(0.95, bestArm.successRate + 0.2),
    reasoning: `UCB = ${bestArm.successRate.toFixed(3)} + ${(bestUCB - bestArm.successRate).toFixed(3)} (exploration bonus)`,
  };
}

/**
 * Thompson Sampling algorithm
 * Uses Bayesian inference to sample from posterior distribution
 */
export function selectArmThompson(arms: BanditArm[]): BanditSelection {
  // Beta distribution parameters (alpha = successes + 1, beta = failures + 1)
  const samples: Array<{ arm: BanditArm; sample: number }> = [];

  for (const arm of arms) {
    const alpha = arm.successes + 1;
    const beta = arm.failures + 1;

    // Sample from Beta distribution
    const sample = sampleBeta(alpha, beta);
    samples.push({ arm, sample });
  }

  // Select arm with highest sample
  samples.sort((a, b) => b.sample - a.sample);
  const selected = samples[0];

  return {
    arm: selected.arm.name,
    method: 'thompson',
    confidence: selected.arm.successRate,
    reasoning: `Thompson sampling: sampled ${selected.sample.toFixed(3)} from Beta(${selected.arm.successes + 1}, ${selected.arm.failures + 1})`,
  };
}

/**
 * Sample from Beta distribution using rejection sampling
 */
function sampleBeta(alpha: number, beta: number): number {
  // Simplified Beta sampling (for production, use proper Beta distribution library)
  // Using approximation: Beta(alpha, beta) ≈ Gamma(alpha) / (Gamma(alpha) + Gamma(beta))
  
  // For simplicity, use uniform random if parameters are small
  if (alpha <= 1 && beta <= 1) {
    return Math.random();
  }

  // Use normal approximation for large parameters
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  const stdDev = Math.sqrt(variance);

  // Sample from normal distribution and clip to [0, 1]
  let sample = mean + stdDev * sampleNormal();
  return Math.max(0, Math.min(1, sample));
}

/**
 * Sample from standard normal distribution (Box-Muller transform)
 */
function sampleNormal(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Update arm statistics after a pull
 */
export function updateArm(arm: BanditArm, success: boolean): BanditArm {
  return {
    ...arm,
    pulls: arm.pulls + 1,
    successes: success ? arm.successes + 1 : arm.successes,
    failures: success ? arm.failures : arm.failures + 1,
    successRate: success
      ? (arm.successes + 1) / (arm.pulls + 1)
      : arm.successes / (arm.pulls + 1),
  };
}

/**
 * Initialize arms for a bandit problem
 */
export function initializeArms(armNames: string[]): BanditArm[] {
  return armNames.map(name => ({
    name,
    pulls: 0,
    successes: 0,
    failures: 0,
    successRate: 0.5, // Initial estimate
  }));
}

/**
 * Select best arm using specified algorithm
 */
export function selectBestArm(
  arms: BanditArm[],
  algorithm: 'ucb' | 'thompson' = 'thompson'
): BanditSelection {
  if (algorithm === 'ucb') {
    return selectArmUCB(arms);
  } else {
    return selectArmThompson(arms);
  }
}
