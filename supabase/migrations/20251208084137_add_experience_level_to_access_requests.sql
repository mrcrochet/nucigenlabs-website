/*
  # Add experience_level to access_requests

  1. Changes
    - Add `experience_level` column to `access_requests` table
    - Column is optional (nullable) and stores beginner/intermediate/advanced

  2. Notes
    - This field will be used for the waiting list form
    - Helps segment users by experience for better onboarding
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'access_requests' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE access_requests ADD COLUMN experience_level text;
  END IF;
END $$;
