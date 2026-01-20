/**
 * Permission Utilities
 * 
 * Validates user permissions before allowing actions
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

export interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

export type UserRole = 'user' | 'early' | 'admin';

/**
 * Get user role
 */
export async function getUserRole(userId: string | null): Promise<UserRole> {
  if (!userId || !supabase) {
    return 'user';
  }

  try {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    return (user?.role as UserRole) || 'user';
  } catch (error) {
    console.warn('[Permissions] Failed to get user role:', error);
    return 'user';
  }
}

/**
 * Check if user has permission
 */
export async function hasPermission(
  userId: string | null,
  permission: Permission
): Promise<boolean> {
  const role = await getUserRole(userId);

  // Admin has all permissions
  if (role === 'admin') {
    return true;
  }

  // Define role-based permissions
  const rolePermissions: Record<UserRole, Permission[]> = {
    user: [
      { resource: 'events', action: 'read' },
      { resource: 'signals', action: 'read' },
      { resource: 'alerts', action: 'read' },
      { resource: 'alerts', action: 'write' },
      { resource: 'preferences', action: 'write' },
      { resource: 'profile', action: 'write' },
    ],
    early: [
      { resource: 'events', action: 'read' },
      { resource: 'signals', action: 'read' },
      { resource: 'alerts', action: 'read' },
      { resource: 'alerts', action: 'write' },
      { resource: 'preferences', action: 'write' },
      { resource: 'profile', action: 'write' },
      { resource: 'search', action: 'write' },
      { resource: 'enrich', action: 'write' },
    ],
    admin: [
      { resource: 'audit', action: 'read' },
      { resource: 'audit', action: 'admin' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'admin' },
    ], // Admin has additional permissions
  };

  const allowed = rolePermissions[role] || [];
  return allowed.some(
    p => p.resource === permission.resource && p.action === permission.action
  );
}

/**
 * Check if user owns a resource
 */
export async function ownsResource(
  userId: string | null,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  if (!userId || !supabase) {
    return false;
  }

  try {
    // Map resource types to table names and user_id columns
    const resourceMap: Record<string, { table: string; userIdColumn: string }> = {
      alert: { table: 'user_alerts', userIdColumn: 'user_id' },
      preference: { table: 'user_preferences', userIdColumn: 'user_id' },
      profile: { table: 'users', userIdColumn: 'id' },
    };

    const mapping = resourceMap[resourceType];
    if (!mapping) {
      return false;
    }

    const { data } = await supabase
      .from(mapping.table)
      .select(mapping.userIdColumn)
      .eq('id', resourceId)
      .eq(mapping.userIdColumn, userId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    console.warn('[Permissions] Failed to check resource ownership:', error);
    return false;
  }
}

/**
 * Permission middleware factory
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || req.headers['x-user-id'] || null;

      // Check permission
      const allowed = await hasPermission(userId, permission);
      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'PERMISSION_DENIED',
          message: `You don't have permission to ${permission.action} ${permission.resource}`,
        });
      }

      next();
    } catch (error: any) {
      console.error('[Permissions] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'PERMISSION_CHECK_FAILED',
        message: 'Failed to check permissions',
      });
    }
  };
}

/**
 * Require resource ownership middleware
 */
export function requireOwnership(resourceType: string, resourceIdParam: string = 'id') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id || req.headers['x-user-id'] || null;
      const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'RESOURCE_ID_REQUIRED',
          message: 'Resource ID is required',
        });
      }

      // Admin can access any resource
      const role = await getUserRole(userId);
      if (role === 'admin') {
        return next();
      }

      // Check ownership
      const owns = await ownsResource(userId, resourceType, resourceId);
      if (!owns) {
        return res.status(403).json({
          success: false,
          error: 'RESOURCE_ACCESS_DENIED',
          message: 'You don\'t have access to this resource',
        });
      }

      next();
    } catch (error: any) {
      console.error('[Permissions] Error:', error);
      return res.status(500).json({
        success: false,
        error: 'OWNERSHIP_CHECK_FAILED',
        message: 'Failed to check resource ownership',
      });
    }
  };
}
