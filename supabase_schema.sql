-- Create access_requests table for early access signups
CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT,
  company TEXT,
  exposure TEXT,
  intended_use TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source_page TEXT,
  
  -- Early access fields
  early_access BOOLEAN DEFAULT true,
  launch_date DATE DEFAULT '2025-01-30',
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

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);

-- Create index on early_access for filtering early access users
CREATE INDEX IF NOT EXISTS idx_access_requests_early_access ON access_requests(early_access);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON access_requests(created_at DESC);

-- Enable Row Level Security
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert (for signups)
CREATE POLICY "Allow anonymous insert" ON access_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own requests
CREATE POLICY "Users can read own requests" ON access_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Policy: Allow service role to do everything (for admin operations)
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
$$ language 'plpgsql';

-- Trigger to update updated_at on row update
CREATE TRIGGER update_access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE access_requests IS 'Stores early access signup requests for Nucigen Labs platform';

