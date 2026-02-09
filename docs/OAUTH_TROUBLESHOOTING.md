# 🔧 Dépannage OAuth - Erreur "provider is not enabled"

## ❌ Erreur rencontrée

```
code: 400
error_code: "validation_failed"
msg: "Unsupported provider: provider is not enabled"
```

## 🔍 Causes possibles

Cette erreur signifie que le provider OAuth n'est **pas activé** dans Supabase, même si les credentials sont configurés.

## ✅ Solutions étape par étape

### 1. Vérifier que les providers sont ACTIVÉS dans Supabase

**⚠️ IMPORTANT** : Avoir les credentials configurés ne suffit pas. Il faut **activer le toggle**.

#### Pour Google :

1. Allez dans **Supabase Dashboard** → **Authentication** → **Providers**
2. Cliquez sur **Google**
3. **VÉRIFIEZ** que le toggle **"Enable Sign in with Google"** est **ON** (vert) ✅
4. Si le toggle est OFF (blanc), **activez-le**
5. Vérifiez que les champs sont remplis :
   - **Client IDs** : Votre Google Client ID
   - **Client Secret (for OAuth)** : Votre Google Client Secret
6. Cliquez sur **Save**

#### Pour LinkedIn :

1. Allez dans **Supabase Dashboard** → **Authentication** → **Providers**
2. Cliquez sur **LinkedIn (OIDC)**
3. **VÉRIFIEZ** que le toggle **"LinkedIn enabled"** est **ON** (vert) ✅
4. Si le toggle est OFF (blanc), **activez-le**
5. Vérifiez que les champs sont remplis :
   - **API Key** : Votre LinkedIn Client ID
   - **API Secret Key** : Votre LinkedIn Client Secret
6. Cliquez sur **Save**

### 2. Vérifier les Callback URLs dans Supabase

1. Allez dans **Authentication** → **URL Configuration**
2. Vérifiez que **Redirect URLs** contient :
   ```
   http://localhost:5173/auth/callback
   https://votre-domaine.com/auth/callback
   ```
3. **Site URL** doit être configuré :
   - Développement : `http://localhost:5173`
   - Production : `https://votre-domaine.com`

### 3. Vérifier les Callback URLs dans les providers OAuth

#### Google Cloud Console :

1. Allez dans [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Cliquez sur votre OAuth 2.0 Client ID
4. Vérifiez que **Authorized redirect URIs** contient :
   ```
   https://igyrrebxrywokxgmtogl.supabase.co/auth/v1/callback
   ```
   (Remplacez par votre URL Supabase réelle)

#### LinkedIn Developers :

1. Allez dans [LinkedIn Developers](https://www.linkedin.com/developers)
2. Sélectionnez votre app
3. Onglet **Auth**
4. Vérifiez que **Redirect URLs** contient :
   ```
   https://igyrrebxrywokxgmtogl.supabase.co/auth/v1/callback
   ```
   (Remplacez par votre URL Supabase réelle)

### 4. Vérifier que les credentials sont corrects

#### Google :
- Le **Client ID** doit commencer par quelque chose comme `534099796356-...`
- Le **Client Secret** doit être visible (pas masqué) lors de la configuration initiale

#### LinkedIn :
- L'**API Key** doit être visible
- L'**API Secret Key** doit être correctement copié (sans espaces)

### 5. Redémarrer l'application après configuration

Après avoir activé les providers dans Supabase :

1. Sauvegardez les changements dans Supabase
2. Attendez 10-15 secondes (propagation)
3. Rechargez votre application (`http://localhost:5173`)
4. Essayez à nouveau de vous connecter avec OAuth

## 🧪 Test de vérification

### Test Google :

1. Allez sur `http://localhost:5173/login`
2. Cliquez sur le bouton **Google**
3. Vous devriez être redirigé vers Google (pas d'erreur immédiate)
4. Après authentification, vous serez redirigé vers `/auth/callback`

### Test LinkedIn :

1. Allez sur `http://localhost:5173/login`
2. Cliquez sur le bouton **LinkedIn**
3. Vous devriez être redirigé vers LinkedIn (pas d'erreur immédiate)
4. Après authentification, vous serez redirigé vers `/auth/callback`

## 🐛 Erreurs courantes

### Erreur : "redirect_uri_mismatch"

**Cause** : L'URL de callback n'est pas autorisée dans le provider OAuth.

**Solution** :
- Vérifiez que l'URL exacte `https://votre-projet.supabase.co/auth/v1/callback` est dans les redirect URIs
- Pas de trailing slash, pas d'espaces

### Erreur : "invalid_client"

**Cause** : Client ID ou Secret incorrect.

**Solution** :
- Vérifiez que vous avez copié les bonnes valeurs
- Pas d'espaces avant/après
- Pour LinkedIn, utilisez bien "API Key" et "API Secret Key"

### Erreur : "provider is not enabled" (votre erreur actuelle)

**Cause** : Le toggle n'est pas activé dans Supabase.

**Solution** :
- ✅ **ACTIVEZ le toggle** dans Supabase Dashboard
- Sauvegardez
- Attendez quelques secondes
- Réessayez

## 📝 Checklist de vérification

Avant de tester, vérifiez que :

- [ ] Le toggle "Enable Sign in with Google" est **ON** dans Supabase
- [ ] Le toggle "LinkedIn enabled" est **ON** dans Supabase
- [ ] Les credentials sont correctement remplis dans Supabase
- [ ] Les Callback URLs sont configurées dans Supabase (URL Configuration)
- [ ] Les Callback URLs sont configurées dans Google Cloud Console
- [ ] Les Callback URLs sont configurées dans LinkedIn Developers
- [ ] L'application a été rechargée après les changements

## 🆘 Si le problème persiste

1. **Vérifiez les logs Supabase** :
   - Dashboard → **Logs** → **Auth Logs**
   - Cherchez les erreurs récentes

2. **Vérifiez la console du navigateur** :
   - Ouvrez les DevTools (F12)
   - Onglet **Console**
   - Regardez les erreurs JavaScript

3. **Vérifiez les variables d'environnement** :
   - Assurez-vous que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont correctes
   - Redémarrez le serveur de développement après modification

4. **Testez avec un autre provider** :
   - Si Google ne fonctionne pas, testez LinkedIn
   - Cela permet d'isoler le problème

