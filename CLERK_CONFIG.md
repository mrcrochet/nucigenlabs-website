# 🔐 Configuration Clerk - Informations Complètes

## 📋 Identifiants de l'Application

- **Application ID**: `app_37o8iuT70oOlSBCTA3xCha2GTAR`
- **Publishable Key**: `pk_test_c21vb3RoLWVlbC0zMy5jbGVyay5hY2NvdW50cy5kZXYk`
- **Secret Key**: `sk_test_DVJ1dZJpGqW8zz63eHCboKtQEIStbZKmoPdQGvaQI1`

## 🌐 URLs de l'Instance

- **Frontend API URL**: `https://smooth-eel-33.clerk.accounts.dev`
- **Backend API URL**: `https://api.clerk.com`
- **JWKS URL**: `https://smooth-eel-33.clerk.accounts.dev/.well-known/jwks.json`

## 🔑 Utilisation des Identifiants

### Frontend (React)
- **Nécessaire**: `VITE_CLERK_PUBLISHABLE_KEY` (déjà configuré dans `.env.local`)
- **Non nécessaire**: Application ID, Secret Key (backend uniquement)

### Backend (API Server)
- **Nécessaire**: `CLERK_SECRET_KEY` (pour authentifier les requêtes API)
- **Utile**: `CLERK_APPLICATION_ID` (pour identifier l'application dans les webhooks)

### Webhooks
- **Nécessaire**: `CLERK_SECRET_KEY` (pour vérifier la signature des webhooks)
- **Utile**: `CLERK_APPLICATION_ID` (pour filtrer les événements par application)

## 📝 Configuration Actuelle

### Variables d'environnement (`.env.local`)
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c21vb3RoLWVlbC0zMy5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_DVJ1dZJpGqW8zz63eHCboKtQEIStbZKmoPdQGvaQI1
# CLERK_APPLICATION_ID=app_37o8iuT70oOlSBCTA3xCha2GTAR  # Optionnel, pour référence
```

## 🔗 Liens Utiles

- **Dashboard Clerk**: https://dashboard.clerk.com
- **Documentation Clerk**: https://clerk.com/docs
- **API Reference**: https://clerk.com/docs/reference/backend-api

## ⚙️ Configuration Requise dans Clerk Dashboard

### Redirect URLs
1. Allez sur [Clerk Dashboard](https://dashboard.clerk.com)
2. Sélectionnez votre application (`app_37o8iuT70oOlSBCTA3xCha2GTAR`)
3. Allez dans **Settings → Paths**
4. Ajoutez :
   - `http://localhost:5173/auth/callback` (Development)
   - `https://votre-domaine.com/auth/callback` (Production)

### Webhooks (Optionnel - pour synchronisation Supabase)
Si vous souhaitez synchroniser les utilisateurs Clerk avec Supabase :

1. Allez dans **Webhooks** dans Clerk Dashboard
2. Créez un nouveau webhook endpoint
3. URL: `https://votre-domaine.com/api/webhooks/clerk` (ou votre endpoint)
4. Sélectionnez les événements :
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Utilisez `CLERK_SECRET_KEY` pour vérifier la signature

## 🔒 Sécurité

- ✅ `.env.local` est dans `.gitignore` (non commité)
- ✅ Seule la Publishable Key est exposée au frontend (sécurisée)
- ✅ Secret Key uniquement utilisée côté backend
- ⚠️ Ne jamais commiter les clés dans le code source

## 📚 Documentation Associée

- `CLERK_MIGRATION.md` - Guide de migration complet
- `CLERK_SETUP_CHECKLIST.md` - Checklist de configuration
- `CLERK_CONFIG.md` - Ce fichier (informations de configuration)

