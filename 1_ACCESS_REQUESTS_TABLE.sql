/*
  ============================================================================
  TABLE: access_requests
  ============================================================================
  Main table for early access signups and waitlist registrations
  
  This table stores:
  - User information (email, name, role, company, phone)
  - Professional details (exposure, intended use, experience level)
  - Early access status and launch date
  - UTM tracking parameters
  - Email confirmation status
  ============================================================================
*/

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
DROP FUNCTION IF EXISTS update_updated_at_column();
CREATE FUNCTION update_updated_at_column()
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


