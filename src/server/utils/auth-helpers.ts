/**
 * Authentication Helpers
 *
 * Utility functions for handling authentication and user ID conversion
 * between Clerk and Supabase.
 */

/** UUID v4 pattern – Supabase user_id must be a UUID, never a Clerk id (user_xxx) */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isSupabaseUuid(value: string): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

/**
 * Get or create Supabase user ID from Clerk user ID.
 * The RPC must return a Supabase UUID, not the Clerk id.
 *
 * @param clerkUserId - Clerk user ID (e.g. user_397qoeBpac0ZBVZ3nHWJdsfWZGX)
 * @param supabase - Supabase client instance
 * @returns Supabase user UUID or null if not found/error
 */
export async function getSupabaseUserId(
  clerkUserId: string | null,
  supabase: any
): Promise<string | null> {
  if (!clerkUserId || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.rpc('get_or_create_supabase_user_id', {
      clerk_id: clerkUserId,
    });

    if (error || !data) {
      console.error('[Auth] Error converting Clerk user ID:', error);
      return null;
    }

    const value = data as string;
    // Never pass Clerk id to UUID columns – RPC must return Supabase UUID
    if (!isSupabaseUuid(value)) {
      console.error('[Auth] RPC returned non-UUID (Clerk id?):', value?.substring?.(0, 20));
      return null;
    }
    return value;
  } catch (error: any) {
    console.error('[Auth] Error in getSupabaseUserId:', error);
    return null;
  }
}
