/**
 * Rate Limiter Middleware
 * 
 * Implements user-based rate limiting with quotas and tiers
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

export interface UserTier {
  name: string;
  limits: {
    search: RateLimitConfig;
    enrich: RateLimitConfig;
    signals: RateLimitConfig;
    marketData: RateLimitConfig;
    alpha: RateLimitConfig;
  };
}

// Define tiers
const TIERS: Record<string, UserTier> = {
  free: {
    name: 'Free',
    limits: {
      search: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
      enrich: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
      signals: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
      marketData: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
      alpha: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute
    },
  },
  pro: {
    name: 'Pro',
    limits: {
      search: { windowMs: 60 * 1000, maxRequests: 50 }, // 50 per minute
      enrich: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
      signals: { windowMs: 60 * 1000, maxRequests: 50 }, // 50 per minute
      marketData: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
      alpha: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute
    },
  },
  ultimate: {
    name: 'Ultimate',
    limits: {
      search: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 per minute
      enrich: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
      signals: { windowMs: 60 * 1000, maxRequests: 200 }, // 200 per minute
      marketData: { windowMs: 60 * 1000, maxRequests: 500 }, // 500 per minute
      alpha: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
    },
  },
};

// In-memory rate limit store (in production, use Redis)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Get user tier (defaults to 'free')
 */
async function getUserTier(userId: string | null): Promise<string> {
  if (!userId || !supabase) {
    return 'free';
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    // Map role to tier (early/admin = pro, user = free)
    if (user?.role === 'early' || user?.role === 'admin') {
      return 'pro';
    }
    return 'free';
  } catch (error) {
    console.warn('[RateLimiter] Failed to get user tier:', error);
    return 'free';
  }
}

/**
 * Check rate limit
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new window
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

/**
 * Rate limiter middleware factory
 */
export function rateLimiter(operation: keyof UserTier['limits']) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user ID from request
      const userId = (req as any).user?.id || req.headers['x-user-id'] || null;
      const userTier = await getUserTier(userId);
      const tier = TIERS[userTier] || TIERS.free;
      const config = tier.limits[operation];

      // Create rate limit key
      const key = userId ? `rate-limit:${operation}:${userId}` : `rate-limit:${operation}:ip:${req.ip}`;

      // Check rate limit
      const result = checkRateLimit(key, config);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
      res.setHeader('X-RateLimit-Tier', userTier);

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: config.message || `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
          retryAfter,
          tier: userTier,
        });
      }

      next();
    } catch (error: any) {
      console.error('[RateLimiter] Error:', error);
      // Don't block request on rate limiter error
      next();
    }
  };
}

/**
 * Get rate limit info for a user
 */
export async function getRateLimitInfo(userId: string | null): Promise<{
  tier: string;
  limits: UserTier['limits'];
}> {
  const tier = await getUserTier(userId);
  return {
    tier,
    limits: TIERS[tier]?.limits || TIERS.free.limits,
  };
}
