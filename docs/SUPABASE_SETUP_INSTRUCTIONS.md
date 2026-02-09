# Instructions de Configuration Supabase

## Étape 1 : Accéder au SQL Editor

1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet : `igyrrebxrywokxgmtogl`
4. Dans le menu de gauche, cliquez sur **SQL Editor**

## Étape 2 : Exécuter le script SQL

1. Cliquez sur **New Query** (Nouvelle requête)
2. Copiez-collez le contenu du fichier `supabase_schema.sql`
3. Cliquez sur **Run** (ou appuyez sur `Cmd+Enter` / `Ctrl+Enter`)

## Étape 3 : Vérifier la création

1. Allez dans **Table Editor** dans le menu de gauche
2. Vous devriez voir la table `access_requests`
3. Cliquez dessus pour voir sa structure

## Structure de la table

La table `access_requests` contient :

- **Champs de base** :
  - `id` (UUID, clé primaire)
  - `email` (TEXT, unique, requis)
  - `role`, `company`, `exposure`, `intended_use` (TEXT, optionnels)
  - `status` (TEXT: 'pending', 'approved', 'rejected')
  - `source_page` (TEXT, page d'origine)

- **Champs Early Access** :
  - `early_access` (BOOLEAN, défaut: true)
  - `launch_date` (DATE, défaut: '2025-01-30')
  - `email_sent` (BOOLEAN, défaut: false)
  - `email_sent_at` (TIMESTAMP)

- **Champs UTM Tracking** :
  - `utm_source`, `utm_medium`, `utm_campaign` (TEXT, optionnels)

- **Timestamps** :
  - `created_at` (TIMESTAMP, auto)
  - `updated_at` (TIMESTAMP, auto-mis à jour)

## Sécurité (RLS)

La table est protégée par Row Level Security :

- ✅ **Anonymes** : Peuvent insérer (pour les inscriptions)
- ✅ **Authentifiés** : Peuvent lire leurs propres requêtes
- ✅ **Service Role** : Accès complet (pour admin)

## Vérification

Pour tester que tout fonctionne :

1. Allez sur votre site
2. Remplissez le formulaire "Request Early Access"
3. Vérifiez dans **Table Editor** → `access_requests` qu'une nouvelle ligne apparaît

## Problèmes courants

### Erreur : "relation already exists"
- La table existe déjà, c'est normal
- Vous pouvez ignorer cette erreur ou supprimer la table et la recréer

### Erreur : "permission denied"
- Vérifiez que vous êtes connecté avec le bon compte
- Vérifiez que vous avez les droits administrateur sur le projet

### Erreur : "duplicate key value"
- L'email existe déjà dans la table
- C'est géré par l'application (message d'erreur à l'utilisateur)

## Prochaines étapes

Une fois la table créée :

1. ✅ Configurez Resend pour les emails (voir `EARLY_ACCESS_SETUP.md`)
2. ✅ Ajoutez les variables d'environnement sur Vercel
3. ✅ Testez le formulaire d'inscription

