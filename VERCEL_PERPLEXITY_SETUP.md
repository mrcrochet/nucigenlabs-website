# Vercel Perplexity Setup - Quick Guide

## ✅ Configuration Perplexity

La clé API Perplexity a été configurée localement. Pour activer Perplexity en production sur Vercel :

### 1. Ajouter la variable d'environnement dans Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `nucigenlabs-website`
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez la variable suivante :

| Key | Value | Environment |
|-----|-------|-------------|
| `PERPLEXITY_API_KEY` | `pplx-YOUR_API_KEY_HERE` | **Production**, Preview, Development |

### 2. Redéployer

Après avoir ajouté la variable :
- Vercel redéploiera automatiquement, OU
- Allez dans **Deployments** → **Redeploy** (dernier déploiement)

## 🧪 Tester Perplexity

### Test en local

1. Assurez-vous que `PERPLEXITY_API_KEY` est dans votre `.env`
2. Démarrez le serveur API : `npm run api:server`
3. Testez le health check :
   ```bash
   curl http://localhost:3001/api/perplexity/health
   ```
4. Vous devriez voir : `{"status":"ok","configured":true,...}`

### Test d'enrichissement de signal

1. Démarrez l'application : `npm run dev`
2. Allez sur `/signals/:id` (une page de détail de signal)
3. Cliquez sur "Enrich with Perplexity"
4. Le composant devrait afficher :
   - Contexte historique
   - Analyse experte
   - Implications marché
   - Citations

### Test en production

1. Déployez sur Vercel avec `PERPLEXITY_API_KEY` configuré
2. Vérifiez le health check : `https://your-domain.vercel.app/api/perplexity/health`
3. Testez l'enrichissement sur un signal en production

## 📊 Vérifier que ça fonctionne

### Health Check

```bash
# Local
curl http://localhost:3001/api/perplexity/health

# Production
curl https://your-domain.vercel.app/api/perplexity/health
```

Réponse attendue :
```json
{
  "status": "ok",
  "configured": true,
  "message": "Perplexity API is configured and working"
}
```

### Test d'enrichissement

1. Ouvrez un signal dans l'application
2. Cliquez sur "Enrich with Perplexity"
3. Attendez quelques secondes
4. Vous devriez voir :
   - Contexte historique
   - Analyse experte
   - Implications marché
   - Citations (liens cliquables)

## 🔍 Ce qui est déjà configuré

- ✅ Service Perplexity (`src/server/services/perplexity-service.ts`)
- ✅ Endpoints API (`/api/perplexity/chat`, `/api/signals/:id/enrich`)
- ✅ Client frontend (`src/lib/api/perplexity-api.ts`)
- ✅ Composant d'enrichissement (`SignalEnrichment.tsx`)
- ✅ Intégration dans `SignalDetailPage`
- ✅ Health check endpoint
- ✅ Gestion des erreurs et rate limiting

## 📝 Documentation complète

Voir `PERPLEXITY_SETUP.md` pour la documentation complète.

## 🚀 Finance Tools (Coming Soon)

Selon la [roadmap Perplexity](https://docs.perplexity.ai/feature-roadmap#finance-tools-integration), les outils suivants seront disponibles prochainement :

- **Market Data Access**: Real-time and historical stock prices
- **Ticker Symbol Lookup**: Intelligent company and symbol resolution
- **Financial Analysis Tools**: Price history, trend analysis, market insights
- **SEC Filing Integration**: Enhanced search and analysis of financial documents

Ces fonctionnalités seront automatiquement disponibles une fois que Perplexity les déploiera. Le code est déjà préparé dans `perplexity-service.ts`.
