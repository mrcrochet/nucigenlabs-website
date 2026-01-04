# 🔍 Live Search - Recherche d'Événements Réels

## 🎯 Fonctionnalité

Permet de rechercher des événements réels dans le monde réel avec Tavily et de créer automatiquement des résumés structurés complets (comme dans l'image fournie).

## 📋 Ce qui est créé automatiquement

Pour chaque recherche, le système crée :

1. **Événement Structuré** (Phase 1)
   - Summary
   - Event Type, Sector, Region
   - Why It Matters
   - Impact Score, Confidence
   - Actors

2. **Causal Chain** (Phase 2B)
   - Cause
   - First-Order Effect
   - Second-Order Effect
   - Time Horizon
   - Affected Sectors & Regions

3. **Historical Context** (Phase 4)
   - Historical Context
   - Similar Past Events (avec URLs)
   - Background Explanation
   - Validation Notes

## 🚀 Setup

### 1. Installer les dépendances

```bash
npm install express cors
npm install --save-dev @types/express @types/cors
```

### 2. Démarrer l'API Server

```bash
npm run api:server
```

L'API server tourne sur `http://localhost:3001`

### 3. Démarrer le frontend

```bash
npm run dev
```

Le proxy Vite redirige `/api/*` vers `http://localhost:3001`

## 🎨 Utilisation dans l'UI

1. Aller sur la page `/events`
2. Utiliser le champ de recherche **"Search Live"** (avec icône Sparkles)
3. Entrer une requête (ex: "Fed interest rate cut", "China trade policy")
4. Cliquer sur "Search Live" ou appuyer sur Enter
5. L'événement est créé automatiquement et vous êtes redirigé vers la page de détail

## 📊 Exemple de Requêtes

- "Fed interest rate reduction 2026"
- "China trade policy changes"
- "EU regulatory changes technology"
- "Oil price impact supply chain"
- "Central bank monetary policy"

## 🔧 Architecture

```
Frontend (Events.tsx)
  ↓ fetch('/api/live-search')
Vite Proxy (/api → localhost:3001)
  ↓
API Server (api-server.ts)
  ↓
Live Event Creator (live-event-creator.ts)
  ↓
1. Tavily Search (20 résultats)
2. OpenAI Extraction (Phase 1)
3. OpenAI Causal Chain (Phase 2B)
4. Tavily Historical Context
5. Insert into Database
```

## 📝 Fichiers

- `src/server/services/live-event-creator.ts` - Service principal
- `src/server/api-server.ts` - API server Express
- `src/server/services/live-search-api.ts` - Script CLI
- `src/pages/Events.tsx` - UI avec bouton "Search Live"
- `vite.config.ts` - Configuration proxy

## ⚙️ Configuration

Variables d'environnement requises :
- `TAVILY_API_KEY`
- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_PORT` (optionnel, default: 3001)

## 🎯 Résultat

Chaque recherche crée un événement complet avec :
- ✅ Summary structuré
- ✅ Causal Chain complète
- ✅ Historical Context
- ✅ Similar Events avec URLs
- ✅ Background & Validation Notes

Exactement comme dans l'image fournie !

---

**Status** : ✅ **IMPLÉMENTATION COMPLÈTE**

