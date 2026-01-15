/**
 * Authentication Helpers
 * 
 * Utility functions for handling authentication and user ID conversion
 * between Clerk and Supabase.
 */

/**
 * Get or create Supabase user ID from Clerk user ID
 * 
 * @param clerkUserId - Clerk user ID (from Clerk authentication)
 * @param supabase - Supabase client instance
 * @returns Supabase user ID or null if not found/error
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

    return data as string;
  } catch (error: any) {
    console.error('[Auth] Error in getSupabaseUserId:', error);
    return null;
  }
}
