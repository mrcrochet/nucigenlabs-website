# Fix NewsAPI en Production Vercel - Guide Complet

## Problèmes Identifiés

1. **Les news ne s'affichent pas en production** sur Vercel
2. **Les hyperliens ne fonctionnent pas** correctement
3. **Erreurs CORS** avec NewsAPI en production

## Solution Appliquée

### 1. Amélioration de la Logique de Fetch

Le code utilise maintenant **directement le proxy CORS en production** au lieu d'essayer d'abord un appel direct :

```typescript
// En production, utilise directement le proxy CORS
const isProduction = import.meta.env.PROD;
if (isProduction) {
  // Utilise directement api.allorigins.win
  response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`);
}
```

### 2. Correction des Liens

- Tous les liens utilisent maintenant `target="_blank"` et `rel="noopener noreferrer"`
- Double protection avec `window.open()` en fallback
- Les liens sont maintenant cliquables même pendant l'animation de flip

### 3. Variable d'Environnement Vercel

**IMPORTANT** : Assurez-vous que la variable d'environnement est bien configurée sur Vercel :

1. Allez sur **Vercel Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez ou vérifiez :
   - **Name** : `VITE_NEWS_API_KEY`
   - **Value** : `3f496fd50f0040f3a3ebdf569047834c` (ou votre clé)
   - **Environments** : Production, Preview, Development (cochez tous)

3. **Redéployez** après avoir ajouté/modifié la variable :
   - Allez dans **Deployments**
   - Cliquez sur les 3 points (...) du dernier déploiement
   - Sélectionnez **Redeploy**

## Vérification

### 1. Vérifier les Variables d'Environnement

Dans Vercel Dashboard :
- Settings → Environment Variables
- Vérifiez que `VITE_NEWS_API_KEY` est présent
- Vérifiez qu'il est activé pour "Production"

### 2. Vérifier les Logs de Build

Dans Vercel Dashboard :
- Deployments → Cliquez sur le dernier déploiement
- Vérifiez les logs de build pour voir s'il y a des erreurs

### 3. Tester en Production

1. Ouvrez votre site Vercel en production
2. Ouvrez la console du navigateur (F12)
3. Passez la souris sur une carte (Geopolitical, Industrial, etc.)
4. Vérifiez dans la console :
   - S'il y a des erreurs CORS
   - Si les requêtes vers `api.allorigins.win` fonctionnent
   - Si les données sont bien reçues

### 4. Tester les Liens

1. Passez la souris sur une carte pour voir les news
2. Cliquez sur un titre d'article ou l'icône ExternalLink
3. Vérifiez que l'article s'ouvre dans un nouvel onglet

## Solutions Alternatives si le Proxy Ne Fonctionne Pas

### Option 1 : Vercel Serverless Function (Recommandé)

Créez une fonction serverless pour proxy les requêtes :

1. Créez le dossier `api/news/`
2. Créez `api/news/index.ts` :

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const apiKey = process.env.NEWS_API_KEY || request.query.apiKey as string;
  const category = (request.query.category as string) || 'business';
  const pageSize = (request.query.pageSize as string) || '50';

  try {
    const newsResponse = await fetch(
      `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=${pageSize}&apiKey=${apiKey}`
    );
    const data = await newsResponse.json();
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ error: 'Failed to fetch news' });
  }
}
```

3. Ajoutez `NEWS_API_KEY` (sans VITE_) dans Vercel Environment Variables
4. Modifiez le code pour utiliser `/api/news` en production

### Option 2 : Autre Proxy CORS

Si `api.allorigins.win` ne fonctionne pas, essayez :
- `https://cors-anywhere.herokuapp.com/` (peut être limité)
- `https://api.codetabs.com/v1/proxy?quest=`
- Créez votre propre proxy

## Debug

### Console du Navigateur

Ouvrez la console (F12) et cherchez :
- Erreurs CORS
- Erreurs 401/403 (clé API invalide)
- Erreurs 429 (trop de requêtes)
- Erreurs réseau

### Network Tab

Dans l'onglet Network :
- Vérifiez les requêtes vers `api.allorigins.win`
- Vérifiez les réponses (status 200 ?)
- Vérifiez le contenu de la réponse

## Contact

Si le problème persiste après avoir suivi ce guide, vérifiez :
1. Que la clé NewsAPI est valide et active
2. Que vous n'avez pas dépassé les limites de l'API (100 requêtes/jour pour le plan gratuit)
3. Que les variables d'environnement sont bien chargées en production

