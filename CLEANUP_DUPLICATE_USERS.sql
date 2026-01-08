-- ============================================
-- NETTOYAGE : Supprimer les utilisateurs en double
-- ============================================
-- ATTENTION: Ce script est à utiliser avec précaution
-- Il identifie et supprime les doublons d'email dans la table users
-- 
-- Exécutez d'abord la requête SELECT pour voir les doublons
-- Puis décidez manuellement lesquels supprimer

-- Étape 1: Identifier les emails en double
SELECT 
  email,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at) as user_ids,
  array_agg(created_at ORDER BY created_at) as created_dates
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Étape 2: Voir les détails des utilisateurs en double
-- (Remplacez 'votre-email@example.com' par l'email concerné)
/*
SELECT 
  id,
  email,
  name,
  role,
  company,
  sector,
  professional_role,
  created_at,
  updated_at
FROM public.users
WHERE email = 'votre-email@example.com'
ORDER BY created_at;
*/

-- Étape 3: Supprimer les doublons (GARDE LE PLUS ANCIEN)
-- ATTENTION: Ne décommentez que si vous êtes sûr de vouloir supprimer
-- Cette requête garde l'utilisateur le plus ancien et supprime les autres
/*
WITH duplicates AS (
  SELECT 
    id,
    email,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at ASC) as rn
  FROM public.users
)
DELETE FROM public.users
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
*/

-- Étape 4: Vérifier qu'il n'y a plus de doublons
SELECT 
  email,
  COUNT(*) as count
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1;

-- Si cette requête ne retourne rien, il n'y a plus de doublons ✅


