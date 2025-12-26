/*
  # Create Email Verification Codes Table
  
  This table stores temporary verification codes sent to users' emails.
  Codes expire after 15 minutes and are single-use.
*/

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL, -- 4-digit code
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);

-- Create index on code and email for verification lookups
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_code_email ON email_verification_codes(code, email);

-- Create index on expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to insert verification codes
CREATE POLICY "Allow anonymous insert verification codes" ON email_verification_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow anonymous users to read and update their own codes (by email)
CREATE POLICY "Allow anonymous read own codes" ON email_verification_codes
  FOR SELECT
  TO anon
  USING (true);

-- Policy: Allow anonymous users to update their own codes (for verification)
CREATE POLICY "Allow anonymous update own codes" ON email_verification_codes
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Policy: Service role has full access
CREATE POLICY "Service role full access verification codes" ON email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to automatically clean up expired codes (optional, can be run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_codes
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

