# 🔐 Configuration Clerk dans Vercel

## 🚨 Erreur Actuelle

```
VITE_CLERK_PUBLISHABLE_KEY not found. App will run in limited mode.
Uncaught Error: @clerk/clerk-react: useAuth can only be used within the <ClerkProvider /> component.
```

## ✅ Solution : Configurer les Variables d'Environnement dans Vercel

### Étape 1 : Obtenir votre Clé Clerk

1. Aller sur [Clerk Dashboard](https://dashboard.clerk.com)
2. Sélectionner votre application
3. Aller dans **API Keys**
4. Copier la **Publishable Key** (commence par `pk_test_` ou `pk_live_`)

### Étape 2 : Ajouter la Variable dans Vercel

1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner votre projet (`nucigenlabs-website`)
3. Aller dans **Settings** → **Environment Variables**
4. Cliquer sur **Add New**
5. Ajouter :
   - **Name** : `VITE_CLERK_PUBLISHABLE_KEY`
   - **Value** : Votre clé Clerk (ex: `pk_test_c21vb3RoLWVlbC0zMy5jbGVyay5hY2NvdW50cy5kZXYk`)
   - **Environment** : Sélectionner **Production**, **Preview**, et **Development**
6. Cliquer sur **Save**

### Étape 3 : Redéployer

Après avoir ajouté la variable :

1. Vercel va automatiquement redéployer
2. Ou allez dans **Deployments** → Cliquez sur **Redeploy** sur le dernier déploiement

### Étape 4 : Vérifier

Après le redéploiement, vérifiez que :
- Plus d'erreur `VITE_CLERK_PUBLISHABLE_KEY not found`
- Plus d'erreur `useAuth can only be used within ClerkProvider`
- L'authentification fonctionne correctement

## 📋 Variables d'Environnement Requises pour Vercel

### Frontend (Vite)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Backend (si vous avez un serveur API séparé)
```env
CLERK_SECRET_KEY=sk_test_...
TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## 🔍 Vérification

Pour vérifier que les variables sont bien configurées :

1. Aller dans **Settings** → **Environment Variables**
2. Vérifier que `VITE_CLERK_PUBLISHABLE_KEY` est présente
3. Vérifier qu'elle est activée pour **Production**

## 🐛 Dépannage

### L'erreur persiste après configuration

1. **Vérifier le nom de la variable** : Doit être exactement `VITE_CLERK_PUBLISHABLE_KEY`
2. **Vérifier l'environnement** : Doit être activé pour **Production**
3. **Redéployer** : Les variables ne sont chargées qu'au build
4. **Vérifier les logs de build** : Dans Vercel → Deployments → Build Logs

### La variable n'apparaît pas dans le build

- Vercel charge les variables au moment du build
- Si vous ajoutez une variable après le build, il faut redéployer
- Les variables avec préfixe `VITE_` sont exposées au frontend

## 📚 Références

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Clerk Setup Guide](https://clerk.com/docs/quickstarts/nextjs)
