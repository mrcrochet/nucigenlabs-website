/**
 * Market Feature Flags
 * 
 * Controls access to Market page features based on user plan.
 * Premium-first approach: show value without giving everything away.
 */

export type UserPlan = 'free' | 'analyst' | 'pro' | 'enterprise';

export interface MarketFeatureFlags {
  canAccessMarket: boolean;
  maxMarketCardsPerDay: number;
  canViewConfidence: boolean;
  canViewFullThesis: boolean;
  canViewSupportingEvidence: boolean;
  canViewHistoricalPatterns: boolean;
  canViewRelatedEvents: boolean;
  canExport: boolean;
}

/**
 * Get market feature flags for a user
 * 
 * @param user - User object with optional plan field (defaults to 'free')
 * @returns Feature flags object
 */
export function getMarketFeatureFlags(user?: { plan?: UserPlan } | null): MarketFeatureFlags {
  const plan: UserPlan = user?.plan || 'free';

  return {
    canAccessMarket: plan !== 'free',
    maxMarketCardsPerDay:
      plan === 'free' ? 2 :
      plan === 'analyst' ? 6 :
      plan === 'pro' ? 20 :
      Infinity,
    canViewConfidence: plan !== 'free',
    canViewFullThesis: plan !== 'free',
    canViewSupportingEvidence: plan === 'pro' || plan === 'enterprise',
    canViewHistoricalPatterns: plan === 'pro' || plan === 'enterprise',
    canViewRelatedEvents: plan !== 'free',
    canExport: plan === 'enterprise',
  };
}

/**
 * Check if user has exceeded daily limit
 * 
 * @param user - User object
 * @param viewsToday - Number of market cards viewed today
 * @returns true if limit exceeded
 */
export function hasExceededDailyLimit(
  user: { plan?: UserPlan } | null | undefined,
  viewsToday: number
): boolean {
  const flags = getMarketFeatureFlags(user);
  return viewsToday >= flags.maxMarketCardsPerDay;
}
