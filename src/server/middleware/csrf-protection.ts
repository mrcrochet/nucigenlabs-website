/**
 * CSRF Protection Middleware
 * 
 * Implements CSRF token validation for state-changing operations
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Store tokens in memory (in production, use Redis or session store)
const csrfTokens = new Map<string, { token: string; expiresAt: number }>();

// Clean expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of csrfTokens.entries()) {
    if (now > value.expiresAt) {
      csrfTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate CSRF token
 */
export function generateCsrfToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(sessionId, {
    token,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 hours
  });
  return token;
}

/**
 * Verify CSRF token
 */
export function verifyCsrfToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId);
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expiresAt) {
    csrfTokens.delete(sessionId);
    return false;
  }
  
  return stored.token === token;
}

/**
 * CSRF protection middleware
 * Only applies to state-changing methods (POST, PUT, DELETE, PATCH)
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip for public endpoints (health checks, etc.)
  const publicPaths = ['/health', '/metrics'];
  if (publicPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Get session ID from header or cookie
  const sessionId = req.headers['x-session-id'] as string || 
                    (req as any).cookies?.sessionId ||
                    req.ip;

  // Get CSRF token from header
  const csrfToken = req.headers['x-csrf-token'] as string;

  if (!csrfToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token is required for this request',
    });
  }

  if (!verifyCsrfToken(sessionId, csrfToken)) {
    return res.status(403).json({
      success: false,
      error: 'CSRF_TOKEN_INVALID',
      message: 'Invalid or expired CSRF token',
    });
  }

  next();
}

/**
 * Get CSRF token endpoint
 */
export function getCsrfTokenHandler(req: Request, res: Response) {
  const sessionId = req.headers['x-session-id'] as string || 
                    (req as any).cookies?.sessionId ||
                    req.ip;
  
  const token = generateCsrfToken(sessionId);
  
  res.json({
    success: true,
    csrfToken: token,
    expiresIn: 2 * 60 * 60, // 2 hours in seconds
  });
}
