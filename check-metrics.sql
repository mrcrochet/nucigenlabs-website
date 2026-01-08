-- ============================================================================
-- SCRIPT DE DIAGNOSTIC : MÉTRIQUES RÉELLES NUCIGEN LABS
-- ============================================================================
-- Exécutez ce script dans Supabase SQL Editor pour obtenir les métriques réelles
-- Comparez ces chiffres avec ceux affichés sur le site
-- ============================================================================

-- ============================================================================
-- 1. UTILISATEURS
-- ============================================================================

-- Total utilisateurs inscrits
SELECT 
  'Total Users' as metric,
  COUNT(*) as value
FROM auth.users;

-- Utilisateurs actifs (7 derniers jours)
SELECT 
  'Active Users (7 days)' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE last_sign_in_at > NOW() - INTERVAL '7 days';

-- Utilisateurs actifs (30 derniers jours)
SELECT 
  'Active Users (30 days)' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE last_sign_in_at > NOW() - INTERVAL '30 days'
   OR created_at > NOW() - INTERVAL '30 days';

-- Nouveaux utilisateurs par mois
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_users
FROM auth.users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 6;

-- ============================================================================
-- 2. DEMANDES D'ACCÈS (ACCESS REQUESTS)
-- ============================================================================

-- Total demandes d'accès
SELECT 
  'Total Access Requests' as metric,
  COUNT(*) as value
FROM access_requests;

-- Demandes récentes (7 jours)
SELECT 
  'Access Requests (7 days)' as metric,
  COUNT(*) as value
FROM access_requests 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Demandes récentes (30 jours)
SELECT 
  'Access Requests (30 days)' as metric,
  COUNT(*) as value
FROM access_requests 
WHERE created_at > NOW() - INTERVAL '30 days';

-- Demandes par statut
SELECT 
  status,
  COUNT(*) as count
FROM access_requests
GROUP BY status;

-- Demandes par mois
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as requests
FROM access_requests
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 6;

-- ============================================================================
-- 3. ÉVÉNEMENTS & CONTENU
-- ============================================================================

-- Total événements (si table existe)
SELECT 
  'Total Events' as metric,
  COUNT(*) as value
FROM events
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events');

-- Événements traités (si table existe)
SELECT 
  'Processed Events' as metric,
  COUNT(*) as value
FROM nucigen_events
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nucigen_events');

-- Événements récents (7 jours)
SELECT 
  'Events (7 days)' as metric,
  COUNT(*) as value
FROM events
WHERE created_at > NOW() - INTERVAL '7 days'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events');

-- ============================================================================
-- 4. ENGAGEMENT UTILISATEUR
-- ============================================================================

-- Utilisateurs avec alertes (si table existe)
SELECT 
  'Users with Alerts' as metric,
  COUNT(DISTINCT user_id) as value
FROM user_alerts
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_alerts');

-- Alertes générées (7 jours)
SELECT 
  'Alerts Generated (7 days)' as metric,
  COUNT(*) as value
FROM user_alerts
WHERE created_at > NOW() - INTERVAL '7 days'
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_alerts');

-- ============================================================================
-- 5. CONVERSION RATE
-- ============================================================================

-- Taux de conversion : Access Requests → Users
SELECT 
  'Conversion Rate' as metric,
  ROUND(
    (SELECT COUNT(*)::numeric FROM auth.users) / 
    NULLIF((SELECT COUNT(*)::numeric FROM access_requests), 0) * 100, 
    2
  ) as value,
  '%' as unit;

-- ============================================================================
-- 6. RÉSUMÉ COMPLET
-- ============================================================================

SELECT 
  '=== SUMMARY ===' as section,
  '' as metric,
  '' as value;

SELECT 
  'Users' as category,
  (SELECT COUNT(*) FROM auth.users) as total,
  (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '30 days') as active_30d;

SELECT 
  'Access Requests' as category,
  (SELECT COUNT(*) FROM access_requests) as total,
  (SELECT COUNT(*) FROM access_requests WHERE created_at > NOW() - INTERVAL '30 days') as recent_30d;

-- ============================================================================
-- 7. COMPARAISON AVEC STATS DU SITE
-- ============================================================================

-- Vérifier les écarts entre réalité et affichage
SELECT 
  'Site displays: 500+ Early access requests' as site_display,
  (SELECT COUNT(*) FROM access_requests) as reality,
  CASE 
    WHEN (SELECT COUNT(*) FROM access_requests) >= 500 THEN '✅ Match'
    ELSE '❌ Site overstates'
  END as status;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 
-- 1. Comparez ces chiffres avec ceux affichés sur votre site
-- 2. Si les chiffres réels sont < 20 utilisateurs actifs → RED FLAG
-- 3. Si les chiffres réels sont très différents des stats affichées → Corriger le site
-- 4. Utilisez ces métriques pour la décision de validation rentabilité
--
-- ============================================================================








