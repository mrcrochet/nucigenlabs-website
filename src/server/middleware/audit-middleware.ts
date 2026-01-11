/**
 * Audit Middleware
 * 
 * Logs all user actions to audit_trail table for compliance and audit purposes.
 * Phase D.1: Audit Trail System (PRIORITY HIGH)
 * 
 * Usage:
 *   import { auditMiddleware } from './middleware/audit-middleware.js';
 *   app.use(auditMiddleware);
 */

import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[Audit] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for audit logging');
}

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Extract user ID from request (Clerk JWT or session)
 */
function getUserIdFromRequest(req: Request): string | null {
  // Try to get user ID from Clerk JWT
  // Clerk typically sets req.auth?.userId or similar
  if ((req as any).auth?.userId) {
    return (req as any).auth.userId;
  }

  // Try to get from headers (if passed from frontend)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      // If using Clerk, JWT token is in Bearer token
      // For now, return null and let the service handle it
      // TODO: Implement proper JWT parsing for Clerk
    } catch (error) {
      // Ignore JWT parsing errors
    }
  }

  // Try to get from query params (for API calls with userId)
  if (req.query.userId && typeof req.query.userId === 'string') {
    return req.query.userId;
  }

  // Try to get from body (for POST requests with userId)
  if (req.body && req.body.userId && typeof req.body.userId === 'string') {
    return req.body.userId;
  }

  return null;
}

/**
 * Determine action type from request
 */
function getActionTypeFromRequest(req: Request): string {
  const method = req.method;
  const path = req.path;

  // Map routes to action types
  if (path.includes('/events/')) {
    if (method === 'GET') return 'event_viewed';
    if (method === 'POST') return 'event_created';
    if (method === 'PUT' || method === 'PATCH') return 'event_updated';
    if (method === 'DELETE') return 'event_deleted';
  }

  if (path.includes('/alerts')) {
    if (method === 'GET') return 'alert_viewed';
    if (method === 'POST') return 'alert_created';
    if (method === 'PUT' || method === 'PATCH') return 'alert_updated';
    if (method === 'DELETE') return 'alert_deleted';
  }

  if (path.includes('/recommendations')) {
    if (method === 'GET') return 'recommendation_viewed';
    if (method === 'POST') return 'recommendation_generated';
  }

  if (path.includes('/filings') || path.includes('/financial-filings')) {
    if (method === 'GET') return 'filing_viewed';
    if (method === 'POST') return 'filing_processed';
  }

  if (path.includes('/earnings-calls')) {
    if (method === 'GET') return 'earnings_call_viewed';
    if (method === 'POST') return 'earnings_call_processed';
  }

  if (path.includes('/compare') || path.includes('/company-comparison')) {
    if (method === 'GET') return 'comparison_viewed';
    if (method === 'POST') return 'comparison_created';
  }

  if (path.includes('/preferences')) {
    if (method === 'GET') return 'preference_viewed';
    if (method === 'PUT' || method === 'PATCH') return 'preference_updated';
  }

  if (path.includes('/onboarding')) {
    if (method === 'POST') return 'onboarding_completed';
  }

  // Generic action types based on HTTP method
  return `${method.toLowerCase()}_${path.replace(/\//g, '_').replace(/[^a-z0-9_]/gi, '')}`;
}

/**
 * Determine resource type from request
 */
function getResourceTypeFromRequest(req: Request): string {
  const path = req.path;

  if (path.includes('/events')) return 'event';
  if (path.includes('/alerts')) return 'alert';
  if (path.includes('/recommendations')) return 'recommendation';
  if (path.includes('/filings') || path.includes('/financial-filings')) return 'filing';
  if (path.includes('/earnings-calls')) return 'earnings_call';
  if (path.includes('/compare')) return 'comparison';
  if (path.includes('/preferences')) return 'user_preference';
  if (path.includes('/onboarding')) return 'onboarding';

  return 'unknown';
}

/**
 * Extract resource ID from request
 */
function getResourceIdFromRequest(req: Request): string | null {
  // Try to get from URL params (e.g., /events/:id)
  const params = req.params;
  if (params.id) {
    return params.id;
  }
  if (params.eventId) {
    return params.eventId;
  }
  if (params.alertId) {
    return params.alertId;
  }
  if (params.filingId) {
    return params.filingId;
  }
  if (params.callId) {
    return params.callId;
  }

  // Try to get from query params
  if (req.query.id && typeof req.query.id === 'string') {
    return req.query.id;
  }

  // Try to get from body
  if (req.body && req.body.id && typeof req.body.id === 'string') {
    return req.body.id;
  }

  return null;
}

/**
 * Create audit log entry
 */
async function logAuditEvent(
  userId: string | null,
  actionType: string,
  resourceType: string,
  resourceId: string | null,
  metadata: any,
  req: Request,
  res: Response,
  status: 'success' | 'error' | 'pending' = 'success',
  errorMessage?: string
): Promise<void> {
  if (!supabase) {
    console.warn('[Audit] Supabase not configured. Skipping audit log.');
    return;
  }

  try {
    // Get user email and convert Clerk user ID to Supabase UUID
    let userEmail: string | null = null;
    let supabaseUserId: string | null = null;
    
    if (userId) {
      try {
        // Check if userId is already a UUID (Supabase format)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        
        if (isUUID) {
          // Already a Supabase UUID
          supabaseUserId = userId;
          // Get user email from users table
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .maybeSingle();
          
          if (userData) {
            userEmail = userData.email;
          }
        } else {
          // Assume it's a Clerk user ID, convert to Supabase UUID
          // Note: Function parameter is 'clerk_id', not 'clerk_user_id'
          const { data: supabaseUserIdData, error: rpcError } = await supabase.rpc(
            'get_or_create_supabase_user_id',
            { clerk_id: userId, user_email: null }
          );
          
          if (rpcError) {
            console.warn('[Audit] Error converting Clerk user ID to Supabase UUID:', rpcError);
          } else if (supabaseUserIdData) {
            supabaseUserId = supabaseUserIdData as string;
            
            // Get user email from users table
            const { data: userData } = await supabase
              .from('users')
              .select('email')
              .eq('id', supabaseUserId)
              .maybeSingle();
            
            if (userData) {
              userEmail = userData.email;
            }
          }
        }
      } catch (error: any) {
        console.warn('[Audit] Error fetching user data:', error.message);
      }
    }

    // Prepare metadata with additional context
    const enrichedMetadata = {
      ...metadata,
      requestPath: req.path,
      requestMethod: req.method,
      queryParams: req.query,
      bodyKeys: req.body ? Object.keys(req.body).slice(0, 10) : [], // Only first 10 keys for privacy
      responseStatus: res.statusCode,
    };

    // Insert audit log using Supabase UUID (not Clerk ID)
    const { error } = await supabase
      .from('audit_trail')
      .insert({
        user_id: supabaseUserId || null, // Use Supabase UUID, not Clerk ID
        user_email: userEmail,
        action_type: actionType,
        resource_type: resourceType,
        resource_id: resourceId || 'unknown',
        metadata: enrichedMetadata,
        source_ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null,
        request_path: req.path,
        request_method: req.method,
        status: status,
        error_message: errorMessage || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Audit] Error logging audit event:', error);
    }
  } catch (error: any) {
    console.error('[Audit] Unexpected error logging audit event:', error.message);
    // Don't throw - audit logging should never break the request flow
  }
}

/**
 * Express middleware for audit logging
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Skip audit for health checks and other system endpoints
  if (req.path === '/health' || req.path.startsWith('/metrics') || req.path.startsWith('/status')) {
    return next();
  }

  // Capture original res.json and res.send to intercept response
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseSent = false;

  res.json = function (body: any) {
    if (!responseSent) {
      responseSent = true;
      logResponse(body);
    }
    return originalJson(body);
  };

  res.send = function (body: any) {
    if (!responseSent) {
      responseSent = true;
      logResponse(body);
    }
    return originalSend(body);
  };

  function logResponse(body: any) {
    const userId = getUserIdFromRequest(req);
    const actionType = getActionTypeFromRequest(req);
    const resourceType = getResourceTypeFromRequest(req);
    const resourceId = getResourceIdFromRequest(req);

    // Extract metadata from response if available
    let metadata: any = {};
    if (body && typeof body === 'object') {
      if (body.metadata) {
        metadata = body.metadata;
      } else if (body.data) {
        // Extract relevant fields from data
        metadata = {
          dataKeys: Object.keys(body.data).slice(0, 10),
          dataType: typeof body.data,
        };
      }
    }

    // Determine status
    const status = res.statusCode >= 200 && res.statusCode < 300 
      ? 'success' 
      : res.statusCode >= 400 
        ? 'error' 
        : 'pending';
    
    const errorMessage = status === 'error' && body?.error 
      ? (typeof body.error === 'string' ? body.error : body.error.message)
      : undefined;

    // Log asynchronously (don't wait)
    logAuditEvent(
      userId,
      actionType,
      resourceType,
      resourceId,
      metadata,
      req,
      res,
      status,
      errorMessage
    ).catch(error => {
      console.error('[Audit] Error in async audit logging:', error);
    });
  }

  next();
}

/**
 * Manual audit logging function (for non-Express contexts)
 */
export async function logAuditEventManual(
  userId: string | null,
  actionType: string,
  resourceType: string,
  resourceId: string,
  metadata?: any,
  sourceIp?: string,
  userAgent?: string,
  requestPath?: string,
  requestMethod?: string,
  status: 'success' | 'error' | 'pending' = 'success',
  errorMessage?: string
): Promise<void> {
  if (!supabase) {
    console.warn('[Audit] Supabase not configured. Skipping audit log.');
    return;
  }

  try {
    // Get user email and convert Clerk user ID to Supabase UUID
    let userEmail: string | null = null;
    let supabaseUserId: string | null = null;
    
    if (userId) {
      try {
        // Check if userId is already a UUID (Supabase format)
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        
        if (isUUID) {
          // Already a Supabase UUID
          supabaseUserId = userId;
          // Get user email from users table
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', userId)
            .maybeSingle();
          
          if (userData) {
            userEmail = userData.email;
          }
        } else {
          // Assume it's a Clerk user ID, convert to Supabase UUID
          // Note: Function parameter is 'clerk_id', not 'clerk_user_id'
          const { data: supabaseUserIdData, error: rpcError } = await supabase.rpc(
            'get_or_create_supabase_user_id',
            { clerk_id: userId, user_email: null }
          );
          
          if (rpcError) {
            console.warn('[Audit] Error converting Clerk user ID to Supabase UUID:', rpcError);
          } else if (supabaseUserIdData) {
            supabaseUserId = supabaseUserIdData as string;
            
            // Get user email from users table
            const { data: userData } = await supabase
              .from('users')
              .select('email')
              .eq('id', supabaseUserId)
              .maybeSingle();
            
            if (userData) {
              userEmail = userData.email;
            }
          }
        }
      } catch (error: any) {
        console.warn('[Audit] Error fetching user data:', error.message);
      }
    }

    const { error } = await supabase
      .from('audit_trail')
      .insert({
        user_id: supabaseUserId || null, // Use Supabase UUID, not Clerk ID
        user_email: userEmail,
        action_type: actionType,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata: metadata || {},
        source_ip: sourceIp || null,
        user_agent: userAgent || null,
        request_path: requestPath || null,
        request_method: requestMethod || null,
        status: status,
        error_message: errorMessage || null,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[Audit] Error logging audit event:', error);
    }
  } catch (error: any) {
    console.error('[Audit] Unexpected error logging audit event:', error.message);
  }
}
