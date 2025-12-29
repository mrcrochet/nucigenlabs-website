-- QUICK FIX: Simple RLS policy fix for partner_applications
-- Run this in Supabase SQL Editor if you're getting RLS errors

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow anonymous insert partner applications" ON partner_applications;

-- Create the policy that allows anonymous users to insert
CREATE POLICY "Allow anonymous insert partner applications"
  ON partner_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

