# Déploiement via GitHub

## ✅ Code poussé sur GitHub

Le code a été poussé avec succès sur :
**https://github.com/mrcrochet/nucigenlabs-landingpage**

Branche actuelle : `a11y-seo-perf`

## 🚀 Options de déploiement

### Option 1 : Déploiement automatique via Netlify (Recommandé)

1. **Connecter GitHub à Netlify**
   - Allez sur [netlify.com](https://netlify.com)
   - Cliquez sur "Add new site" > "Import an existing project"
   - Sélectionnez "GitHub"
   - Autorisez Netlify à accéder à votre repository
   - Sélectionnez `nucigenlabs-landingpage`

2. **Configuration automatique**
   - Netlify détectera automatiquement :
     - Build command : `npm run build`
     - Publish directory : `dist`
     - Configuration : `netlify.toml`

3. **Variables d'environnement**
   - Dans Netlify Dashboard > Site settings > Environment variables
   - Ajoutez :
     ```
     VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     VITE_NEWS_API_KEY=3f496fd50f0040f3a3ebdf569047834c
     ```

4. **Déploiement automatique**
   - Chaque push sur la branche principale déclenchera un déploiement
   - Les Pull Requests génèrent des previews automatiques

### Option 2 : GitHub Actions + Netlify CLI

Un workflow GitHub Actions est disponible dans `.github/workflows/netlify-deploy.yml`

**Configuration requise :**

1. **Secrets GitHub** (Settings > Secrets and variables > Actions)
   - `NETLIFY_AUTH_TOKEN` : Token d'authentification Netlify
     - Obtenez-le via : `netlify login` puis `netlify auth:token`
   - `NETLIFY_SITE_ID` : ID de votre site Netlify
     - Trouvé dans Site settings > General > Site details
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_NEWS_API_KEY`

2. **Activation**
   - Le workflow se déclenche automatiquement à chaque push
   - Voir les logs dans l'onglet "Actions" de GitHub

### Option 3 : GitHub Pages (Alternative)

Si vous préférez GitHub Pages au lieu de Netlify :

1. **Modifier `vite.config.ts`** :
   ```typescript
   export default defineConfig({
     plugins: [react()],
     base: '/nucigenlabs-landingpage/', // Nom de votre repo
     // ...
   });
   ```

2. **Créer un workflow GitHub Actions** :
   - Voir exemple dans `.github/workflows/github-pages.yml` (à créer)

3. **Activer GitHub Pages** :
   - Settings > Pages > Source : GitHub Actions

## 📝 Commandes Git utiles

```bash
# Voir l'état
git status

# Ajouter des changements
git add .

# Commiter
git commit -m "Description des changements"

# Pousser sur GitHub
git push origin a11y-seo-perf

# Créer une nouvelle branche
git checkout -b nom-de-la-branche

# Fusionner dans main
git checkout main
git merge a11y-seo-perf
git push origin main
```

## 🔗 Liens utiles

- **Repository** : https://github.com/mrcrochet/nucigenlabs-landingpage
- **Netlify Dashboard** : https://app.netlify.com
- **GitHub Actions** : https://github.com/mrcrochet/nucigenlabs-landingpage/actions

## ⚠️ Note importante

Il y a un avertissement concernant un gros fichier (`.next/dev/cache/...`). Pour l'éviter à l'avenir :

1. Vérifiez que `.next/` est dans `.gitignore`
2. Si nécessaire, utilisez Git LFS pour les gros fichiers

