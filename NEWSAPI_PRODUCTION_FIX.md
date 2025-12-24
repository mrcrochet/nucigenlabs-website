# Fix NewsAPI en Production - Guide

## Problème

NewsAPI a des restrictions CORS qui empêchent les appels directs depuis le navigateur en production. Cela cause :
1. Les news ne s'affichent pas
2. Erreurs CORS dans la console

## Solution Temporaire (Déjà Implémentée)

J'ai ajouté un fallback qui utilise un proxy CORS public (`api.allorigins.win`) si l'appel direct échoue. Cela fonctionne mais n'est **pas idéal pour la production**.

## Solution Recommandée : Proxy Backend

### Option 1 : Vercel Serverless Function (Recommandé)

Créez une fonction serverless sur Vercel pour proxy les requêtes NewsAPI.

#### Étape 1 : Créer le dossier API

```bash
mkdir -p api/news
```

#### Étape 2 : Créer `api/news/index.ts`

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Enable CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  const apiKey = process.env.NEWS_API_KEY || request.query.apiKey as string;
  const category = (request.query.category as string) || 'business';
  const pageSize = (request.query.pageSize as string) || '20';

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

#### Étape 3 : Ajouter la variable d'environnement sur Vercel

1. Allez sur Vercel → Settings → Environment Variables
2. Ajoutez `NEWS_API_KEY` (sans le préfixe `VITE_`)
3. Valeur : votre clé NewsAPI

#### Étape 4 : Modifier le code frontend

Dans `src/lib/newsApi.ts` (à créer) :

```typescript
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const USE_PROXY = import.meta.env.PROD; // Use proxy in production

export async function fetchNews(category = 'business', pageSize = 20) {
  if (USE_PROXY) {
    // Use Vercel serverless function in production
    const response = await fetch(
      `/api/news?category=${category}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`
    );
    return await response.json();
  } else {
    // Direct API call in development
    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`
    );
    return await response.json();
  }
}
```

### Option 2 : Utiliser un Service Proxy Externe

Services comme :
- **CORS Anywhere** (self-hosted)
- **AllOrigins** (déjà utilisé comme fallback)
- **ProxyAPI**

### Option 3 : Backend Dédié

Créez un backend simple (Node.js/Express, Python/Flask, etc.) qui fait les requêtes NewsAPI et les expose via votre propre API.

## Corrections Appliquées

✅ **Liens des articles** : Tous les liens ouvrent maintenant dans un nouvel onglet avec `target="_blank"` et `rel="noopener noreferrer"`

✅ **Gestion CORS** : Fallback automatique vers un proxy CORS si l'appel direct échoue

✅ **LiveNewsFeed** : Les cartes sont maintenant cliquables et ouvrent l'article

✅ **LevelNews** : Les liens fonctionnent correctement

## Test

1. Testez en local : `npm run dev`
2. Vérifiez que les news s'affichent
3. Cliquez sur un lien pour vérifier qu'il ouvre l'article dans un nouvel onglet
4. Déployez sur Vercel et testez en production

## Note Importante

Le proxy CORS public (`api.allorigins.win`) est une solution temporaire. Pour la production, utilisez l'Option 1 (Vercel Serverless Function) pour :
- Meilleure performance
- Contrôle de la clé API (côté serveur)
- Pas de dépendance à un service tiers
- Conformité avec les limites de NewsAPI

