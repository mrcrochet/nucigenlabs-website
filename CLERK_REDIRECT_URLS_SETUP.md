# 🔗 Configuration des Redirect URLs dans Clerk Dashboard

## 📍 Où configurer les Redirect URLs

Dans Clerk, les Redirect URLs peuvent être configurées à **plusieurs endroits** selon votre cas d'usage. Voici les différentes méthodes :

## Méthode 1 : Settings → Authorized Redirect URLs (Recommandé)

### Étape par étape détaillée :

1. **Connectez-vous à Clerk Dashboard**
   - Allez sur https://dashboard.clerk.com
   - Connectez-vous avec vos identifiants

2. **Sélectionnez votre application**
   - Dans la liste des applications, cliquez sur **"smooth-eel-33"** 
   - **Application ID** : `app_37o8iuT70oOlSBCTA3xCha2GTAR`
   - Ou utilisez le sélecteur d'application en haut à gauche

3. **Accédez aux Settings**
   - Dans le **menu de gauche**, cliquez sur **"Settings"** (icône ⚙️ ou engrenage)
   - Vous devriez voir plusieurs sections : General, Security, Paths, etc.

4. **Trouvez "Authorized Redirect URLs"**
   - Dans la page Settings, cherchez la section **"Authorized Redirect URLs"**
   - Cette section peut être dans :
     - **Settings → General** (souvent en haut)
     - **Settings → Paths** (parfois ici)
     - **Settings → URLs** (alternative)
   
   **Astuce** : Utilisez Ctrl+F (Cmd+F sur Mac) et cherchez "redirect" pour trouver rapidement

5. **Ajoutez les URLs**
   - Vous verrez un champ de texte ou une liste avec un bouton **"Add URL"** ou **"+"**
   - Cliquez sur **"Add URL"** ou le bouton **"+"**
   - Entrez : `http://localhost:5173/auth/callback`
   - Appuyez sur **Entrée** ou cliquez à nouveau sur **"Add URL"**
   - Entrez : `https://votre-domaine.com/auth/callback` (remplacez par votre domaine réel)
   - Cliquez sur **"Save"** ou **"Apply"** en bas de la page

## Méthode 2 : User & Authentication → Social Connections (Pour OAuth)

Si vous utilisez OAuth (Google, LinkedIn, etc.) :

1. **Allez dans User & Authentication**
   - Menu de gauche → **"User & Authentication"**
   - Cliquez sur **"Social Connections"**

2. **Configurez chaque provider**
   - Pour chaque provider OAuth (Google, LinkedIn, etc.)
   - Cherchez la section **"Redirect URLs"** ou **"Callback URLs"**
   - Ajoutez les mêmes URLs :
     - `http://localhost:5173/auth/callback`
     - `https://votre-domaine.com/auth/callback`

## Méthode 3 : Settings → Domains (Alternative)

1. **Allez dans Settings → Domains**
   - Dans le menu Settings, cherchez **"Domains"**
   - Vous pouvez ajouter vos domaines autorisés ici

## 🔍 Si vous ne trouvez pas "Paths"

### Vérifications :

1. **Vérifiez que vous êtes sur la bonne application**
   - Le nom devrait être visible en haut à gauche
   - Application ID : `app_37o8iuT70oOlSBCTA3xCha2GTAR`

2. **Cherchez dans différentes sections :**
   - **Settings → General** : Parfois les Redirect URLs sont ici
   - **Settings → Security** : Parfois dans les paramètres de sécurité
   - **Settings → Advanced** : Parfois dans les paramètres avancés

3. **Utilisez la recherche**
   - Utilisez Ctrl+F (Cmd+F sur Mac) pour chercher "redirect" ou "callback"

## 📝 URLs à ajouter

### Development (Local)
```
http://localhost:5173/auth/callback
```

### Production (Votre domaine)
```
https://votre-domaine.com/auth/callback
```
**Remplacez `votre-domaine.com` par votre domaine réel** (ex: `nucigenlabs.com`)

## 🎯 URLs alternatives possibles

Si vous utilisez des ports différents ou des chemins différents, ajoutez aussi :
- `http://localhost:3000/auth/callback` (si vous utilisez le port 3000)
- `http://127.0.0.1:5173/auth/callback` (alternative localhost)
- `https://www.votre-domaine.com/auth/callback` (avec www)

## ⚠️ Notes importantes

1. **Pas de trailing slash** : Utilisez `/auth/callback` et non `/auth/callback/`
2. **Protocole exact** : `http://` pour local, `https://` pour production
3. **Port exact** : Assurez-vous que le port correspond (5173 pour Vite)
4. **Sauvegardez** : N'oubliez pas de cliquer sur "Save" après avoir ajouté les URLs

## 🔄 Après avoir configuré

1. **Redémarrez votre serveur de développement** (si nécessaire)
2. **Testez l'authentification** :
   - Allez sur `/register` ou `/login`
   - Essayez de vous inscrire ou connecter
   - Vérifiez que la redirection fonctionne après OAuth

## 🆘 Si vous ne trouvez toujours pas

### Option 1 : Contactez le support Clerk
- Support : https://clerk.com/support
- Documentation : https://clerk.com/docs

### Option 2 : Vérifiez la version de Clerk
- Les nouvelles versions de Clerk peuvent avoir une interface différente
- Vérifiez la documentation à jour : https://clerk.com/docs/authentication/redirect-urls

### Option 3 : Utilisez l'API
- Vous pouvez configurer les Redirect URLs via l'API Clerk si l'interface ne le permet pas

## 📸 Emplacement visuel (description)

Dans l'interface Clerk Dashboard moderne :
- **Menu de gauche** : Settings (icône ⚙️)
- **Section** : "Paths" ou "URLs" (souvent en haut de la page Settings)
- **Champ** : "Allowed redirect URLs" ou "Redirect URLs"
- **Bouton** : "Add URL" ou "+" à côté du champ

## ✅ Checklist

- [ ] Connecté à Clerk Dashboard
- [ ] Application `smooth-eel-33` sélectionnée
- [ ] Section Settings → Paths trouvée
- [ ] URL `http://localhost:5173/auth/callback` ajoutée
- [ ] URL de production ajoutée (avec votre domaine réel)
- [ ] Changements sauvegardés
- [ ] Test d'authentification effectué

