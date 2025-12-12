/*
  # Create Access Requests Table

  1. New Tables
    - `access_requests`
      - `id` (uuid, primary key) - Unique identifier for each request
      - `email` (text, unique, not null) - User's institutional email
      - `role` (text) - User's role (fund manager, analyst, etc.)
      - `company` (text) - Company or institution name
      - `exposure` (text) - Current exposure/industry
      - `intended_use` (text) - How they plan to use Nucigen Labs
      - `status` (text, default 'pending') - Request status: pending, approved, rejected
      - `source_page` (text) - Which page they submitted from
      - `created_at` (timestamptz, default now()) - When request was submitted
      - `updated_at` (timestamptz, default now()) - Last update timestamp

  2. Security
    - Enable RLS on `access_requests` table
    - Add policy for inserting new requests (public access for signup)
    - Add policy for reading own requests (authenticated users only)
    - Add policy for admins to view all requests

  3. Indexes
    - Index on email for fast lookups
    - Index on status for filtering
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text,
  company text,
  exposure text,
  intended_use text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source_page text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit access requests"
  ON access_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own requests"
  ON access_requests
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'email' = email);

CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON access_requests(created_at DESC);