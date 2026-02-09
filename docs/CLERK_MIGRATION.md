# 🔐 Migration vers Clerk Authentication

## ✅ Ce qui a été fait

### 1. Installation et configuration
- ✅ Installé `@clerk/clerk-react` (SDK React pour Clerk)
- ✅ Configuré `ClerkProvider` dans `src/main.tsx`
- ✅ Ajouté les variables d'environnement dans `.env.local`
- ✅ Mis à jour `.gitignore` pour exclure `.env.local`

### 2. Pages d'authentification
- ✅ **Login** (`src/pages/Login.tsx`) : Adapté pour utiliser `useSignIn` de Clerk
- ✅ **Register** (`src/pages/Register.tsx`) : Adapté pour utiliser `useSignUp` de Clerk
- ✅ **AuthCallback** (`src/pages/AuthCallback.tsx`) : Adapté pour gérer les callbacks OAuth de Clerk

### 3. Composants
- ✅ **ProtectedRoute** (`src/components/ProtectedRoute.tsx`) : Utilise maintenant `useAuth` de Clerk
- ✅ **PremiumNavigation** (`src/components/PremiumNavigation.tsx`) : Utilise `UserButton` de Clerk et `useAuth`

### 4. Hook personnalisé
- ✅ **useClerkAuth** (`src/hooks/useClerkAuth.ts`) : Hook de compatibilité créé (optionnel, pour migration progressive)

## 📋 Configuration requise

### Variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Important** : 
- Le préfixe `VITE_` est requis pour que Vite expose la variable au frontend
- Les clés sont déjà configurées dans `.env.local` (non commité)

### Configuration Clerk Dashboard

**Instance Clerk configurée :**
- **Application ID**: `app_37o8iuT70oOlSBCTA3xCha2GTAR`
- **Frontend API URL**: `https://smooth-eel-33.clerk.accounts.dev`
- **Backend API URL**: `https://api.clerk.com`
- **JWKS URL**: `https://smooth-eel-33.clerk.accounts.dev/.well-known/jwks.json`

**Actions requises dans Clerk Dashboard :**

1. Allez sur [Clerk Dashboard](https://dashboard.clerk.com)
2. Sélectionnez votre application (smooth-eel-33)
3. Configurez les **Redirect URLs** dans **Settings → Paths** :
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://votre-domaine.com/auth/callback`
4. Activez les providers OAuth souhaités dans **User & Authentication → Social Connections** :
   - Google OAuth
   - LinkedIn OAuth
   - Autres providers selon vos besoins

## 🔄 Différences avec Supabase Auth

### Avant (Supabase)
```typescript
import { useAuth } from '../hooks/useAuth';
const { user, isAuthenticated, logout } = useAuth();
```

### Après (Clerk)
```typescript
import { useAuth, useUser, UserButton } from '@clerk/clerk-react';
const { isSignedIn, signOut } = useAuth();
const { user } = useUser();
```

### Points importants

1. **Hook `useAuth`** : Retourne `isSignedIn` au lieu de `isAuthenticated`
2. **Hook `useUser`** : Nécessaire pour accéder aux données utilisateur
3. **Déconnexion** : Utilise `signOut()` au lieu de `logout()`
4. **Composants** : Clerk fournit `<UserButton />` prêt à l'emploi

## 🔗 Intégration avec Supabase

**Note importante** : Supabase est toujours utilisé pour :
- Stockage des données utilisateur (onboarding, préférences)
- Base de données principale
- Fonctions backend

Pour lier Clerk à Supabase :
1. Utiliser l'ID utilisateur de Clerk (`user.id`) comme clé primaire dans Supabase
2. Créer un trigger ou une fonction pour synchroniser les utilisateurs Clerk avec la table `users` de Supabase

## 🧪 Test

1. **Démarrer l'application** :
   ```bash
   npm run dev
   ```

2. **Tester l'inscription** :
   - Aller sur `/register`
   - Créer un compte avec email/password
   - Vérifier la redirection vers `/onboarding`

3. **Tester la connexion** :
   - Aller sur `/login`
   - Se connecter avec les identifiants créés
   - Vérifier la redirection vers `/dashboard`

4. **Tester OAuth** :
   - Cliquer sur "Google" ou "LinkedIn" dans Login/Register
   - Vérifier le callback et la redirection

## 📝 Prochaines étapes

1. **Synchronisation Supabase** : Créer un webhook Clerk pour synchroniser les utilisateurs avec Supabase
2. **Migration des données** : Migrer les utilisateurs existants de Supabase vers Clerk (si nécessaire)
3. **Tests complets** : Tester tous les flux d'authentification
4. **Documentation** : Mettre à jour la documentation utilisateur

## ⚠️ Notes importantes

- Les clés API sont stockées dans `.env.local` (non commité)
- Le fichier `.env.local.example` contient des placeholders
- Clerk gère automatiquement les sessions et les tokens
- Les callbacks OAuth sont gérés automatiquement par Clerk

## 🔍 Dépannage

### Erreur "Missing VITE_CLERK_PUBLISHABLE_KEY"
- Vérifiez que `.env.local` existe à la racine du projet
- Vérifiez que la variable commence par `VITE_`
- Redémarrez le serveur de développement

### Erreur OAuth callback
- Vérifiez les Redirect URLs dans Clerk Dashboard
- Assurez-vous que l'URL correspond exactement (avec/sans trailing slash)

### Session non persistante
- Clerk gère automatiquement la persistance des sessions
- Vérifiez que `ClerkProvider` enveloppe bien toute l'application

