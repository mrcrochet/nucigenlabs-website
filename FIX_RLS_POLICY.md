# Fix RLS Policy Error - "new row violates row-level security policy"

## Problème

Vous recevez l'erreur : `new row violates row-level security policy for table "access_requests"`

Cela signifie que la politique RLS (Row Level Security) dans Supabase empêche l'insertion de nouvelles lignes.

## Solution Rapide

### Option 1 : Via SQL Editor Supabase (Recommandé)

1. **Allez sur Supabase Dashboard**
   - [supabase.com](https://supabase.com) → Votre projet
   - **SQL Editor** → **New Query**

2. **Exécutez ce script SQL** :

```sql
-- Supprimer les politiques existantes (pour éviter les conflits)
DROP POLICY IF EXISTS "Allow anonymous insert" ON access_requests;
DROP POLICY IF EXISTS "Anyone can submit access requests" ON access_requests;
DROP POLICY IF EXISTS "Users can read own requests" ON access_requests;
DROP POLICY IF EXISTS "Service role full access" ON access_requests;

-- S'assurer que RLS est activé
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Politique 1 : Permettre aux utilisateurs anonymes d'INSÉRER (CRITIQUE)
CREATE POLICY "Allow anonymous insert" ON access_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Politique 2 : Permettre aux utilisateurs authentifiés d'INSÉRER
CREATE POLICY "Allow authenticated insert" ON access_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique 3 : Permettre la lecture pour la récupération d'email
CREATE POLICY "Allow anonymous select by email" ON access_requests
  FOR SELECT
  TO anon
  USING (true);

-- Politique 4 : Permettre aux utilisateurs authentifiés de lire leurs propres requêtes
CREATE POLICY "Users can read own requests" ON access_requests
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'email' = email OR auth.uid()::text = id::text);

-- Politique 5 : Permettre la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Users can update own requests" ON access_requests
  FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'email' = email OR auth.uid()::text = id::text)
  WITH CHECK (auth.jwt()->>'email' = email OR auth.uid()::text = id::text);

-- Politique 6 : Service role a accès complet (pour admin)
CREATE POLICY "Service role full access" ON access_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

3. **Cliquez sur "Run"** (ou `Cmd+Enter` / `Ctrl+Enter`)

4. **Vérifiez que les politiques sont créées** :
   - Allez dans **Authentication** → **Policies**
   - Vous devriez voir les nouvelles politiques pour `access_requests`

### Option 2 : Via Table Editor (Interface Graphique)

1. **Allez sur Supabase Dashboard**
   - **Table Editor** → Sélectionnez `access_requests`

2. **Cliquez sur l'icône "Shield"** (Policies) à côté du nom de la table

3. **Vérifiez les politiques existantes** :
   - Si aucune politique INSERT pour `anon`, créez-en une :
     - **New Policy** → **For INSERT**
     - **Target roles** : `anon`
     - **Policy definition** : `WITH CHECK (true)`

4. **Sauvegardez**

## Vérification

### Test 1 : Vérifier les politiques

Exécutez cette requête dans SQL Editor :

```sql
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'access_requests';
```

Vous devriez voir au moins une politique avec :
- `cmd` = `INSERT`
- `roles` contenant `{anon}` ou `anon`

### Test 2 : Tester l'insertion

Essayez d'insérer une ligne de test (depuis votre application ou directement) :

```sql
-- Test d'insertion (devrait fonctionner maintenant)
INSERT INTO access_requests (email, source_page)
VALUES ('test@example.com', 'test');
```

Si ça fonctionne, supprimez la ligne de test :

```sql
DELETE FROM access_requests WHERE email = 'test@example.com';
```

## Causes Courantes

1. **RLS activé mais aucune politique INSERT** : RLS bloque tout par défaut
2. **Politique existante mais incorrecte** : La politique ne couvre pas `anon` ou a une condition `WITH CHECK` trop restrictive
3. **Conflit de politiques** : Plusieurs politiques avec le même nom ou qui se chevauchent
4. **Table créée sans politique** : La table a été créée manuellement sans les politiques

## Politiques Requises

Pour que le système fonctionne, vous avez besoin de :

✅ **INSERT pour `anon`** : Permet les inscriptions depuis le site web
✅ **INSERT pour `authenticated`** : Permet les mises à jour
✅ **SELECT pour `anon`** : Permet la récupération d'email
✅ **SELECT pour `authenticated`** : Permet aux utilisateurs de voir leurs requêtes
✅ **UPDATE pour `authenticated`** : Permet la mise à jour des informations
✅ **ALL pour `service_role`** : Permet les opérations admin

## Après Correction

1. **Testez sur votre site** : Essayez de vous inscrire
2. **Vérifiez dans Table Editor** : La nouvelle ligne devrait apparaître
3. **Vérifiez les logs** : Plus d'erreur RLS dans la console

## Note Importante

Les politiques RLS sont **cumulatives** (OR logic). Si vous avez plusieurs politiques pour la même opération, l'utilisateur doit satisfaire **au moins une** d'entre elles.

Le fichier `supabase/migrations/20250130000000_fix_rls_policies.sql` contient le script complet à exécuter.

