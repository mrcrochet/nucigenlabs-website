# 🔒 Fix: Isolation des Données par Utilisateur

## Problème Identifié

Les utilisateurs voyaient les événements personnalisés d'autres utilisateurs car la fonction SQL `search_nucigen_events` ne filtrait pas par `user_id`. Tous les événements (généraux + personnalisés) étaient retournés pour tous les utilisateurs.

## Solution Implémentée

### 1. Migration SQL (`FIX_USER_DATA_ISOLATION.sql`)

Modification des fonctions SQL pour filtrer les événements personnalisés :

- **`search_nucigen_events`** : Ajout d'un paramètre `user_id` (UUID) optionnel
- **`count_nucigen_events_search`** : Ajout d'un paramètre `user_id` (UUID) optionnel

**Logique de filtrage :**
- ✅ Événements généraux (sans `source_event_id` ou `source` non personnalisé) : visibles par tous
- ✅ Événements personnalisés avec `source = 'tavily:personalized:${user_id}'` : visibles uniquement par cet utilisateur
- ❌ Événements personnalisés d'autres utilisateurs : exclus

### 2. Code TypeScript (`src/lib/supabase.ts`)

Mise à jour de :
- `searchEvents()` : Passe maintenant `user_id` à la fonction RPC
- `countSearchResults()` : Passe maintenant `user_id` à la fonction RPC

## 📋 Instructions d'Application

### Étape 1 : Appliquer la Migration SQL

1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier le contenu de `FIX_USER_DATA_ISOLATION.sql`
3. Exécuter le script SQL
4. Vérifier que les fonctions ont été mises à jour :
   ```sql
   SELECT routine_name, routine_definition 
   FROM information_schema.routines 
   WHERE routine_name IN ('search_nucigen_events', 'count_nucigen_events_search');
   ```

### Étape 2 : Vérifier le Code TypeScript

Le code TypeScript a déjà été mis à jour. Vérifier que :
- `src/lib/supabase.ts` passe `user_id: targetUserId` aux fonctions RPC
- Les fonctions `searchEvents()` et `countSearchResults()` reçoivent bien le `userId` en paramètre

### Étape 3 : Tester

1. **Créer un nouveau compte** (ou utiliser un compte de test)
2. **Compléter l'onboarding** pour générer des événements personnalisés
3. **Vérifier que seuls les événements de cet utilisateur apparaissent** :
   - Aller sur `/intelligence`
   - Aller sur `/events-feed`
   - Aller sur `/signals-feed`
4. **Créer un deuxième compte** et vérifier qu'il ne voit pas les événements du premier compte

## 🔍 Vérification

Pour vérifier que le filtrage fonctionne, exécuter cette requête SQL dans Supabase :

```sql
-- Remplacer 'YOUR_USER_UUID' par l'UUID d'un utilisateur de test
SELECT 
  ne.id,
  ne.summary,
  e.source,
  CASE 
    WHEN e.source LIKE 'tavily:personalized:%' THEN 'Personalized'
    ELSE 'General'
  END as event_type
FROM nucigen_events ne
LEFT JOIN events e ON e.id = ne.source_event_id
WHERE e.source LIKE 'tavily:personalized:%'
LIMIT 10;
```

Puis tester la fonction avec et sans `user_id` :

```sql
-- Sans user_id : devrait retourner tous les événements généraux + personnalisés
SELECT COUNT(*) FROM search_nucigen_events();

-- Avec user_id : devrait retourner seulement les événements généraux + ceux de cet utilisateur
SELECT COUNT(*) FROM search_nucigen_events(user_id := 'YOUR_USER_UUID'::UUID);
```

## ✅ Résultat Attendu

- Chaque utilisateur voit uniquement :
  - Les événements généraux (non personnalisés)
  - Ses propres événements personnalisés (`tavily:personalized:${user_id}`)
- Les événements personnalisés d'autres utilisateurs sont exclus
- Les performances ne sont pas impactées (index existants sur `source`)

## 🐛 Dépannage

Si les événements personnalisés n'apparaissent toujours pas :

1. **Vérifier que les événements ont bien `source = 'tavily:personalized:${user_id}'`** :
   ```sql
   SELECT id, source FROM events 
   WHERE source LIKE 'tavily:personalized:%' 
   LIMIT 5;
   ```

2. **Vérifier que `nucigen_events.source_event_id` pointe vers ces événements** :
   ```sql
   SELECT ne.id, ne.source_event_id, e.source
   FROM nucigen_events ne
   JOIN events e ON e.id = ne.source_event_id
   WHERE e.source LIKE 'tavily:personalized:%'
   LIMIT 5;
   ```

3. **Vérifier que `getOrCreateSupabaseUserId()` retourne bien l'UUID Supabase** (pas le Clerk ID)

4. **Vérifier les logs du navigateur** pour voir si `user_id` est bien passé aux fonctions RPC
