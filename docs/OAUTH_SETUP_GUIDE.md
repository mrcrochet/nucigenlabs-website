# 🔐 Guide de Configuration OAuth - Nucigen Labs

Ce guide vous explique comment configurer l'authentification OAuth (Google, LinkedIn) avec Supabase.

> **Note** : Apple Sign In sera implémenté plus tard. Pour l'instant, seuls Google et LinkedIn sont disponibles.

## 📋 Prérequis

- Un compte Supabase avec un projet actif
- Accès au dashboard Supabase
- Les credentials OAuth des providers (Google, LinkedIn)

> **Note** : Apple Sign In sera implémenté plus tard. Pour l'instant, seuls Google et LinkedIn sont disponibles.

---

## 🔵 1. Configuration Google OAuth

### Étape 1 : Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'**Google+ API** :
   - Allez dans **APIs & Services** → **Library**
   - Recherchez "Google+ API"
   - Cliquez sur **Enable**

### Étape 2 : Créer les credentials OAuth

1. Allez dans **APIs & Services** → **Credentials**
2. Cliquez sur **Create Credentials** → **OAuth client ID**
3. Si c'est la première fois, configurez l'écran de consentement OAuth :
   - Choisissez **External** (ou Internal si vous avez Google Workspace)
   - Remplissez les informations requises
   - Ajoutez votre email de support
   - Sauvegardez et continuez

4. Créez l'OAuth client ID :
   - **Application type** : Web application
   - **Name** : Nucigen Labs (ou votre nom)
   - **Authorized JavaScript origins** :
     ```
     https://votre-projet.supabase.co
     http://localhost:5173 (pour le développement)
     ```
   - **Authorized redirect URIs** :
     ```
     https://votre-projet.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback (pour le développement)
     ```

5. Copiez le **Client ID** et le **Client Secret**

### Étape 3 : Configurer dans Supabase

1. Allez sur votre projet Supabase Dashboard
2. **Authentication** → **Providers**
3. Trouvez **Google** et activez-le
4. Entrez :
   - **Client ID (for OAuth)** : Votre Google Client ID
   - **Client Secret (for OAuth)** : Votre Google Client Secret
5. Cliquez sur **Save**

---

## 🔷 2. Configuration LinkedIn OAuth

### Étape 1 : Créer une application LinkedIn

1. Allez sur [LinkedIn Developers](https://www.linkedin.com/developers)
2. Cliquez sur **Create app**
3. Remplissez les informations :
   - **App name** : Nucigen Labs
   - **LinkedIn Page** : Votre page LinkedIn (ou créez-en une)
   - **Privacy policy URL** : `https://votre-domaine.com/privacy`
   - **App logo** : Logo de votre application (optionnel)

### Étape 2 : Configurer les redirect URLs

1. Dans votre app LinkedIn, allez dans **Auth** tab
2. Ajoutez les **Redirect URLs** :
   ```
   https://votre-projet.supabase.co/auth/v1/callback
   http://localhost:5173/auth/callback (pour le développement)
   ```
3. Sauvegardez

### Étape 3 : Obtenir les credentials

1. Dans l'onglet **Auth**, vous verrez :
   - **Client ID**
   - **Client Secret**
2. Copiez ces valeurs

### Étape 4 : Configurer dans Supabase

1. Allez sur votre projet Supabase Dashboard
2. **Authentication** → **Providers**
3. Trouvez **LinkedIn** et activez-le
4. Entrez :
   - **Client ID (for OAuth)** : Votre LinkedIn Client ID
   - **Client Secret (for OAuth)** : Votre LinkedIn Client Secret
5. Cliquez sur **Save**

---

## 🍎 3. Configuration Apple OAuth

> **⚠️ Note** : Apple Sign In n'est pas encore implémenté. Cette section sera disponible dans une mise à jour future.

Apple Sign In nécessite :
- Un compte Apple Developer payant ($99/an)
- Configuration d'un Service ID
- Création d'une Key pour Sign in with Apple
- Génération d'un secret JWT

Cette fonctionnalité sera ajoutée prochainement.

---

## ✅ 4. Vérification et Test

### Vérifier la configuration

1. Dans Supabase Dashboard → **Authentication** → **Providers**
2. Vérifiez que les providers sont **Enabled** (vert)
3. Vérifiez que les URLs de redirection sont correctes

### Tester l'authentification

1. Allez sur votre application : `http://localhost:5173/login`
2. Cliquez sur un bouton OAuth (Google ou LinkedIn)
3. Vous devriez être redirigé vers le provider
4. Après authentification, vous serez redirigé vers `/auth/callback`
5. Puis redirigé vers `/app` ou `/onboarding`

### URLs de redirection à configurer

Assurez-vous que ces URLs sont configurées dans :
- ✅ Supabase Dashboard → **Authentication** → **URL Configuration**
- ✅ Chaque provider OAuth (Google, LinkedIn, Apple)

**URLs à ajouter** :
```
https://votre-projet.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback (développement)
https://votre-domaine.com/auth/callback (production)
```

---

## 🔧 5. Configuration Supabase - URLs

1. Allez dans **Authentication** → **URL Configuration**
2. Configurez :
   - **Site URL** : `https://votre-domaine.com` (ou `http://localhost:5173` pour dev)
   - **Redirect URLs** : Ajoutez toutes les URLs autorisées :
     ```
     https://votre-domaine.com/auth/callback
     http://localhost:5173/auth/callback
     https://votre-projet.supabase.co/auth/v1/callback
     ```

---

## 🐛 6. Dépannage

### Erreur : "redirect_uri_mismatch"

**Cause** : L'URL de redirection n'est pas autorisée dans le provider OAuth.

**Solution** :
1. Vérifiez que l'URL exacte est dans la liste des redirect URIs du provider
2. L'URL doit correspondre exactement (pas de trailing slash, bon protocole)

### Erreur : "invalid_client"

**Cause** : Client ID ou Client Secret incorrect.

**Solution** :=
1. Vérifiez que vous avez copié les bonnes valeurs
2. Vérifiez qu'il n'y a pas d'espaces avant/après
3. Régénérez les credentials si nécessaire

### Erreur : "access_denied"

**Cause** : L'utilisateur a annulé l'authentification ou l'app n'est pas approuvée.

**Solution** :
1. Pour Google : Vérifiez que l'écran de consentement est publié
2. Pour LinkedIn : Vérifiez que l'app est approuvée
3. Pour Apple : Vérifiez que le Service ID est correctement configuré

### OAuth fonctionne mais redirection échoue

**Cause** : URL de callback non configurée dans Supabase.

**Solution** :
1. Vérifiez **Authentication** → **URL Configuration** dans Supabase
2. Ajoutez l'URL de callback : `https://votre-domaine.com/auth/callback`

---

## 📝 7. Notes Importantes

### Sécurité

- ⚠️ **Ne partagez JAMAIS** vos Client Secrets
- ⚠️ Ne commitez PAS les secrets dans votre code
- ✅ Utilisez des variables d'environnement pour les secrets
- ✅ Utilisez des credentials différents pour dev/prod

### Production

- Utilisez des URLs HTTPS en production
- Configurez les redirect URIs pour votre domaine de production
- Testez tous les providers avant de déployer

### Apple Sign In

- Apple nécessite un compte Apple Developer payant ($99/an)
- Le Service ID doit être vérifié
- La key ne peut être téléchargée qu'une seule fois

---

## 🎯 Checklist de Configuration

- [ ] Google OAuth configuré dans Google Cloud Console
- [ ] Google credentials ajoutés dans Supabase
- [ ] LinkedIn app créée et configurée
- [ ] LinkedIn credentials ajoutés dans Supabase
- [ ] Apple Service ID créé (si nécessaire)
- [ ] Apple credentials ajoutés dans Supabase
- [ ] URLs de redirection configurées dans tous les providers
- [ ] URLs de redirection configurées dans Supabase
- [ ] Test d'authentification Google réussi
- [ ] Test d'authentification LinkedIn réussi
- [ ] Apple Sign In (à venir dans une future mise à jour)

---

## 📚 Ressources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [LinkedIn OAuth Setup](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [Apple Sign In Setup](https://developer.apple.com/sign-in-with-apple/)

---

Une fois la configuration terminée, vos utilisateurs pourront se connecter avec Google, LinkedIn, ou Apple directement depuis les pages Login et Register ! 🎉

