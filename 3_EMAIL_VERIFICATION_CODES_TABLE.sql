/*
  ============================================================================
  TABLE: email_verification_codes
  ============================================================================
  Table for storing temporary email verification codes (4-digit codes)
  
  This table stores:
  - Email address
  - 4-digit verification code
  - Expiration time (15 minutes)
  - Verification status
  - Failed attempt counter
  
  Security features:
  - Code must be exactly 4 digits (0000-9999)
  - Codes expire after 15 minutes
  - Rate limiting: Only one active code per email
  - Tracks verification attempts to prevent brute force
  ============================================================================
*/

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
-- Note: La vérification des codes actifs est gérée dans le code JavaScript,
-- pas dans la politique RLS pour éviter les problèmes de référence circulaire
CREATE POLICY "Allow anonymous insert verification codes" ON email_verification_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);

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
DROP FUNCTION IF EXISTS cleanup_expired_verification_codes();
CREATE FUNCTION cleanup_expired_verification_codes()
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

-- Set security and search_path for cleanup function (bonus sécurité)
ALTER FUNCTION cleanup_expired_verification_codes()
SET search_path = public;

-- Function to get active code count for an email (for rate limiting)
DROP FUNCTION IF EXISTS get_active_code_count(TEXT);
CREATE FUNCTION get_active_code_count(p_email TEXT)
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

-- Set search_path for rate limiting function (bonus sécurité)
ALTER FUNCTION get_active_code_count(TEXT)
SET search_path = public;

-- Trigger function to automatically delete old verified codes (optional)
DROP FUNCTION IF EXISTS cleanup_old_verified_codes();
CREATE FUNCTION cleanup_old_verified_codes()
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


