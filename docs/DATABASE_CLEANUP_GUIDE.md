# 🗄️ Guide de Nettoyage des Tables SQL

## 📋 Résumé des changements

Avec le passage à **Supabase Auth**, voici ce qui a changé au niveau des tables SQL :

### ✅ **Tables à GARDER** (toujours utilisées)

1. **`access_requests`** ✅
   - **Usage** : Table principale pour la waitlist et les demandes d'accès early access
   - **Statut** : **NÉCESSAIRE** - Toujours utilisée
   - **Fonction** : Stocke les emails, noms, et informations des utilisateurs qui s'inscrivent

2. **`institutional_requests`** ✅ (optionnel)
   - **Usage** : Table pour les demandes d'accès institutionnelles
   - **Statut** : **OPTIONNEL** - Gardez-la si vous l'utilisez
   - **Fonction** : Stocke les demandes d'accès pour les clients institutionnels

### ❌ **Table à SUPPRIMER** (plus utilisée)

3. **`email_verification_codes`** ❌
   - **Usage** : Anciennement utilisée pour stocker les codes de vérification à 4 chiffres
   - **Statut** : **PLUS NÉCESSAIRE** - Supabase Auth gère maintenant la vérification
   - **Action** : Vous pouvez la supprimer (optionnel, mais recommandé pour nettoyer)

---

## 🔧 Scripts SQL disponibles

### 1. **FINAL_DATABASE_SETUP.sql** ✅ (RECOMMANDÉ)

Ce script crée uniquement les tables nécessaires :
- ✅ `access_requests` (avec toutes les politiques RLS)
- ✅ `institutional_requests` (optionnel)
- ❌ Ne crée PAS `email_verification_codes`

**Quand l'utiliser :**
- Si vous créez une nouvelle base de données
- Si vous voulez réinitialiser complètement
- Si vous voulez un setup propre

**Comment l'utiliser :**
1. Allez sur Supabase SQL Editor
2. Copiez-collez le contenu de `FINAL_DATABASE_SETUP.sql`
3. Exécutez le script

---

### 2. **CLEANUP_EMAIL_VERIFICATION_TABLE.sql** 🗑️ (OPTIONNEL)

Ce script supprime la table `email_verification_codes` et ses fonctions associées.

**Quand l'utiliser :**
- Si vous avez déjà créé `email_verification_codes` et voulez la supprimer
- Pour nettoyer votre base de données

**⚠️ ATTENTION :**
- Ce script supprime définitivement la table et toutes ses données
- Exécutez-le seulement si vous êtes sûr de ne plus en avoir besoin

**Comment l'utiliser :**
1. Allez sur Supabase SQL Editor
2. Copiez-collez le contenu de `CLEANUP_EMAIL_VERIFICATION_TABLE.sql`
3. Exécutez le script
4. Vérifiez que la table a bien été supprimée

---

## 📊 État actuel de votre base de données

### Tables Supabase Auth (gérées automatiquement)

Supabase crée automatiquement ces tables pour l'authentification :
- `auth.users` - Stocke les utilisateurs authentifiés
- `auth.sessions` - Gère les sessions
- `auth.refresh_tokens` - Gère les tokens de rafraîchissement

**Vous n'avez RIEN à faire** - Supabase les gère automatiquement.

### Tables personnalisées (à créer/maintenir)

| Table | Statut | Action requise |
|-------|--------|----------------|
| `access_requests` | ✅ Nécessaire | Garder / Créer avec `FINAL_DATABASE_SETUP.sql` |
| `institutional_requests` | ⚠️ Optionnel | Garder si utilisée, sinon supprimer |
| `email_verification_codes` | ❌ Plus nécessaire | Supprimer avec `CLEANUP_EMAIL_VERIFICATION_TABLE.sql` |

---

## 🎯 Recommandations

### Si vous partez de zéro :
1. ✅ Exécutez `FINAL_DATABASE_SETUP.sql`
2. ✅ C'est tout ! Vous avez tout ce qu'il faut

### Si vous avez déjà une base de données :
1. ✅ Vérifiez que `access_requests` existe (si non, créez-la avec `FINAL_DATABASE_SETUP.sql`)
2. ⚠️ Vérifiez si vous utilisez `institutional_requests` (gardez-la si oui)
3. ❌ Supprimez `email_verification_codes` avec `CLEANUP_EMAIL_VERIFICATION_TABLE.sql` (optionnel mais recommandé)

---

## 🔍 Vérification

Pour vérifier quelles tables existent dans votre base de données :

```sql
-- Lister toutes les tables personnalisées
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Pour vérifier si `email_verification_codes` existe :

```sql
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_name = 'email_verification_codes'
);
```

---

## 📝 Résumé

**Ce qu'il faut faire :**

1. ✅ **Garder** `access_requests` - Table principale pour la waitlist
2. ⚠️ **Garder** `institutional_requests` - Si vous l'utilisez
3. ❌ **Supprimer** `email_verification_codes` - Plus nécessaire (optionnel)

**Scripts à utiliser :**

- `FINAL_DATABASE_SETUP.sql` - Pour créer les tables nécessaires
- `CLEANUP_EMAIL_VERIFICATION_TABLE.sql` - Pour supprimer l'ancienne table (optionnel)

**C'est tout !** 🎉

