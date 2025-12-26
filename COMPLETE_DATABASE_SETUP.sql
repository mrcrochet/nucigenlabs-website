/*
  ============================================================================
  COMPLETE DATABASE SETUP FOR NUCIGEN LABS LANDING PAGE
  ============================================================================
  
  This script creates all necessary tables, indexes, policies, and functions
  for the Nucigen Labs landing page.
  
  Execute this script in Supabase SQL Editor to set up your complete database.
  
  Tables created:
  1. access_requests - Main table for early access signups
  2. institutional_requests - Table for institutional access requests
  3. email_verification_codes - Table for email verification codes (4-digit)
  
  ============================================================================
*/

-- ============================================================================
-- TABLE 1: access_requests
-- ============================================================================
-- Main table for early access signups and waitlist registrations

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT,
  company TEXT,
  phone TEXT,
  company_number TEXT,
  exposure TEXT,
  intended_use TEXT,
  experience_level TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source_page TEXT,
  
  -- Early access fields
  early_access BOOLEAN DEFAULT true,
  launch_date DATE DEFAULT '2026-01-30',
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- UTM tracking fields
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for access_requests
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_early_access ON access_requests(early_access);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON access_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow anonymous insert" ON access_requests;
DROP POLICY IF EXISTS "Anyone can submit access requests" ON access_requests;
DROP POLICY IF EXISTS "Allow authenticated insert" ON access_requests;
DROP POLICY IF EXISTS "Allow anonymous select by email" ON access_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON access_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON access_requests;
DROP POLICY IF EXISTS "Users can update own requests" ON access_requests;
DROP POLICY IF EXISTS "Service role full access" ON access_requests;

-- RLS Policies for access_requests
CREATE POLICY "Allow anonymous insert" ON access_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated insert" ON access_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anonymous select by email" ON access_requests
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Users can read own requests" ON access_requests
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'email' = email OR auth.uid()::text = id::text);

CREATE POLICY "Users can update own requests" ON access_requests
  FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'email' = email OR auth.uid()::text = id::text)
  WITH CHECK (auth.jwt()->>'email' = email OR auth.uid()::text = id::text);

CREATE POLICY "Service role full access" ON access_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
DROP TRIGGER IF EXISTS update_access_requests_updated_at ON access_requests;
CREATE TRIGGER update_access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE access_requests IS 'Stores early access signup requests for Nucigen Labs platform';

-- ============================================================================
-- TABLE 2: institutional_requests
-- ============================================================================
-- Table for institutional access requests (optional, for enterprise clients)

CREATE TABLE IF NOT EXISTS institutional_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT,
  sector TEXT,
  country TEXT,
  capital_size TEXT,
  timeline TEXT,
  interests TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Indexes for institutional_requests
CREATE INDEX IF NOT EXISTS idx_institutional_requests_email ON institutional_requests(email);
CREATE INDEX IF NOT EXISTS idx_institutional_requests_status ON institutional_requests(status);
CREATE INDEX IF NOT EXISTS idx_institutional_requests_created_at ON institutional_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE institutional_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can submit institutional requests" ON institutional_requests;
DROP POLICY IF EXISTS "Users can view their own institutional requests" ON institutional_requests;

-- RLS Policies for institutional_requests
CREATE POLICY "Anyone can submit institutional requests" ON institutional_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own institutional requests" ON institutional_requests
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'email' = email);

-- ============================================================================
-- TABLE 3: email_verification_codes
-- ============================================================================
-- Table for storing temporary email verification codes (4-digit codes)

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL CHECK (code ~ '^[0-9]{4}$'), -- Must be exactly 4 digits
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  verified BOOLEAN DEFAULT false,
  verification_attempts INTEGER DEFAULT 0, -- Track failed attempts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email_verification_codes
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code_email_verified ON email_verification_codes(code, email, verified) 
  WHERE verified = false;
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email_active ON email_verification_codes(email, created_at) 
  WHERE verified = false;

-- Enable Row Level Security
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous insert verification codes" ON email_verification_codes;
DROP POLICY IF EXISTS "Allow anonymous read own active codes" ON email_verification_codes;
DROP POLICY IF EXISTS "Allow anonymous update own codes" ON email_verification_codes;
DROP POLICY IF EXISTS "Service role full access verification codes" ON email_verification_codes;

-- RLS Policies for email_verification_codes
CREATE POLICY "Allow anonymous insert verification codes" ON email_verification_codes
  FOR INSERT
  TO anon
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM email_verification_codes
      WHERE email = email_verification_codes.email
        AND verified = false
        AND expires_at > NOW()
    )
  );

CREATE POLICY "Allow anonymous read own active codes" ON email_verification_codes
  FOR SELECT
  TO anon
  USING (
    verified = false 
    AND expires_at > NOW()
  );

CREATE POLICY "Allow anonymous update own codes" ON email_verification_codes
  FOR UPDATE
  TO anon
  USING (
    verified = false 
    AND expires_at > NOW()
  )
  WITH CHECK (
    verified IN (false, true)
    AND expires_at > NOW()
  );

CREATE POLICY "Service role full access verification codes" ON email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get active code count for an email (for rate limiting)
CREATE OR REPLACE FUNCTION get_active_code_count(p_email TEXT)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM email_verification_codes
  WHERE email = LOWER(TRIM(p_email))
    AND verified = false
    AND expires_at > NOW();
  
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to automatically delete old verified codes (optional)
CREATE OR REPLACE FUNCTION cleanup_old_verified_codes()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE verified = true
    AND created_at < NOW() - INTERVAL '24 hours';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE email_verification_codes IS 'Stores temporary email verification codes. Codes expire after 15 minutes and are single-use.';
COMMENT ON COLUMN email_verification_codes.code IS '4-digit numeric code (0000-9999)';
COMMENT ON COLUMN email_verification_codes.verification_attempts IS 'Number of failed verification attempts for this code';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify that all tables were created successfully

DO $$
BEGIN
  RAISE NOTICE 'Database setup complete!';
  RAISE NOTICE 'Tables created: access_requests, institutional_requests, email_verification_codes';
END $$;


