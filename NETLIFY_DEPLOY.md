# Guide de déploiement sur Netlify

## Configuration requise

### 1. Variables d'environnement

Dans le dashboard Netlify, allez dans **Site settings > Environment variables** et ajoutez :

```
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q
VITE_NEWS_API_KEY=3f496fd50f0040f3a3ebdf569047834c
```

⚠️ **Important** : Ne jamais commiter la clé `service_role` dans le code. Elle doit rester secrète.

## Méthodes de déploiement

### Option 1 : Déploiement via Git (Recommandé)

1. **Connecter votre repository Git**
   - Allez sur [netlify.com](https://netlify.com)
   - Cliquez sur "Add new site" > "Import an existing project"
   - Connectez votre repository (GitHub, GitLab, Bitbucket)

2. **Configuration du build**
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
   - Netlify détectera automatiquement le fichier `netlify.toml`

3. **Variables d'environnement**
   - Ajoutez les variables d'environnement dans le dashboard Netlify
   - Ou dans `netlify.toml` (non recommandé pour les clés secrètes)

4. **Déployer**
   - Netlify déploiera automatiquement à chaque push sur la branche principale
   - Vous pouvez configurer des branches de preview pour les PRs

### Option 2 : Déploiement manuel (Drag & Drop)

1. **Build local**
   ```bash
   npm run build
   ```

2. **Déployer**
   - Allez sur [app.netlify.com/drop](https://app.netlify.com/drop)
   - Glissez-déposez le dossier `dist` généré
   - ⚠️ **Note** : Les variables d'environnement doivent être configurées dans le dashboard après le déploiement

### Option 3 : Netlify CLI

1. **Installer Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Se connecter**
   ```bash
   netlify login
   ```

3. **Initialiser le site**
   ```bash
   netlify init
   ```

4. **Déployer**
   ```bash
   netlify deploy --prod
   ```

## Configuration du routing SPA

Le fichier `public/_redirects` et `netlify.toml` sont configurés pour gérer le routing React Router :
- Toutes les routes (`/*`) redirigent vers `/index.html` avec un status 200
- Cela permet au routing côté client de fonctionner correctement

## Vérification post-déploiement

1. ✅ Vérifier que le site se charge correctement
2. ✅ Tester la navigation entre les pages
3. ✅ Vérifier que les API calls fonctionnent (Supabase, NewsAPI)
4. ✅ Tester les formulaires (Access Request, Institutional Request)
5. ✅ Vérifier que les routes dynamiques fonctionnent (`/level/:level`)

## Domaines personnalisés

1. Allez dans **Site settings > Domain management**
2. Cliquez sur "Add custom domain"
3. Suivez les instructions pour configurer votre DNS

## Performance

Netlify optimise automatiquement :
- Compression Gzip/Brotli
- CDN global
- Cache headers
- Asset optimization

## Support

- Documentation Netlify : https://docs.netlify.com
- Support : https://www.netlify.com/support/


