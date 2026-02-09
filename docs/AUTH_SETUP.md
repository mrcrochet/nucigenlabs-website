# 🔐 Configuration de l'Authentification

## ✅ Ce qui a été implémenté

### 1. Système d'authentification complet
- ✅ Login avec email/password
- ✅ Register avec email/password
- ✅ OAuth (Google, LinkedIn, Apple)
- ✅ Routes protégées
- ✅ Dashboard minimal
- ✅ Onboarding post-signup
- ✅ Navigation conditionnelle (Login/Register/Logout)

### 2. Structure de base de données
- ✅ Table `users` avec profil utilisateur
- ✅ Trigger automatique pour créer le profil à l'inscription
- ✅ RLS (Row Level Security) configuré

### 3. Pages créées
- ✅ `/login` - Page de connexion
- ✅ `/register` - Page d'inscription
- ✅ `/app` - Dashboard (protégé)
- ✅ `/onboarding` - Onboarding post-signup (protégé)
- ✅ `/auth/callback` - Callback OAuth

## 📋 Configuration Supabase requise

### 1. Créer la table `users`

Exécutez le script SQL `USERS_TABLE.sql` dans votre Supabase SQL Editor :

```sql
-- Voir USERS_TABLE.sql pour le script complet
```

### 2. Configurer l'authentification dans Supabase

1. Allez sur **Authentication** → **Providers**
2. Activez les providers souhaités :
   - ✅ **Email** (déjà activé par défaut)
   - ✅ **Google** (nécessite configuration OAuth)
   - ✅ **LinkedIn** (nécessite configuration OAuth)
   - ✅ **Apple** (nécessite configuration OAuth)

### 3. Configurer les URLs de redirection

Dans **Authentication** → **URL Configuration** :

- **Site URL** : `https://votre-domaine.com` (ou `http://localhost:5173` pour dev)
- **Redirect URLs** : Ajoutez :
  - `https://votre-domaine.com/auth/callback`
  - `http://localhost:5173/auth/callback`

### 4. Configurer OAuth (optionnel)

#### Google OAuth
1. Créez un projet dans [Google Cloud Console](https://console.cloud.google.com)
2. Activez Google+ API
3. Créez des credentials OAuth 2.0
4. Ajoutez l'URL de callback : `https://votre-projet.supabase.co/auth/v1/callback`
5. Copiez Client ID et Client Secret dans Supabase

#### LinkedIn OAuth
1. Créez une app dans [LinkedIn Developers](https://www.linkedin.com/developers)
2. Ajoutez l'URL de callback : `https://votre-projet.supabase.co/auth/v1/callback`
3. Copiez Client ID et Client Secret dans Supabase

#### Apple OAuth
1. Créez un Service ID dans [Apple Developer](https://developer.apple.com)
2. Configurez les domaines et redirect URLs
3. Copiez les credentials dans Supabase

## 🚀 Flow utilisateur

### Inscription
1. User clique sur "Register" ou "Get Started"
2. Remplit le formulaire (ou utilise OAuth)
3. Redirection vers `/onboarding`
4. Remplit le profil (company, role, sector, etc.)
5. Redirection vers `/app` (dashboard)

### Connexion
1. User clique sur "Login"
2. S'authentifie (email/password ou OAuth)
3. Redirection vers `/app` (ou page d'origine si protégée)

### Navigation
- **Non connecté** : Affiche "Login" et "Register"
- **Connecté** : Affiche "Dashboard" et "Logout"

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers
- `src/pages/Login.tsx` - Page de connexion
- `src/pages/Register.tsx` - Page d'inscription
- `src/pages/Dashboard.tsx` - Dashboard utilisateur
- `src/pages/Onboarding.tsx` - Onboarding post-signup
- `src/pages/AuthCallback.tsx` - Callback OAuth
- `src/hooks/useAuth.ts` - Hook d'authentification
- `src/components/ProtectedRoute.tsx` - Guard de route
- `USERS_TABLE.sql` - Script SQL pour la table users

### Fichiers modifiés
- `src/lib/supabase.ts` - Ajout des fonctions d'authentification
- `src/App.tsx` - Ajout des routes auth et app
- `src/components/PremiumNavigation.tsx` - Navigation conditionnelle
- `src/pages/Home.tsx` - Remplacement du waiting list par Login/Register

## 🔒 Sécurité

- ✅ Row Level Security (RLS) activé sur la table `users`
- ✅ Les utilisateurs ne peuvent lire/modifier que leur propre profil
- ✅ Routes protégées avec `ProtectedRoute`
- ✅ Session gérée par Supabase Auth

## 🧪 Test

1. **Inscription** :
   - Allez sur `/register`
   - Créez un compte
   - Vérifiez la redirection vers `/onboarding`

2. **Connexion** :
   - Allez sur `/login`
   - Connectez-vous
   - Vérifiez la redirection vers `/app`

3. **OAuth** :
   - Testez avec Google/LinkedIn/Apple
   - Vérifiez la redirection après authentification

4. **Protection** :
   - Essayez d'accéder à `/app` sans être connecté
   - Vérifiez la redirection vers `/login`

## ⚠️ Notes importantes

1. **Email confirmation** : Par défaut, Supabase envoie un email de confirmation. Vous pouvez désactiver cela dans les settings si vous voulez un accès immédiat.

2. **Onboarding** : L'onboarding est optionnel. L'utilisateur peut cliquer sur "Skip for now" pour aller directement au dashboard.

3. **Dashboard** : Le dashboard est actuellement un placeholder. Vous pouvez y ajouter vos fonctionnalités.

4. **Waiting List** : Le système de waiting list a été retiré. Les utilisateurs peuvent maintenant s'inscrire directement.

## 🎯 Prochaines étapes

1. ✅ Exécuter `USERS_TABLE.sql` dans Supabase
2. ✅ Configurer les providers OAuth (si nécessaire)
3. ✅ Tester l'inscription et la connexion
4. ✅ Personnaliser le dashboard avec vos fonctionnalités
5. ✅ Ajouter des fonctionnalités à l'application

