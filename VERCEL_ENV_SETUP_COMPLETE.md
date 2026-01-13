# 🔐 Configuration Complète des Variables d'Environnement Vercel

## 📋 Toutes les Variables Requises

### 🔴 Frontend (Vite) - REQUISES

Ces variables doivent être configurées dans **Vercel → Settings → Environment Variables** :

#### 1. Clerk (Authentification) - PRIORITAIRE
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c21vb3RoLWVlbC0zMy5jbGVyay5hY2NvdW50cy5kZXYk
```
**⚠️ SANS CETTE VARIABLE** : Erreur `useAuth can only be used within ClerkProvider`

#### 2. Supabase (Base de données)
```env
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q
```

#### 3. NewsAPI (Optionnel)
```env
VITE_NEWS_API_KEY=3f496fd50f0040f3a3ebdf569047834c
```

### 🟡 Backend (API Server) - Si vous avez un serveur API séparé

Ces variables sont nécessaires si vous déployez le serveur API (`src/server/api-server.ts`) séparément :

#### 1. Twelve Data (Données de marché)
```env
TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7
```
**⚠️ SANS CETTE VARIABLE** : Les pages `/markets` afficheront des erreurs "API key not configured"

#### 2. Clerk (Backend)
```env
CLERK_SECRET_KEY=sk_test_DVJ1dZJpGqW8zz63eHCboKtQEIStbZKmoPdQGvaQI1
```

#### 3. Supabase (Backend)
```env
SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ... (votre service role key)
```

## 🚀 Guide de Configuration Rapide

### Étape 1 : Aller dans Vercel Dashboard

1. [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet `nucigenlabs-website`
3. **Settings** → **Environment Variables**

### Étape 2 : Ajouter les Variables Frontend

Pour chaque variable ci-dessous :

1. Cliquer sur **Add New**
2. Remplir :
   - **Name** : Le nom de la variable (ex: `VITE_CLERK_PUBLISHABLE_KEY`)
   - **Value** : La valeur (voir ci-dessus)
   - **Environments** : ✅ Production ✅ Preview ✅ Development
3. Cliquer sur **Save**

**Variables à ajouter (dans l'ordre de priorité) :**

1. ✅ `VITE_CLERK_PUBLISHABLE_KEY` (🔴 PRIORITAIRE)
2. ✅ `VITE_SUPABASE_URL`
3. ✅ `VITE_SUPABASE_ANON_KEY`
4. ✅ `VITE_NEWS_API_KEY` (optionnel)

### Étape 3 : Variables Backend (si serveur API séparé)

Si vous déployez le serveur API séparément sur Vercel ou Railway :

1. ✅ `TWELVEDATA_API_KEY` (🔴 REQUIS pour `/markets`)
2. ✅ `CLERK_SECRET_KEY`
3. ✅ `SUPABASE_URL`
4. ✅ `SUPABASE_SERVICE_ROLE_KEY`

### Étape 4 : Redéployer

Après avoir ajouté les variables :

1. Aller dans **Deployments**
2. Cliquer sur **⋯** (3 points) sur le dernier déploiement
3. Sélectionner **Redeploy**

## ✅ Vérification

### Vérifier que les Variables sont Configurées

1. **Dans Vercel** : Settings → Environment Variables
2. Vérifier que toutes les variables sont présentes
3. Vérifier qu'elles sont activées pour **Production**

### Tester l'Application

1. **Clerk** : Aller sur `/login` - Devrait fonctionner sans erreur
2. **Supabase** : Se connecter - Devrait fonctionner
3. **Twelve Data** : Aller sur `/markets` - Devrait afficher les données (ou un message d'erreur clair si la clé n'est pas configurée)

### Health Check

Si votre serveur API est déployé, tester :

```bash
# Health check général
curl https://votre-api.vercel.app/health

# Health check Twelve Data
curl https://votre-api.vercel.app/health/twelvedata
```

## 🐛 Dépannage

### Erreur : "useAuth can only be used within ClerkProvider"

**Cause** : `VITE_CLERK_PUBLISHABLE_KEY` n'est pas configurée dans Vercel

**Solution** : Voir `QUICK_FIX_CLERK_VERCEL.md`

### Erreur : "Twelve Data API key not configured"

**Cause** : `TWELVEDATA_API_KEY` n'est pas configurée (backend)

**Solution** : 
1. Si le serveur API est sur Vercel : Ajouter `TWELVEDATA_API_KEY` dans les variables d'environnement
2. Si le serveur API est local : Ajouter dans `.env` local et redémarrer

### Les Variables ne Sont Pas Chargées

1. **Vérifier le nom exact** : Sensible à la casse
2. **Vérifier les environnements** : Doit être activé pour **Production**
3. **Redéployer** : Les variables ne sont chargées qu'au build
4. **Vérifier les logs de build** : Vercel → Deployments → Build Logs

## 📚 Documentation par Service

- **Clerk** : `QUICK_FIX_CLERK_VERCEL.md` ou `VERCEL_ENV_SETUP_CLERK.md`
- **Twelve Data** : `TWELVEDATA_SETUP.md` ou `TROUBLESHOOTING_TWELVEDATA.md`
- **Supabase** : `ENV_SETUP.md`

## 🎯 Checklist Complète

### Frontend (Vercel)
- [ ] `VITE_CLERK_PUBLISHABLE_KEY` configurée
- [ ] `VITE_SUPABASE_URL` configurée
- [ ] `VITE_SUPABASE_ANON_KEY` configurée
- [ ] `VITE_NEWS_API_KEY` configurée (optionnel)

### Backend (si séparé)
- [ ] `TWELVEDATA_API_KEY` configurée
- [ ] `CLERK_SECRET_KEY` configurée
- [ ] `SUPABASE_URL` configurée
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurée

### Vérification
- [ ] Redéploiement effectué
- [ ] Plus d'erreur Clerk dans la console
- [ ] Plus d'erreur Twelve Data dans `/markets`
- [ ] Authentification fonctionne
