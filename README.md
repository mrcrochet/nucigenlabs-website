# Nucigen Labs Landing Page

Landing page moderne pour Nucigen Labs - Plateforme d'intelligence prédictive pour les marchés financiers.

## 🚀 Technologies

- **React 19** avec TypeScript
- **Vite** pour le build et le développement
- **Tailwind CSS** pour le styling
- **React Router** pour la navigation
- **Supabase** pour le backend (formulaires, base de données)
- **NewsAPI** pour les actualités en temps réel

## 📦 Installation

```bash
npm install
```

## 🛠️ Développement

```bash
npm run dev
```

Le site sera accessible sur `http://localhost:5173`

## 🏗️ Build

```bash
npm run build
```

Le build génère le dossier `dist/` prêt pour le déploiement.

## 🌐 Déploiement sur Netlify

### Configuration automatique

Le projet est configuré pour Netlify avec :
- `netlify.toml` - Configuration du build et des redirects
- `public/_redirects` - Gestion du routing SPA

### Variables d'environnement requises

Dans le dashboard Netlify, configurez :

```
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_NEWS_API_KEY=3f496fd50f0040f3a3ebdf569047834c
```

### Déploiement

1. **Via Git (Recommandé)**
   - Connectez votre repository à Netlify
   - Netlify détectera automatiquement la configuration
   - Les déploiements se feront automatiquement à chaque push

2. **Via Netlify CLI**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod
   ```

3. **Via Drag & Drop**
   - Build local : `npm run build`
   - Glissez-déposez le dossier `dist/` sur [app.netlify.com/drop](https://app.netlify.com/drop)

📖 **Guide détaillé** : Voir [NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md)

## 📁 Structure du projet

```
src/
├── components/      # Composants React réutilisables
├── pages/          # Pages de l'application
├── hooks/          # Hooks React personnalisés
├── lib/            # Utilitaires (Supabase, etc.)
└── index.css       # Styles globaux
```

## 🎨 Design System

- **Couleur principale** : `#E1463E` (Rouge Nucigen)
- **Fond** : `#0A0A0A` (Noir profond)
- **Sections alternées** : Fond sombre (`#0A0A0A`) et fond clair (`#1A1515`)
- **Typographie** : 
  - Titres : Playfair Display (serif)
  - Corps : Inter (sans-serif)

## 🔐 Sécurité

⚠️ **Important** : Ne jamais commiter les clés secrètes (`service_role`). Seule la clé `anon` est utilisée côté client.

## 📝 Scripts disponibles

- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Build de production
- `npm run preview` - Prévisualise le build de production
- `npm run lint` - Vérifie le code avec ESLint
- `npm run typecheck` - Vérifie les types TypeScript

## 📄 Licence

Propriétaire - Nucigen Labs
