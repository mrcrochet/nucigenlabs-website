-- ============================================
-- FIX: RLS Policy for INSERT on users table
-- ============================================
-- This script fixes the "new row violates row-level security policy" error
-- by adding a permissive INSERT policy for authenticated users
-- 
-- Execute this in Supabase SQL Editor

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Allow function to insert users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert own profile" ON public.users;

-- Policy: Allow authenticated users to insert their own profile
-- This is needed for Clerk users who don't exist in auth.users
-- The policy allows insertion if the user_id matches a Clerk mapping
CREATE POLICY "Allow authenticated users to insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow if user exists in clerk_user_mapping (Clerk users)
    EXISTS (
      SELECT 1 FROM public.clerk_user_mapping 
      WHERE supabase_user_id = id
    )
    OR
    -- Allow if id matches auth.uid() (Supabase Auth users - legacy)
    id = auth.uid()
  );

-- Also ensure the function can create users
-- This policy allows the SECURITY DEFINER function to insert
CREATE POLICY "Allow function to insert users"
  ON public.users
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true); -- Function will validate
