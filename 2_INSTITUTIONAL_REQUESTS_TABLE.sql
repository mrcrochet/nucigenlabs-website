/*
  ============================================================================
  TABLE: institutional_requests
  ============================================================================
  Table for institutional access requests (optional, for enterprise clients)
  
  This table stores:
  - Contact information (name, email, role)
  - Business details (sector, country, capital size)
  - Timeline and interests
  - Review status and notes
  ============================================================================
*/

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


