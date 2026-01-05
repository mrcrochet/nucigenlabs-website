-- ============================================
-- Migration: Create Clerk User Mapping Table
-- ============================================
-- This table maps Clerk user IDs (e.g., "user_37qEOHmXa9h5K2xQLb37cVf2JMp")
-- to Supabase UUIDs for compatibility with existing tables that use UUID user_id
--
-- When a Clerk user logs in, we create or retrieve their mapping UUID
-- and use that UUID for all Supabase operations
--
-- IMPORTANT: This migration also modifies the users table to support Clerk users
-- by making the foreign key to auth.users optional (using a check constraint instead)

-- Step 1: Modify users table to support Clerk users
-- Drop the foreign key constraint to auth.users since Clerk users don't exist there
DO $$
BEGIN
  -- Drop the foreign key constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_id_fkey' 
    AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;
  END IF;
END $$;

-- Add INSERT policy for users table to allow the function to create users
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow function to insert users" ON public.users;

-- Policy: Allow the SECURITY DEFINER function to insert users
-- This is needed because the function creates users for Clerk authentication
CREATE POLICY "Allow function to insert users"
  ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true); -- The function will validate the data

CREATE TABLE IF NOT EXISTS public.clerk_user_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE, -- Clerk user ID (e.g., "user_37qEOHmXa9h5K2xQLb37cVf2JMp")
  supabase_user_id UUID NOT NULL UNIQUE, -- Generated UUID for Supabase compatibility
  email TEXT, -- User email for reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_clerk_user_mapping_clerk_id ON public.clerk_user_mapping(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_clerk_user_mapping_supabase_id ON public.clerk_user_mapping(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_clerk_user_mapping_email ON public.clerk_user_mapping(email);

-- Enable Row Level Security
ALTER TABLE public.clerk_user_mapping ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running the migration)
DROP POLICY IF EXISTS "Users can read own mapping" ON public.clerk_user_mapping;
DROP POLICY IF EXISTS "Users can insert own mapping" ON public.clerk_user_mapping;
DROP POLICY IF EXISTS "Service role full access" ON public.clerk_user_mapping;

-- Policy: Users can read their own mapping
-- Note: We allow all authenticated users to read because the function needs to look up any user's mapping
CREATE POLICY "Users can read own mapping"
  ON public.clerk_user_mapping
  FOR SELECT
  TO authenticated, anon
  USING (true); -- Allow authenticated and anon users to read (needed for RPC function lookups)

-- Policy: Users can insert their own mapping (needed for the RPC function)
CREATE POLICY "Users can insert own mapping"
  ON public.clerk_user_mapping
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true); -- Allow insertion (the function will validate)

-- Policy: Service role can do everything
CREATE POLICY "Service role full access"
  ON public.clerk_user_mapping
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to get or create Supabase UUID for a Clerk user ID
CREATE OR REPLACE FUNCTION public.get_or_create_supabase_user_id(clerk_id TEXT, user_email TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  supabase_uuid UUID;
  existing_user_id UUID;
BEGIN
  -- Try to get existing mapping
  SELECT supabase_user_id INTO supabase_uuid
  FROM public.clerk_user_mapping
  WHERE clerk_user_id = clerk_id;
  
  -- If mapping exists, return it
  IF supabase_uuid IS NOT NULL THEN
    RETURN supabase_uuid;
  END IF;
  
  -- Check if a user with this email already exists
  IF user_email IS NOT NULL AND user_email != '' THEN
    SELECT id INTO existing_user_id
    FROM public.users
    WHERE email = user_email
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
      -- User with this email exists, use that ID
      supabase_uuid := existing_user_id;
      
      -- Create mapping pointing to existing user
      INSERT INTO public.clerk_user_mapping (clerk_user_id, supabase_user_id, email)
      VALUES (clerk_id, existing_user_id, user_email)
      ON CONFLICT (clerk_user_id) DO UPDATE
        SET supabase_user_id = EXCLUDED.supabase_user_id,
            email = EXCLUDED.email,
            updated_at = NOW();
      
      RETURN supabase_uuid;
    END IF;
  END IF;
  
  -- No existing user, create new UUID and mapping
  supabase_uuid := gen_random_uuid();
  
  INSERT INTO public.clerk_user_mapping (clerk_user_id, supabase_user_id, email)
  VALUES (clerk_id, supabase_uuid, user_email)
  ON CONFLICT (clerk_user_id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, clerk_user_mapping.email),
        updated_at = NOW()
  RETURNING supabase_user_id INTO supabase_uuid;
  
  -- Create new user record in public.users table
  -- Note: We use the generated UUID, not referencing auth.users since Clerk doesn't use Supabase Auth
  -- Since this function uses SECURITY DEFINER, it can bypass RLS policies
  -- We already checked for email conflicts above, so this should only conflict on id
  -- IMPORTANT: This creates a minimal profile. The user must complete onboarding to fill:
  -- - company, sector, professional_role, intended_use, exposure (in users table)
  -- - preferred_sectors, preferred_regions, preferred_event_types, focus_areas (in user_preferences table)
  -- These fields are essential for personalized scraping (tavily-personalized-collector.ts)
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    supabase_uuid,
    COALESCE(user_email, ''),
    COALESCE(user_email, ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(NULLIF(EXCLUDED.email, ''), public.users.email),
        updated_at = NOW();
  
  -- Note: A trigger (trigger_create_default_preferences) will automatically create
  -- an empty user_preferences entry for this user. The user must complete onboarding
  -- to populate these preferences for personalized scraping to work.
  
  RETURN supabase_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Clerk user ID from Supabase UUID (reverse lookup)
CREATE OR REPLACE FUNCTION public.get_clerk_user_id(supabase_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  clerk_id TEXT;
BEGIN
  SELECT clerk_user_id INTO clerk_id
  FROM public.clerk_user_mapping
  WHERE supabase_user_id = supabase_uuid;
  
  RETURN clerk_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_clerk_user_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_clerk_user_mapping_updated_at ON public.clerk_user_mapping;
CREATE TRIGGER trigger_update_clerk_user_mapping_updated_at
  BEFORE UPDATE ON public.clerk_user_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_clerk_user_mapping_updated_at();

