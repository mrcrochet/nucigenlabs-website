# 🔐 Configuration Complète des Variables d'Environnement Vercel

## 📋 Guide de Configuration

Ce document liste **toutes** les variables d'environnement nécessaires pour déployer l'application sur Vercel, incluant les nouvelles API (EventRegistry, Perplexity, Finnhub).

---

## 🎯 Variables Frontend (VITE_*) - REQUISES

Ces variables sont exposées au navigateur et doivent être préfixées par `VITE_` pour être accessibles dans le code client.

### 1. 🔴 Clerk (Authentification) - PRIORITAIRE

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c21vb3RoLWVlbC0zMy5jbGVyay5hY2NvdW50cy5kZXYk
```

**⚠️ CRITIQUE** : Sans cette variable, l'authentification ne fonctionnera pas et vous aurez l'erreur :
```
useAuth can only be used within ClerkProvider
```

**Où trouver** : [Clerk Dashboard](https://dashboard.clerk.com) → Your Application → API Keys → Publishable Key

---

### 2. 🟢 Supabase (Base de données) - REQUIS

```env
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q
```

**Où trouver** : [Supabase Dashboard](https://app.supabase.com) → Your Project → Settings → API → Project URL & anon public key

---

### 3. 📰 NewsAPI (Optionnel - pour certaines fonctionnalités)

```env
VITE_NEWS_API_KEY=3f496fd50f0040f3a3ebdf569047834c
```

**Où trouver** : [NewsAPI](https://newsapi.org/register) → Get API Key

---

### 4. 🌐 Backend API (Corporate Impact, Signals, Search, etc.) - SI BACKEND DÉPLOYÉ AILLEURS

Sur Vercel, le frontend est servi en statique. Les routes `/api/*` n’existent pas côté Vercel (sauf crons). Pour que les pages **Corporate Impact**, **Signals**, **Search**, etc. chargent les données, il faut déployer le backend (Express) ailleurs (Railway, Render, Fly.io, etc.) et indiquer son URL au frontend :

```env
VITE_API_URL=https://votre-backend.railway.app
```

**Sans cette variable** : en prod, les appels restent relatifs (`/api/...`) et Vercel renvoie la page HTML du SPA au lieu du JSON → erreur « Le service de données est temporairement indisponible » ou « Error Loading Signals ».

**Après ajout** : redéployer le projet Vercel (les variables `VITE_*` sont injectées au build).

---

## 🔧 Variables Backend (Sans VITE_*) - REQUISES

Ces variables sont utilisées uniquement côté serveur et ne doivent **JAMAIS** être exposées au client.

### 1. 🟢 Supabase (Backend) - REQUIS

```env
SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMzNzgwNiwiZXhwIjoyMDgxOTEzODA2fQ.2vcAp_95ZRlwjh777oEah5du3FPyo303YC4oI5umdMQ
```

**⚠️ SÉCURITÉ** : La `SUPABASE_SERVICE_ROLE_KEY` est une clé très sensible qui bypass les RLS. Ne jamais l'exposer au client.

**Où trouver** : [Supabase Dashboard](https://app.supabase.com) → Your Project → Settings → API → service_role key (secret)

---

### 2. 🤖 OpenAI - REQUIS (pour agents et enrichissement)

```env
OPENAI_API_KEY=sk-proj-...
```

**Où trouver** : [OpenAI Platform](https://platform.openai.com/api-keys) → Create new secret key

---

### 3. 🔍 Tavily - REQUIS (pour recherche et collecte de données)

```env
TAVILY_API_KEY=tvly-...
```

**Où trouver** : [Tavily](https://tavily.com) → Dashboard → API Keys

---

### 4. 📊 EventRegistry - REQUIS (pour Discover page)

```env
EVENTREGISTRY_API_KEY=a3c7d296-1a86-44f3-86c9-0cf39e698bce
```

**Où trouver** : [EventRegistry](https://eventregistry.org) → Sign up → API Key

**Note** : Utilisé par `discover-collector.ts` pour ingérer des articles, événements et tendances.

---

### 5. 🧠 Perplexity - REQUIS (pour enrichissement batch Discover)

```env
PERPLEXITY_API_KEY=pplx-...
```

**Où trouver** : [Perplexity API](https://www.perplexity.ai/settings/api) → Generate API Key

**Note** : Utilisé par `discover-enricher.ts` pour générer les "Why it matters" en batch (pas dans le flux utilisateur).

---

### 6. 💹 Finnhub - REQUIS (pour Market Outlook)

```env
FINNHUB_API_KEY=d4ahl8pr01qnehvumlcgd4ahl8pr01qnehvumld0
```

**Où trouver** : [Finnhub](https://finnhub.io/register) → Dashboard → API Key

**Note** : Utilisé pour les données de marché (S&P 500, NASDAQ, Bitcoin, VIX, trending companies).

---

### 7. 📈 Twelve Data - REQUIS (pour données de marché)

```env
TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7
```

**Où trouver** : [Twelve Data](https://twelvedata.com/account/api-keys) → API Keys

---

### 8. 🔥 Firecrawl - OPTIONNEL (pour enrichissement de documents)

```env
FIRECRAWL_API_KEY=fc-...
```

**Où trouver** : [Firecrawl](https://firecrawl.dev) → Dashboard → API Keys

**Note** : Utilisé pour enrichir les événements avec des documents officiels.

---

### 9. 👤 Clerk (Backend) - OPTIONNEL (pour webhooks)

```env
CLERK_SECRET_KEY=sk_test_...
```

**Où trouver** : [Clerk Dashboard](https://dashboard.clerk.com) → Your Application → API Keys → Secret Key

**Note** : Nécessaire uniquement si vous utilisez des webhooks Clerk.

---

### 10. 🚀 API Server Port - OPTIONNEL

```env
API_PORT=3001
```

**Note** : Port par défaut pour le serveur API. Vercel gère automatiquement les ports, mais vous pouvez le définir si nécessaire.

---

### 11. 🐛 Sentry (Monitoring) - OPTIONNEL

```env
VITE_SENTRY_DSN=https://...
```

**Où trouver** : [Sentry](https://sentry.io) → Your Project → Settings → Client Keys (DSN)

---

## 📝 Template Complet pour Vercel

Copiez-collez ce template dans Vercel → Settings → Environment Variables :

### Frontend Variables (Production, Preview, Development)

```env
# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c21vb3RoLWVlbC0zMy5jbGVyay5hY2NvdW50cy5kZXYk

# Supabase
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q

# NewsAPI (Optionnel)
VITE_NEWS_API_KEY=3f496fd50f0040f3a3ebdf569047834c

# Sentry (Optionnel)
VITE_SENTRY_DSN=https://...
```

### Backend Variables (Production, Preview, Development)

```env
# Supabase Backend
SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMzNzgwNiwiZXhwIjoyMDgxOTEzODA2fQ.2vcAp_95ZRlwjh777oEah5du3FPyo303YC4oI5umdMQ

# OpenAI
OPENAI_API_KEY=sk-proj-...

# Tavily
TAVILY_API_KEY=tvly-...

# EventRegistry (Nouvelle API)
EVENTREGISTRY_API_KEY=a3c7d296-1a86-44f3-86c9-0cf39e698bce

# Perplexity (Nouvelle API)
PERPLEXITY_API_KEY=pplx-...

# Finnhub (Nouvelle API)
FINNHUB_API_KEY=d4ahl8pr01qnehvumlcgd4ahl8pr01qnehvumld0

# Twelve Data
TWELVEDATA_API_KEY=353b64f9e9d34f5f908b0450049ed5a7

# Firecrawl (Optionnel)
FIRECRAWL_API_KEY=fc-...

# Clerk Backend (Optionnel)
CLERK_SECRET_KEY=sk_test_...

# API Port (Optionnel)
API_PORT=3001
```

---

## 🚀 Guide de Configuration Étape par Étape

### Étape 1 : Accéder à Vercel Dashboard

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `nucigenlabs-website`
3. Cliquez sur **Settings** (Paramètres)
4. Cliquez sur **Environment Variables** dans le menu latéral

### Étape 2 : Ajouter les Variables Frontend

Pour chaque variable frontend (préfixée `VITE_`) :

1. Cliquez sur **Add New**
2. Remplissez :
   - **Name** : Le nom de la variable (ex: `VITE_CLERK_PUBLISHABLE_KEY`)
   - **Value** : La valeur de la variable
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development** (ou au minimum **Production**)
3. Cliquez sur **Save**

**Variables frontend à ajouter** :
- `VITE_CLERK_PUBLISHABLE_KEY` ⚠️ PRIORITAIRE
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_NEWS_API_KEY` (optionnel)
- `VITE_SENTRY_DSN` (optionnel)

### Étape 3 : Ajouter les Variables Backend

Pour chaque variable backend (sans préfixe `VITE_`) :

1. Cliquez sur **Add New**
2. Remplissez :
   - **Name** : Le nom de la variable (ex: `SUPABASE_SERVICE_ROLE_KEY`)
   - **Value** : La valeur de la variable
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development**
3. Cliquez sur **Save**

**Variables backend à ajouter** :
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ SENSIBLE
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `EVENTREGISTRY_API_KEY` (nouvelle)
- `PERPLEXITY_API_KEY` (nouvelle)
- `FINNHUB_API_KEY` (nouvelle)
- `TWELVEDATA_API_KEY`
- `FIRECRAWL_API_KEY` (optionnel)
- `CLERK_SECRET_KEY` (optionnel)
- `API_PORT` (optionnel)

### Étape 4 : Redéployer

Après avoir ajouté toutes les variables :

1. Allez dans l'onglet **Deployments**
2. Cliquez sur les trois points (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**
4. Ou faites un nouveau commit pour déclencher un nouveau déploiement

---

## ✅ Checklist de Vérification

Avant de déployer, vérifiez que vous avez :

- [ ] `VITE_CLERK_PUBLISHABLE_KEY` (frontend)
- [ ] `VITE_SUPABASE_URL` (frontend)
- [ ] `VITE_SUPABASE_ANON_KEY` (frontend)
- [ ] `SUPABASE_URL` (backend)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (backend)
- [ ] `OPENAI_API_KEY` (backend)
- [ ] `TAVILY_API_KEY` (backend)
- [ ] `EVENTREGISTRY_API_KEY` (backend - nouvelle)
- [ ] `PERPLEXITY_API_KEY` (backend - nouvelle)
- [ ] `FINNHUB_API_KEY` (backend - nouvelle)
- [ ] `TWELVEDATA_API_KEY` (backend)

---

## 🔍 Vérification Post-Déploiement

Après le déploiement, vérifiez :

1. **Page d'accueil** : Se charge correctement
2. **Authentification** : Connexion/inscription fonctionne
3. **Discover Page** : Affiche des résultats (nécessite EventRegistry + Perplexity)
4. **Markets Page** : Affiche les données de marché (nécessite Finnhub + Twelve Data)
5. **Console du navigateur** : Pas d'erreurs liées aux variables d'environnement

---

## 🆘 Dépannage

### Erreur : "useAuth can only be used within ClerkProvider"

**Solution** : Vérifiez que `VITE_CLERK_PUBLISHABLE_KEY` est bien configurée dans Vercel.

### Erreur : "Supabase is not configured"

**Solution** : Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont bien configurées.

### Erreur : "No items found" sur Discover

**Solution** : 
1. Vérifiez que `EVENTREGISTRY_API_KEY` est configurée
2. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est configurée
3. Vérifiez que la migration SQL a été appliquée (voir `DISCOVER_SETUP.md`)
4. Vérifiez que les données ont été collectées (voir `DISCOVER_SETUP.md`)

### Erreur : "API key not configured" sur Markets

**Solution** : Vérifiez que `FINNHUB_API_KEY` et `TWELVEDATA_API_KEY` sont bien configurées.

---

## 📚 Documentation Complémentaire

- [DISCOVER_SETUP.md](./DISCOVER_SETUP.md) - Configuration de la page Discover
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Configuration Supabase détaillée
- [CLERK_CONFIG.md](./CLERK_CONFIG.md) - Configuration Clerk

---

**Dernière mise à jour** : Janvier 2025
**Nouvelles API ajoutées** : EventRegistry, Perplexity, Finnhub
