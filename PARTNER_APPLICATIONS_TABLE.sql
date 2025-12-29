-- Create partner_applications table for the Nucigen Partner Program
-- This table stores applications from potential partners (analysts, content creators, etc.)

CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  platform TEXT,
  audience_size TEXT,
  content_focus TEXT,
  why_interested TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  CONSTRAINT unique_email UNIQUE (email)
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner_applications(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_partner_applications_created_at ON partner_applications(created_at DESC);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partner_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_partner_applications_updated_at ON partner_applications;
CREATE TRIGGER trigger_update_partner_applications_updated_at
  BEFORE UPDATE ON partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_applications_updated_at();

-- Enable Row Level Security
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert applications
DROP POLICY IF EXISTS "Allow anonymous insert partner applications" ON partner_applications;
CREATE POLICY "Allow anonymous insert partner applications"
  ON partner_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to view all applications (for admin review)
DROP POLICY IF EXISTS "Allow authenticated view partner applications" ON partner_applications;
CREATE POLICY "Allow authenticated view partner applications"
  ON partner_applications
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to update applications (for admin review)
DROP POLICY IF EXISTS "Allow authenticated update partner applications" ON partner_applications;
CREATE POLICY "Allow authenticated update partner applications"
  ON partner_applications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Set search_path for security
ALTER FUNCTION update_partner_applications_updated_at() SET search_path = public;


