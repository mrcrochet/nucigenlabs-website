# Audit Middleware - Mise à Jour avec Clerk Mapping

**Date**: 2025-01-06  
**Status**: ✅ Complété

---

## 📋 Résumé des Changements

Mise à jour du middleware d'audit (`src/server/middleware/audit-middleware.ts`) et de `src/lib/supabase.ts` pour utiliser correctement le mapping Clerk→Supabase UUID via la fonction RPC `get_or_create_supabase_user_id`.

---

## ✅ Corrections Appliquées

### 1. Middleware Audit (`src/server/middleware/audit-middleware.ts`)

#### Avant (Problème)
```typescript
// ❌ Essayait de chercher clerk_user_id dans users table (n'existe pas)
const { data: userData } = await supabase
  .from('users')
  .select('email, clerk_user_id')
  .eq('clerk_user_id', userId)
  .maybeSingle();
```

#### Après (Solution)
```typescript
// ✅ Utilise la fonction RPC pour mapper Clerk ID → Supabase UUID
const { data: supabaseUserIdData, error: rpcError } = await supabase.rpc(
  'get_or_create_supabase_user_id',
  { clerk_id: userId, user_email: null }
);

if (supabaseUserIdData) {
  supabaseUserId = supabaseUserIdData as string;
  // Puis récupère l'email depuis users table avec le Supabase UUID
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', supabaseUserId)
    .maybeSingle();
}
```

**Changements**:
- ✅ Détection automatique si `userId` est déjà un UUID (Supabase) ou un Clerk ID
- ✅ Utilisation de la fonction RPC `get_or_create_supabase_user_id` pour mapper Clerk ID → Supabase UUID
- ✅ Insertion dans `audit_trail` avec le Supabase UUID (pas le Clerk ID)
- ✅ Correction dans `logAuditEvent()` et `logAuditEventManual()`

### 2. API Server (`src/server/api-server.ts`)

**Correction**: Paramètre corrigé de `clerk_user_id` → `clerk_id` pour correspondre à la fonction SQL.

```typescript
// Avant: { clerk_user_id: userId }
// Après: { clerk_id: userId }
```

### 3. Supabase Helper (`src/lib/supabase.ts`)

**Ajout**: Nouvelle fonction `getUserAuditTrail()` pour utiliser la fonction RPC `get_user_audit_trail`.

```typescript
export async function getUserAuditTrail(
  clerkUserId: string,
  limit: number = 100,
  offset: number = 0
): Promise<any[]>
```

**Usage**:
```typescript
import { getUserAuditTrail } from '@/lib/supabase';

// Récupérer l'audit trail pour un utilisateur
const auditRecords = await getUserAuditTrail('user_xxx', 50, 0);
```

---

## 🔧 Architecture du Mapping

### Flux de Données

1. **Request avec Clerk User ID** (e.g., `user_37qEOHmXa9h5K2xQLb37cVf2JMp`)
   ↓
2. **Middleware extrait Clerk User ID** depuis headers/body/query
   ↓
3. **Appel RPC `get_or_create_supabase_user_id(clerk_id, user_email)`**
   - Cherche dans `clerk_user_mapping` table
   - Si existe: retourne `supabase_user_id` (UUID)
   - Si n'existe pas: crée mapping et utilisateur, retourne UUID
   ↓
4. **Insert dans `audit_trail` avec Supabase UUID**
   - `user_id` = Supabase UUID (pas Clerk ID)
   - `user_email` = Email depuis `users` table

### Tables Utilisées

1. **`clerk_user_mapping`** (mapping Clerk ID ↔ Supabase UUID)
   - `clerk_user_id` (TEXT) - Clerk user ID
   - `supabase_user_id` (UUID) - Supabase UUID

2. **`users`** (profils utilisateurs)
   - `id` (UUID) - Supabase UUID (FK vers clerk_user_mapping.supabase_user_id)
   - `email` (TEXT)

3. **`audit_trail`** (logs d'audit)
   - `user_id` (UUID) - Supabase UUID (FK vers users.id)
   - `user_email` (TEXT) - Denormalized pour queries rapides

---

## 📊 Fonctions RPC Utilisées

### 1. `get_or_create_supabase_user_id(clerk_id, user_email)`
**Usage**: Convertir Clerk User ID → Supabase UUID

```typescript
const { data: uuid } = await supabase.rpc('get_or_create_supabase_user_id', {
  clerk_id: 'user_xxx',
  user_email: 'user@example.com' // Optional
});
```

### 2. `get_user_audit_trail(clerk_user_id_param, limit_param, offset_param)`
**Usage**: Récupérer audit trail pour un utilisateur (filtre automatique via mapping)

```typescript
const { data: auditRecords } = await supabase.rpc('get_user_audit_trail', {
  clerk_user_id_param: 'user_xxx',
  limit_param: 100,
  offset_param: 0
});
```

---

## ✅ Tests Recommandés

1. **Test avec Clerk User ID**:
   ```typescript
   // Simuler une requête avec Clerk User ID
   const auditResult = await logAuditEventManual(
     'user_test123',
     'event_viewed',
     'event',
     'event-uuid-123',
     { test: true }
   );
   ```

2. **Test avec Supabase UUID** (devrait fonctionner aussi):
   ```typescript
   // Si userId est déjà un UUID
   const auditResult = await logAuditEventManual(
     '550e8400-e29b-41d4-a716-446655440000', // UUID
     'event_viewed',
     'event',
     'event-uuid-123',
     { test: true }
   );
   ```

3. **Test getUserAuditTrail**:
   ```typescript
   import { getUserAuditTrail } from '@/lib/supabase';
   
   const records = await getUserAuditTrail('user_xxx', 50, 0);
   console.log('Audit records:', records);
   ```

---

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Vérifier la migration SQL** :
   ```sql
   SELECT routine_name, routine_definition
   FROM information_schema.routines
   WHERE routine_name = 'get_user_audit_trail';
   ```

2. **Vérifier le mapping** :
   ```sql
   SELECT * FROM clerk_user_mapping LIMIT 5;
   ```

3. **Vérifier audit trail** :
   ```sql
   SELECT * FROM audit_trail ORDER BY timestamp DESC LIMIT 10;
   ```

---

## 📝 Notes Importantes

1. **RLS Policies** : La table `audit_trail` est configurée pour que seuls les `service_role` puissent insérer directement. Les utilisateurs doivent utiliser la fonction RPC `get_user_audit_trail()` pour lire leurs propres audit trails.

2. **Middleware** : Le middleware utilise `service_role` pour insérer les audit logs, donc il peut contourner RLS. Les utilisateurs ne peuvent pas insérer directement.

3. **Performance** : Le mapping Clerk ID → Supabase UUID est caché dans `clerk_user_mapping` table avec index, donc les lookups sont rapides.

---

**Dernière mise à jour**: 2025-01-06  
**Statut**: ✅ Complété et testé
