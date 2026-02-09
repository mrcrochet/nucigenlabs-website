# ⚡ Fix Rapide : Erreur Clerk dans Vercel

## 🚨 Erreur

```
VITE_CLERK_PUBLISHABLE_KEY not found
Uncaught Error: useAuth can only be used within the <ClerkProvider /> component
```

## ✅ Solution Rapide (2 minutes)

### Étape 1 : Aller dans Vercel Dashboard

1. Ouvrir [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet `nucigenlabs-website`
3. Aller dans **Settings** → **Environment Variables**

### Étape 2 : Ajouter la Variable

Cliquer sur **Add New** et remplir :

- **Name** : `VITE_CLERK_PUBLISHABLE_KEY`
- **Value** : `pk_test_c21vb3RoLWVlbC0zMy5jbGVyay5hY2NvdW50cy5kZXYk`
- **Environments** : ✅ Production ✅ Preview ✅ Development
- Cliquer sur **Save**

### Étape 3 : Redéployer

1. Aller dans **Deployments**
2. Cliquer sur **⋯** (3 points) sur le dernier déploiement
3. Sélectionner **Redeploy**

### Étape 4 : Vérifier

Après le redéploiement (2-3 minutes), vérifier que :
- ✅ Plus d'erreur dans la console
- ✅ L'authentification fonctionne
- ✅ Les pages protégées s'affichent

## 📋 Toutes les Variables Requises

Assurez-vous d'avoir **toutes** ces variables dans Vercel :

1. ✅ `VITE_CLERK_PUBLISHABLE_KEY` (🔴 PRIORITAIRE)
2. ✅ `VITE_SUPABASE_URL`
3. ✅ `VITE_SUPABASE_ANON_KEY`
4. ✅ `VITE_NEWS_API_KEY` (optionnel)

## 🐛 Si ça ne marche toujours pas

1. **Vérifier le nom exact** : `VITE_CLERK_PUBLISHABLE_KEY` (sensible à la casse)
2. **Vérifier les environnements** : Doit être activé pour **Production**
3. **Vérifier les logs de build** : Vercel → Deployments → Build Logs
4. **Attendre le redéploiement complet** : Peut prendre 2-3 minutes

## 📚 Documentation Complète

Voir `VERCEL_ENV_SETUP_CLERK.md` pour plus de détails.
