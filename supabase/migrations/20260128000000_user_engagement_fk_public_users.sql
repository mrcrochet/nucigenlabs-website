-- Migration: user_engagement.user_id → public.users(id) for Clerk compatibility
-- With Clerk, users live in public.users (via clerk_user_mapping), not auth.users.
-- This allows INSERT into user_engagement with Supabase UUID from get_or_create_supabase_user_id.

-- Drop FK to auth.users (default name from CREATE TABLE)
ALTER TABLE public.user_engagement
  DROP CONSTRAINT IF EXISTS user_engagement_user_id_fkey;

-- Add FK to public.users so Clerk-mapped UUIDs are valid
ALTER TABLE public.user_engagement
  ADD CONSTRAINT user_engagement_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- RLS: with Clerk we use service_role for backend writes, so existing policies stay.
-- "Users can view/insert their own" use auth.uid() which is null for Clerk;
-- service_role bypasses RLS. No change needed unless you add anon access later.
