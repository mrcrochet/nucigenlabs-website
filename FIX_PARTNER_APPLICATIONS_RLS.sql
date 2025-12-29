-- Fix RLS policies for partner_applications table
-- This script ensures anonymous users can insert partner applications

-- IMPORTANT: Make sure the table exists first
-- If the table doesn't exist, run PARTNER_APPLICATIONS_TABLE.sql first

-- Step 1: Drop ALL existing policies to start fresh
DO $$ 
BEGIN
  -- Drop all policies on partner_applications
  DROP POLICY IF EXISTS "Allow anonymous insert partner applications" ON partner_applications;
  DROP POLICY IF EXISTS "Allow authenticated insert partner applications" ON partner_applications;
  DROP POLICY IF EXISTS "Allow authenticated view partner applications" ON partner_applications;
  DROP POLICY IF EXISTS "Allow authenticated update partner applications" ON partner_applications;
  DROP POLICY IF EXISTS "Service role full access partner applications" ON partner_applications;
  
  -- Drop any other policies that might exist
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'partner_applications') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON partner_applications', r.policyname);
  END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

-- Step 3: Create the critical policy for anonymous inserts (THIS IS THE KEY FIX)
CREATE POLICY "Allow anonymous insert partner applications"
  ON partner_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Step 4: Allow authenticated users to insert (in case they're logged in)
CREATE POLICY "Allow authenticated insert partner applications"
  ON partner_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 5: Allow authenticated users to view (for admin review)
CREATE POLICY "Allow authenticated view partner applications"
  ON partner_applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Step 6: Allow authenticated users to update (for admin review)
CREATE POLICY "Allow authenticated update partner applications"
  ON partner_applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 7: Allow service role full access (for backend operations)
CREATE POLICY "Service role full access partner applications"
  ON partner_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verification query (run this to check if policies are created)
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'partner_applications';
