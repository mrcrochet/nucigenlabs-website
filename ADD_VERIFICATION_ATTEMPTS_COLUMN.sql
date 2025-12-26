/*
  ============================================================================
  MIGRATION: Add verification_attempts column to email_verification_codes
  ============================================================================
  This script adds the missing verification_attempts column to the existing
  email_verification_codes table.
  
  Run this script if you get the error:
  "column verification_attempts of relation email_verification_codes does not exist"
  ============================================================================
*/

-- Add verification_attempts column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'email_verification_codes' 
    AND column_name = 'verification_attempts'
  ) THEN
    ALTER TABLE email_verification_codes 
    ADD COLUMN verification_attempts INTEGER DEFAULT 0;
    
    RAISE NOTICE 'Column verification_attempts added successfully';
  ELSE
    RAISE NOTICE 'Column verification_attempts already exists';
  END IF;
END $$;

-- Update comment for the column
COMMENT ON COLUMN email_verification_codes.verification_attempts IS 'Number of failed verification attempts for this code';

