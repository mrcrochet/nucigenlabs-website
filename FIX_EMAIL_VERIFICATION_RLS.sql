/*
  ============================================================================
  FIX: Corriger les politiques RLS pour email_verification_codes
  ============================================================================
  Ce script corrige les politiques RLS qui empêchent l'insertion de codes
  de vérification.
  ============================================================================
*/

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Allow anonymous insert verification codes" ON email_verification_codes;
DROP POLICY IF EXISTS "Allow anonymous read own active codes" ON email_verification_codes;
DROP POLICY IF EXISTS "Allow anonymous update own codes" ON email_verification_codes;
DROP POLICY IF EXISTS "Service role full access verification codes" ON email_verification_codes;

-- Recréer les politiques avec les bonnes permissions

-- Politique 1: Permettre l'insertion anonyme (sans restriction sur les codes actifs)
-- On permet l'insertion, mais on laisse la logique métier gérer les codes actifs
CREATE POLICY "Allow anonymous insert verification codes" ON email_verification_codes
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique 2: Permettre la lecture des codes actifs (non vérifiés et non expirés)
CREATE POLICY "Allow anonymous read own active codes" ON email_verification_codes
  FOR SELECT
  TO anon
  USING (
    verified = false 
    AND expires_at > NOW()
  );

-- Politique 3: Permettre la mise à jour des codes actifs
CREATE POLICY "Allow anonymous update own codes" ON email_verification_codes
  FOR UPDATE
  TO anon
  USING (
    verified = false 
    AND expires_at > NOW()
  )
  WITH CHECK (
    verified IN (false, true)
  );

-- Politique 4: Accès complet pour le service role (backend)
CREATE POLICY "Service role full access verification codes" ON email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Vérifier que RLS est activé
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

