# Troubleshooting Live Search - Erreur 500

## 🔍 Problème

L'erreur "Server error: 500 Internal Server Error" apparaît lors de la recherche live sur la page Events.

## ✅ Solutions

### 1. Vérifier que le serveur API est en cours d'exécution

Le serveur API doit être démarré séparément :

```bash
npm run api:server
```

Ou directement :

```bash
npx tsx src/server/api-server.ts
```

Le serveur devrait démarrer sur le port 3001 et afficher :
```
🚀 API Server running on http://localhost:3001
   Live Search: POST http://localhost:3001/live-search
```

### 2. Vérifier les variables d'environnement

Le serveur API nécessite ces variables dans votre `.env` :

```env
# OpenAI (requis pour l'extraction d'événements)
OPENAI_API_KEY=sk-...

# Tavily (requis pour la recherche)
TAVILY_API_KEY=tvly-...

# Supabase (requis pour stocker les événements)
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Vérification** :
```bash
# Vérifier que les variables sont chargées
node -e "require('dotenv').config(); console.log('OPENAI:', !!process.env.OPENAI_API_KEY); console.log('TAVILY:', !!process.env.TAVILY_API_KEY);"
```

### 3. Vérifier les logs du serveur

Quand l'erreur se produit, regardez les logs du serveur API. Ils indiqueront la cause exacte :

- **"Missing required environment variables"** → Vérifiez votre `.env`
- **"Tavily API error"** → Vérifiez votre `TAVILY_API_KEY`
- **"OpenAI API error"** → Vérifiez votre `OPENAI_API_KEY`
- **"Database error"** → Vérifiez votre configuration Supabase

### 4. Tester l'endpoint directement

Testez l'endpoint avec curl :

```bash
curl -X POST http://localhost:3001/live-search \
  -H "Content-Type: application/json" \
  -d '{"query": "china ai chip"}'
```

Si le serveur n'est pas démarré, vous obtiendrez :
```
curl: (7) Failed to connect to localhost port 3001
```

### 5. Vérifier le proxy Vite

Le frontend utilise un proxy Vite pour rediriger `/api/*` vers `http://localhost:3001`. Vérifiez `vite.config.ts` :

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

## 🐛 Messages d'erreur courants

### "Failed to fetch"
**Cause** : Le serveur API n'est pas démarré
**Solution** : `npm run api:server`

### "Configuration error: Missing required environment variables"
**Cause** : Variables d'environnement manquantes
**Solution** : Vérifiez votre `.env` à la racine du projet

### "Tavily API error"
**Cause** : Clé API Tavily invalide ou quota dépassé
**Solution** : Vérifiez votre `TAVILY_API_KEY` sur https://tavily.com

### "OpenAI API error"
**Cause** : Clé API OpenAI invalide ou quota dépassé
**Solution** : Vérifiez votre `OPENAI_API_KEY` sur https://platform.openai.com

### "Database error"
**Cause** : Problème de connexion ou permissions Supabase
**Solution** : Vérifiez `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`

## 📝 Checklist de dépannage

- [ ] Le serveur API est démarré (`npm run api:server`)
- [ ] Le serveur écoute sur le port 3001
- [ ] Les variables d'environnement sont définies dans `.env`
- [ ] Les clés API sont valides (OpenAI, Tavily)
- [ ] La configuration Supabase est correcte
- [ ] Le proxy Vite est configuré correctement
- [ ] Les logs du serveur sont consultés pour plus de détails

## 🔧 Commandes utiles

```bash
# Démarrer le serveur API
npm run api:server

# Vérifier que le serveur répond
curl http://localhost:3001/health

# Tester la recherche live
curl -X POST http://localhost:3001/live-search \
  -H "Content-Type: application/json" \
  -d '{"query": "test query"}'
```

## 💡 Note

Les messages d'erreur ont été améliorés pour être plus descriptifs. Si vous voyez toujours une erreur 500 générique, vérifiez les logs du serveur API pour plus de détails.
