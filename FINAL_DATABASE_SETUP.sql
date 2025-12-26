/*
  ============================================================================
  FINAL DATABASE SETUP - NUCIGEN LABS LANDING PAGE
  ============================================================================
  
  Ce script crée uniquement les tables nécessaires pour le système d'inscription
  utilisant Supabase Auth.
  
  Tables créées:
  1. access_requests - Table principale pour la waitlist et les demandes d'accès
  2. institutional_requests - Table pour les demandes d'accès institutionnelles (optionnel)
  
  Note: La table email_verification_codes n'est plus nécessaire car on utilise
  Supabase Auth qui gère automatiquement la vérification d'email.
  
  ============================================================================
*/

-- ============================================================================
-- TABLE 1: access_requests
-- ============================================================================
-- Table principale pour la waitlist et les demandes d'accès early access

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
COMMENT ON TABLE access_requests IS 'Stores early access signup requests for Nucigen Labs platform. Used for waitlist management.';

-- ============================================================================
-- TABLE 2: institutional_requests (OPTIONNEL)
-- ============================================================================
-- Table pour les demandes d'accès institutionnelles (si vous en avez besoin)

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
-- NOTE: Table email_verification_codes
-- ============================================================================
-- Cette table n'est plus nécessaire car Supabase Auth gère automatiquement
-- la vérification d'email via la table auth.users
--
-- Si vous avez déjà créé cette table, vous pouvez la supprimer avec:
-- DROP TABLE IF EXISTS email_verification_codes CASCADE;
--
-- Mais ce n'est pas obligatoire - vous pouvez simplement l'ignorer.

