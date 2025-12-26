/*
  ============================================================================
  ADD NAME COLUMN TO access_requests
  ============================================================================
  This script adds the 'name' column to the access_requests table if it doesn't exist.
  ============================================================================
*/

-- Add name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'access_requests' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE access_requests 
    ADD COLUMN name TEXT;
    
    RAISE NOTICE '✅ Column "name" added successfully to access_requests';
  ELSE
    RAISE NOTICE 'ℹ️  Column "name" already exists in access_requests';
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN access_requests.name IS 'User name (optional)';

