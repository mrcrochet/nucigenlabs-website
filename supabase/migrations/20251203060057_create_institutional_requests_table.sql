/*
  # Create Institutional Requests Table

  1. New Tables
    - `institutional_requests`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text, not null) - Contact name
      - `email` (text, unique, not null) - Institutional email
      - `role` (text) - Position/role
      - `sector` (text) - Business sector (fund, VC, mining, energy, defense, etc.)
      - `country` (text) - Operating country
      - `capital_size` (text) - Capital range
      - `timeline` (text) - Expected deployment timeline
      - `interests` (text) - Areas of interest
      - `status` (text, default 'pending') - Request status: pending, shortlisted, approved, rejected
      - `created_at` (timestamptz, default now()) - Submission timestamp
      - `reviewed_at` (timestamptz) - Review timestamp
      - `notes` (text) - Internal notes

  2. Security
    - Enable RLS on `institutional_requests` table
    - Add policy for inserting new requests (public access)
    - Add policy for reading own requests (authenticated users)

  3. Indexes
    - Index on email for fast lookups
    - Index on status for filtering
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS institutional_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text,
  sector text,
  country text,
  capital_size text,
  timeline text,
  interests text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'shortlisted', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  notes text
);

ALTER TABLE institutional_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit institutional requests"
  ON institutional_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own institutional requests"
  ON institutional_requests
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'email' = email);

CREATE INDEX IF NOT EXISTS idx_institutional_requests_email ON institutional_requests(email);
CREATE INDEX IF NOT EXISTS idx_institutional_requests_status ON institutional_requests(status);
CREATE INDEX IF NOT EXISTS idx_institutional_requests_created_at ON institutional_requests(created_at DESC);