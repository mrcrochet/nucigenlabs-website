# ✅ Où configurer les Authorized Redirect URLs dans Clerk

## ❌ Ce n'est PAS ici

Vous êtes actuellement dans :
- **Account Portal** → **Redirects** tab

Cet onglet configure les **fallback URLs** pour le Account Portal (où rediriger après sign-up/sign-in si pas de redirect_url spécifié). Ce n'est **PAS** pour les Authorized Redirect URLs OAuth.

## ✅ Le bon endroit

### Option 1 : Instance → Settings → Paths (Recommandé)

1. Dans la **sidebar gauche**, trouvez la section **"Instance"**
2. Cliquez sur **"Settings"** (avec l'icône ⚙️ engrenage) sous "Instance"
3. Cherchez la section **"Paths"** ou **"Authorized Redirect URLs"**
4. C'est ici que vous devez ajouter :
   - `http://localhost:5173/auth/callback`
   - `https://votre-domaine.com/auth/callback`

### Option 2 : User & Authentication → Social Connections

Si vous configurez OAuth (Google, LinkedIn) :

1. Dans la sidebar gauche, sous **"Configure"**, cliquez sur **"User & authentication"**
2. Cliquez sur **"Social Connections"** ou cherchez les providers OAuth
3. Pour chaque provider (Google, LinkedIn, etc.), il y a une section **"Redirect URLs"** ou **"Callback URLs"**
4. Ajoutez les mêmes URLs là aussi

## 📍 Chemin exact dans votre interface

D'après votre capture d'écran, voici le chemin :

```
Sidebar gauche
  └─ Instance (section en bas)
      └─ Settings (⚙️) ← Cliquez ici
          └─ Paths (ou cherchez "Authorized Redirect URLs")
```

## 🔍 Comment trouver "Paths"

1. Cliquez sur **"Settings"** sous "Instance" dans la sidebar
2. Dans la page Settings, cherchez :
   - Une section **"Paths"**
   - Ou **"Authorized Redirect URLs"**
   - Ou **"Allowed Redirect URLs"**
3. Utilisez **Ctrl+F** (Cmd+F) et cherchez **"redirect"** pour trouver rapidement

## ⚠️ Différence importante

- **Account Portal → Redirects** : Pour les fallbacks du Account Portal (où vous êtes actuellement)
- **Instance → Settings → Paths** : Pour les Authorized Redirect URLs OAuth (ce que vous cherchez)

## ✅ URLs à ajouter

Une fois dans **Instance → Settings → Paths**, ajoutez :

```
http://localhost:5173/auth/callback
https://votre-domaine.com/auth/callback
```

## 🎯 Résumé

1. **Quittez** "Account Portal" (retour au menu principal)
2. **Sidebar gauche** → Section **"Instance"**
3. Cliquez sur **"Settings"** (⚙️)
4. Cherchez **"Paths"** ou **"Authorized Redirect URLs"**
5. Ajoutez vos URLs
6. Sauvegardez

