# 🔧 Configuration OAuth Server - Correction

## ❌ Erreur rencontrée

```
Failed to update OAuth server settings: OAUTH_SERVER_AUTHORIZATION_PATH must be a valid URL path starting with "/"
```

## 🔍 Problème identifié

Le champ **"Authorization Path"** dans Supabase OAuth Server attend un **chemin relatif** (comme `/auth/authorize`), pas une **URL complète** (comme `https://nucigenlabs-website-uxn9.vercel.app/`).

## ✅ Solution

### Configuration correcte dans Supabase Dashboard

1. **Allez sur** : Supabase Dashboard → **Authentication** → **OAuth Server (BETA)**

2. **Configurez les champs suivants** :

   #### **Site URL**
   ```
   http://localhost:3000
   ```
   (ou votre URL de production : `https://votre-domaine.com`)

   #### **Authorization Path** ⚠️ IMPORTANT
   ```
   /auth/authorize
   ```
   **Note** : Ce doit être un **chemin relatif** commençant par `/`, pas une URL complète.

   Exemples valides :
   - ✅ `/auth/authorize`
   - ✅ `/oauth/authorize`
   - ✅ `/authorize`
   
   Exemples invalides :
   - ❌ `https://nucigenlabs-website-uxn9.vercel.app/`
   - ❌ `http://localhost:3000/auth/authorize`
   - ❌ `nucigenlabs-website-uxn9.vercel.app/auth/authorize`

3. **Cliquez sur "Save changes"**

## 📝 Explication

- **Site URL** : L'URL de base de votre application (utilisée pour construire les URLs complètes)
- **Authorization Path** : Le chemin relatif où votre application gère l'autorisation OAuth

Quand Supabase construit l'URL d'autorisation complète, il combine :
- **Site URL** + **Authorization Path** = URL complète

Exemple :
- Site URL : `https://nucigenlabs-website-uxn9.vercel.app`
- Authorization Path : `/auth/authorize`
- URL complète : `https://nucigenlabs-website-uxn9.vercel.app/auth/authorize`

## 🎯 Configuration recommandée

Pour votre projet Nucigen Labs :

### En développement :
- **Site URL** : `http://localhost:5173`
- **Authorization Path** : `/auth/authorize`

### En production :
- **Site URL** : `https://nucigenlabs-website-uxn9.vercel.app` (ou votre domaine)
- **Authorization Path** : `/auth/authorize`

## ⚠️ Note importante

Si vous utilisez l'OAuth Server de Supabase, vous devrez créer une page `/auth/authorize` dans votre application React qui gère le flux d'autorisation OAuth.

Cette page doit :
1. Afficher un écran de consentement
2. Demander à l'utilisateur d'autoriser l'application
3. Rediriger vers le callback avec le code d'autorisation

## 🔄 Alternative : Désactiver OAuth Server

Si vous n'utilisez pas l'OAuth Server de Supabase (vous utilisez seulement Google/LinkedIn OAuth), vous pouvez :

1. **Désactiver** le toggle **"Enable the Supabase OAuth Server"**
2. **Cliquez sur "Save changes"**

Cela évitera cette erreur et n'affectera pas votre authentification Google/LinkedIn.

