# Configuration Supabase

## Variables d'environnement

Le projet utilise Supabase comme backend. Les variables d'environnement sont configurées dans le fichier `.env`.

### Variables requises

- `VITE_SUPABASE_URL` : L'URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : La clé publique (anon) de Supabase (sûre pour le client)

### Configuration actuelle

```
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## ⚠️ IMPORTANT : Service Role Key

La **Service Role Key** est une clé très sensible qui ne doit **JAMAIS** être utilisée côté client.

### Où utiliser la Service Role Key

La Service Role Key doit uniquement être utilisée dans :
- **Backend sécurisé** (API routes, Edge Functions, etc.)
- **Scripts d'administration** (migrations, seeding, etc.)
- **Environnements serveur** qui ne sont pas exposés au client

### Où NE PAS utiliser la Service Role Key

❌ **NE JAMAIS** l'utiliser dans :
- Code React/TypeScript côté client
- Variables d'environnement exposées au navigateur (VITE_*)
- Fichiers JavaScript/TypeScript compilés pour le client
- Code qui s'exécute dans le navigateur

### Service Role Key (pour backend uniquement)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMzNzgwNiwiZXhwIjoyMDgxOTEzODA2fQ.2vcAp_95ZRlwjh777oEah5du3FPyo303YC4oI5umdMQ
```

## Tables Supabase

Le projet utilise deux tables principales :

### 1. `access_requests`
Pour les demandes d'accès générales des utilisateurs.

### 2. `institutional_requests`
Pour les demandes d'accès institutionnelles.

## Fonctions disponibles

### `submitAccessRequest(data: AccessRequest)`
Soumet une demande d'accès générale.

### `submitInstitutionalRequest(data: InstitutionalRequest)`
Soumet une demande d'accès institutionnelle.

## Sécurité

- Les tables utilisent Row Level Security (RLS)
- Les utilisateurs anonymes peuvent insérer des requêtes
- Les utilisateurs authentifiés peuvent voir leurs propres requêtes
- La clé anon est suffisante pour les opérations client

## Redémarrer le serveur

Après avoir modifié le fichier `.env`, redémarrez le serveur de développement :

```bash
npm run dev
```

