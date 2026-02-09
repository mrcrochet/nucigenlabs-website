# Vérification Configuration Clerk

## Checklist de vérification

### 1. Variables d'environnement

Vérifiez que ces variables sont configurées dans Vercel (production) et `.env` (local) :

- [ ] `VITE_CLERK_PUBLISHABLE_KEY` - Clé publique Clerk
- [ ] `CLERK_SECRET_KEY` - Clé secrète (backend uniquement, si nécessaire)

### 2. Redirect URLs

Dans Clerk Dashboard → Settings → Paths :

**Production :**
- [ ] Allowed redirect URLs : `https://votre-domaine.com/auth/callback`
- [ ] Sign-in fallback redirect URL : `https://votre-domaine.com/intelligence`
- [ ] Sign-up fallback redirect URL : `https://votre-domaine.com/onboarding`

**Development :**
- [ ] Allowed redirect URLs : `http://localhost:5173/auth/callback`
- [ ] Sign-in fallback redirect URL : `http://localhost:5173/intelligence`
- [ ] Sign-up fallback redirect URL : `http://localhost:5173/onboarding`

### 3. OAuth Providers (si utilisés)

**Google OAuth :**
- [ ] Google OAuth activé dans Clerk
- [ ] Client ID et Client Secret configurés
- [ ] Authorized redirect URIs incluent Clerk callback URL

**LinkedIn OAuth :**
- [ ] LinkedIn OAuth activé dans Clerk
- [ ] Client ID et Client Secret configurés
- [ ] Authorized redirect URIs incluent Clerk callback URL

### 4. Email Templates (optionnel)

- [ ] Email de bienvenue configuré
- [ ] Email de confirmation configuré
- [ ] Email de reset password configuré

### 5. Test manuel

1. **Inscription email/password :**
   - [ ] Aller sur `/register`
   - [ ] Créer un compte
   - [ ] Vérifier redirection vers `/onboarding`
   - [ ] Vérifier que l'utilisateur est créé dans Supabase

2. **OAuth (si configuré) :**
   - [ ] Tester connexion Google
   - [ ] Tester connexion LinkedIn
   - [ ] Vérifier redirection correcte

3. **Connexion existant :**
   - [ ] Aller sur `/login`
   - [ ] Se connecter avec compte existant
   - [ ] Vérifier redirection vers `/intelligence` (si onboarding complété)
   - [ ] Vérifier redirection vers `/onboarding` (si onboarding incomplet)

4. **Déconnexion :**
   - [ ] Cliquer sur logout
   - [ ] Vérifier redirection vers `/`
   - [ ] Vérifier que la session est supprimée

## Commandes utiles

```bash
# Vérifier variables d'environnement frontend
npm run check-env

# Vérifier variables d'environnement backend
npm run check-env:backend
```

## URLs importantes

- **Clerk Dashboard**: https://dashboard.clerk.com
- **Documentation Clerk**: https://clerk.com/docs

## Notes

- Les redirect URLs doivent correspondre exactement (pas de trailing slash)
- En développement, utilisez `http://localhost:5173`
- En production, utilisez votre domaine complet avec `https://`
