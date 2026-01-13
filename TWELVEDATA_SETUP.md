# 🔑 Configuration Twelve Data API

## Vue d'Ensemble

Le projet utilise **Twelve Data** pour récupérer les données de marché en temps réel. Les endpoints `/api/market-data` utilisent déjà le service Twelve Data.

## ✅ Configuration Actuelle

### Service Technique
- **Fichier** : `src/server/services/twelvedata-service.ts`
- **Fonctions disponibles** :
  - `getRealTimePrice(symbol)` - Prix temps réel
  - `getTimeSeries(symbol, options)` - Données historiques
  - `getForexRates(base, symbols)` - Taux de change
  - `getCryptoPrice(symbol)` - Prix crypto
  - `getCommodityPrice(symbol)` - Prix commodities

### Endpoints API
- `GET /api/market-data/:symbol` - Prix temps réel
- `GET /api/market-data/:symbol/timeseries` - Données historiques

## 🔧 Configuration de la Clé API

### Étape 1 : Obtenir une Clé API Twelve Data

1. Aller sur [https://twelvedata.com/](https://twelvedata.com/)
2. Créer un compte (gratuit jusqu'à 800 requêtes/jour)
3. Obtenir votre clé API depuis le dashboard

### Étape 2 : Ajouter la Clé dans `.env`

Ajouter cette ligne dans votre fichier `.env` à la racine du projet :

```env
# Twelve Data API
TWELVEDATA_API_KEY=votre_cle_api_ici
```

### Étape 3 : Vérifier la Configuration

Exécuter le script de vérification :

```bash
node check-env.js
```

Ou vérifier manuellement que la clé est chargée :

```bash
# Dans le terminal
echo $TWELVEDATA_API_KEY
```

### Étape 4 : Redémarrer le Serveur API

Après avoir ajouté la clé API, redémarrer le serveur :

```bash
# Arrêter le serveur actuel (Ctrl+C)
# Puis redémarrer
npm run api:server
# ou
npx tsx src/server/api-server.ts
```

## 🧪 Test de la Configuration

### Test 1 : Vérifier que la Clé est Chargée

Le service vérifie automatiquement la présence de la clé. Si elle n'est pas configurée, vous verrez cette erreur :

```
Error: TWELVEDATA_API_KEY not configured
```

### Test 2 : Tester un Endpoint

```bash
# Test prix temps réel
curl http://localhost:3001/api/market-data/AAPL

# Test time series
curl http://localhost:3001/api/market-data/AAPL/timeseries?interval=1day&days=30
```

### Test 3 : Vérifier dans le Navigateur

1. Aller sur `/markets` dans l'application
2. Sélectionner un symbole (ex: AAPL, TSLA, MSFT)
3. Vérifier que les données de marché s'affichent correctement

## 📊 Utilisation dans les Composants

Les composants suivants utilisent déjà Twelve Data :

- **`MarketsPage`** (`src/pages/MarketsPage.tsx`)
  - Utilise `/api/market-data/:symbol` pour les stats
  - Utilise `/api/market-data/:symbol/timeseries` pour les graphiques

- **`AssetDetailPage`** (`src/pages/AssetDetailPage.tsx`)
  - Affiche les données détaillées d'un actif

- **`MainMarketChart`** (`src/components/markets/MainMarketChart.tsx`)
  - Affiche les graphiques de prix

- **`PriceChartWithMarkers`** (`src/components/markets/PriceChartWithMarkers.tsx`)
  - Graphique avec marqueurs d'événements

## 🔒 Sécurité

### Variables d'Environnement

⚠️ **IMPORTANT** : Ne jamais commiter la clé API dans Git !

- ✅ Ajouter `.env` dans `.gitignore`
- ✅ Utiliser des variables d'environnement pour la production (Vercel, etc.)
- ❌ Ne jamais hardcoder la clé dans le code

### Rate Limiting

Le service inclut un rate limiting automatique :
- **Free tier** : 8 requêtes/seconde
- **Délai entre requêtes** : 125ms
- **Retry logic** : 3 tentatives avec backoff exponentiel

## 🐛 Dépannage

### Erreur : "TWELVEDATA_API_KEY not configured"

**Solution** :
1. Vérifier que `.env` contient `TWELVEDATA_API_KEY=...`
2. Redémarrer le serveur API
3. Vérifier que le chemin du `.env` est correct (racine du projet)

### Erreur : "Twelve Data API error: 429"

**Cause** : Rate limit dépassé (free tier = 800 req/jour)

**Solution** :
- Attendre quelques minutes
- Vérifier votre usage sur le dashboard Twelve Data
- Considérer upgrade vers un plan payant si nécessaire

### Erreur : "Twelve Data API error: Invalid API key"

**Solution** :
1. Vérifier que la clé est correcte dans `.env`
2. Vérifier qu'il n'y a pas d'espaces avant/après la clé
3. Vérifier que la clé est active sur le dashboard Twelve Data

### Les Données ne S'affichent Pas

**Vérifications** :
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs réseau dans l'onglet Network
3. Vérifier les logs du serveur API
4. Tester directement l'endpoint avec `curl` ou Postman

## 📚 Documentation Twelve Data

- **Documentation API** : [https://twelvedata.com/docs](https://twelvedata.com/docs)
- **Endpoints disponibles** : Price, Time Series, Exchange Rate, etc.
- **Limites** : Voir votre plan sur le dashboard

## ✅ Checklist de Configuration

- [ ] Clé API obtenue depuis twelvedata.com
- [ ] `TWELVEDATA_API_KEY` ajouté dans `.env`
- [ ] Serveur API redémarré
- [ ] Test réussi avec `curl` ou dans le navigateur
- [ ] Données de marché s'affichent sur `/markets`
- [ ] Graphiques fonctionnent sur `/markets/:symbol`
