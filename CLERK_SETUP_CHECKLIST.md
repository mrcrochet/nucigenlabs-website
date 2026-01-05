# ✅ Checklist de Configuration Clerk

## Configuration des Variables d'Environnement

- [x] Fichier `.env.local` créé à la racine du projet
- [x] `VITE_CLERK_PUBLISHABLE_KEY` configuré (avec préfixe `VITE_`)
- [x] `CLERK_SECRET_KEY` configuré
- [x] Fichier `.env.local` ajouté à `.gitignore`

**Valeurs configurées :**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c21vb3RoLWVlbC0zMy5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_DVJ1dZJpGqW8zz63eHCboKtQEIStbZKmoPdQGvaQI1
```

## Configuration Clerk Dashboard

### URLs de l'instance
- **Application ID**: `app_37o8iuT70oOlSBCTA3xCha2GTAR`
- **Frontend API URL**: `https://smooth-eel-33.clerk.accounts.dev`
- **Backend API URL**: `https://api.clerk.com`
- **JWKS URL**: `https://smooth-eel-33.clerk.accounts.dev/.well-known/jwks.json`

### Redirect URLs à configurer
- [ ] **Development**: `http://localhost:5173/auth/callback`
- [ ] **Production**: `https://votre-domaine.com/auth/callback`

**Où configurer :**
1. Allez sur [Clerk Dashboard](https://dashboard.clerk.com)
2. Sélectionnez votre application
3. Allez dans **Settings → Paths**
4. Ajoutez les URLs ci-dessus dans **Redirect URLs**

### Providers OAuth
- [ ] Google OAuth activé et configuré
- [ ] LinkedIn OAuth activé et configuré
- [ ] Autres providers selon vos besoins

**Où configurer :**
1. Allez dans **User & Authentication → Social Connections**
2. Activez les providers souhaités
3. Configurez les Client IDs et Secrets pour chaque provider

## Tests à effectuer

### Test d'inscription
- [ ] Aller sur `/register`
- [ ] Créer un compte avec email/password
- [ ] Vérifier la redirection vers `/onboarding`
- [ ] Vérifier que l'utilisateur apparaît dans Clerk Dashboard

### Test de connexion
- [ ] Aller sur `/login`
- [ ] Se connecter avec les identifiants créés
- [ ] Vérifier la redirection vers `/dashboard`
- [ ] Vérifier que le `UserButton` s'affiche dans la navigation

### Test OAuth
- [ ] Cliquer sur "Google" dans Login/Register
- [ ] Compléter le flux OAuth
- [ ] Vérifier le callback et la redirection
- [ ] Vérifier que l'utilisateur est créé dans Clerk

### Test des routes protégées
- [ ] Essayer d'accéder à `/dashboard` sans être connecté
- [ ] Vérifier la redirection vers `/login`
- [ ] Se connecter et vérifier l'accès à `/dashboard`

## Intégration Supabase

### Synchronisation des utilisateurs
- [ ] Créer un webhook Clerk pour synchroniser avec Supabase (optionnel)
- [ ] Adapter la table `users` pour utiliser l'ID Clerk comme clé primaire
- [ ] Tester que `hasCompletedOnboarding()` fonctionne avec l'ID Clerk

**Note :** La fonction `hasCompletedOnboarding()` a été adaptée pour accepter l'ID utilisateur Clerk en paramètre optionnel.

## Dépannage

### Erreur "Missing VITE_CLERK_PUBLISHABLE_KEY"
- [ ] Vérifier que `.env.local` existe à la racine
- [ ] Vérifier que la variable commence par `VITE_`
- [ ] Redémarrer le serveur de développement

### Erreur OAuth callback
- [ ] Vérifier les Redirect URLs dans Clerk Dashboard
- [ ] Vérifier que l'URL correspond exactement (avec/sans trailing slash)
- [ ] Vérifier que le provider OAuth est activé

### Session non persistante
- [ ] Vérifier que `ClerkProvider` enveloppe bien toute l'application dans `main.tsx`
- [ ] Vérifier que les cookies sont autorisés dans le navigateur

## Documentation

- [x] `CLERK_MIGRATION.md` créé avec la documentation complète
- [x] `CLERK_SETUP_CHECKLIST.md` créé (ce fichier)
- [x] `.env.local.example` créé avec des placeholders

## Prochaines étapes

1. **Configurer les Redirect URLs** dans Clerk Dashboard
2. **Tester l'authentification** complète (inscription, connexion, OAuth)
3. **Configurer la synchronisation Supabase** (si nécessaire)
4. **Mettre à jour la documentation utilisateur** avec les nouvelles instructions

