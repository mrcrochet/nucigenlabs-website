# Vercel Sentry Setup - Quick Guide

## ✅ Configuration Sentry

Le DSN Sentry a été configuré localement. Pour activer Sentry en production sur Vercel :

### 1. Ajouter la variable d'environnement dans Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet `nucigenlabs-website`
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez la variable suivante :

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SENTRY_DSN` | `https://74e9705b4a3f0cf95eb07f24951d4969@o4510710769254400.ingest.us.sentry.io/4510711154147328` | **Production**, Preview, Development |

### 2. (Optionnel) Activer le debug en développement

Pour tester Sentry en local ou en preview, ajoutez :

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SENTRY_DEBUG` | `true` | Development, Preview |
| `VITE_SENTRY_DEBUG` | `false` | Production |

### 3. Redéployer

Après avoir ajouté les variables :
- Vercel redéploiera automatiquement, OU
- Allez dans **Deployments** → **Redeploy** (dernier déploiement)

## 🧪 Tester Sentry

### Test en local (avec debug activé)

1. Assurez-vous que `VITE_SENTRY_DEBUG=true` dans votre `.env`
2. Démarrez le serveur : `npm run dev`
3. Ouvrez la console du navigateur
4. Vous devriez voir : `✅ Sentry initialized for development`
5. Pour tester une erreur, ajoutez temporairement dans un composant :
   ```typescript
   import { captureException } from '../lib/sentry';
   // ...
   captureException(new Error('Test error from Sentry'));
   ```

### Test en production

1. Déployez sur Vercel avec `VITE_SENTRY_DSN` configuré
2. Allez sur votre site en production
3. Ouvrez la console → vous devriez voir : `✅ Sentry initialized for production`
4. Vérifiez dans [Sentry Dashboard](https://sentry.io) → votre projet → **Issues**

## 📊 Vérifier que ça fonctionne

1. Allez sur [Sentry Dashboard](https://sentry.io)
2. Sélectionnez votre projet
3. Naviguez vers **Issues** pour voir les erreurs capturées
4. Naviguez vers **Performance** pour voir les traces de performance

## 🔍 Ce qui est déjà configuré

- ✅ Initialisation automatique au démarrage de l'app
- ✅ Synchronisation automatique de l'utilisateur Clerk
- ✅ Capture automatique des erreurs React (ErrorBoundary)
- ✅ Capture automatique des erreurs via `error-tracker.ts`
- ✅ Performance monitoring (10% en prod, 100% en dev)
- ✅ Session Replay (si activé dans Sentry)
- ✅ Filtrage des erreurs non pertinentes

## 📝 Documentation complète

Voir `SENTRY_SETUP.md` pour la documentation complète.
