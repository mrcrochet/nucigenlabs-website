/*
  ============================================================================
  CLEANUP: Supprimer la table email_verification_codes
  ============================================================================
  
  Ce script supprime la table email_verification_codes qui n'est plus utilisée
  depuis qu'on utilise Supabase Auth pour la vérification d'email.
  
  ⚠️ ATTENTION: Ce script supprime définitivement la table et toutes ses données.
  Exécutez-le seulement si vous êtes sûr de ne plus avoir besoin de cette table.
  
  ============================================================================
*/

-- Supprimer les fonctions liées (si elles existent)
DROP FUNCTION IF EXISTS cleanup_expired_verification_codes();
DROP FUNCTION IF EXISTS get_active_code_count(TEXT);
DROP FUNCTION IF EXISTS cleanup_old_verified_codes();

-- Supprimer la table et toutes ses dépendances
DROP TABLE IF EXISTS email_verification_codes CASCADE;

-- Vérification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'email_verification_codes'
  ) THEN
    RAISE NOTICE '❌ La table email_verification_codes existe encore';
  ELSE
    RAISE NOTICE '✅ La table email_verification_codes a été supprimée avec succès';
  END IF;
END $$;

