# 🚀 Guide Rapide : Configurer les Redirect URLs dans Clerk

## 📍 Chemin exact dans Clerk Dashboard

```
Clerk Dashboard 
  → Sélectionner l'application "smooth-eel-33"
  → Menu gauche : "Settings" (⚙️)
  → Section : "Authorized Redirect URLs"
  → Ajouter les URLs
  → Sauvegarder
```

## 🎯 Instructions en 5 étapes

### Étape 1 : Accéder au Dashboard
1. Allez sur **https://dashboard.clerk.com**
2. Connectez-vous

### Étape 2 : Sélectionner l'application
1. Cliquez sur **"smooth-eel-33"** dans la liste des applications
2. Ou utilisez le sélecteur en haut à gauche

### Étape 3 : Ouvrir Settings
1. Dans le **menu de gauche**, cliquez sur **"Settings"**
2. C'est généralement la 2ème ou 3ème option dans le menu

### Étape 4 : Trouver "Authorized Redirect URLs"
1. Dans la page Settings, **faites défiler** vers le bas
2. Cherchez la section **"Authorized Redirect URLs"**
3. Si vous ne la voyez pas, utilisez **Ctrl+F** (ou Cmd+F) et cherchez **"redirect"**

### Étape 5 : Ajouter les URLs
1. Cliquez sur **"Add URL"** ou le bouton **"+"**
2. Tapez : `http://localhost:5173/auth/callback`
3. Appuyez sur **Entrée** ou cliquez **"Add URL"** à nouveau
4. Tapez : `https://votre-domaine.com/auth/callback`
5. Cliquez sur **"Save"** en bas de la page

## 🔍 Si vous ne trouvez pas "Authorized Redirect URLs"

### Option A : Chercher dans différentes sections
- **Settings → General** (regardez en haut de la page)
- **Settings → Paths** (parfois ici)
- **Settings → Security** (parfois dans sécurité)

### Option B : Utiliser la recherche
1. Appuyez sur **Ctrl+F** (Windows) ou **Cmd+F** (Mac)
2. Tapez : **"redirect"**
3. Cela vous mènera directement à la section

### Option C : Vérifier la version de Clerk
- Les nouvelles versions peuvent avoir une interface différente
- Consultez : https://clerk.com/docs/authentication/redirect-urls

## 📝 URLs exactes à ajouter

```
http://localhost:5173/auth/callback
```

```
https://votre-domaine.com/auth/callback
```
*(Remplacez `votre-domaine.com` par votre domaine réel, ex: `nucigenlabs.com`)*

## ✅ Vérification

Après avoir ajouté les URLs, vous devriez voir :
- ✅ `http://localhost:5173/auth/callback` dans la liste
- ✅ Votre URL de production dans la liste
- ✅ Le bouton "Save" cliqué (les changements sont sauvegardés)

## 🧪 Test

1. Redémarrez votre serveur de développement (`npm run dev`)
2. Allez sur `http://localhost:5173/register`
3. Cliquez sur "Google" ou "LinkedIn" (OAuth)
4. Après l'authentification, vous devriez être redirigé vers `/auth/callback`

## 🆘 Besoin d'aide ?

Si vous ne trouvez toujours pas :
1. **Capture d'écran** : Prenez une capture de votre page Settings
2. **Documentation Clerk** : https://clerk.com/docs/authentication/redirect-urls
3. **Support Clerk** : https://clerk.com/support

## 📸 Description visuelle

Dans l'interface Clerk Dashboard moderne, vous devriez voir :

```
┌─────────────────────────────────────┐
│  Clerk Dashboard                    │
│                                     │
│  [Menu gauche]                      │
│  ├─ Overview                        │
│  ├─ ⚙️ Settings  ← Cliquez ici     │
│  ├─ User & Authentication            │
│  └─ ...                             │
│                                     │
│  [Contenu principal]                │
│  Settings                           │
│  ┌─────────────────────────────┐   │
│  │ General                     │   │
│  │ ...                         │   │
│  │                             │   │
│  │ Authorized Redirect URLs    │   │
│  │ ┌───────────────────────┐  │   │
│  │ │ http://localhost:...   │  │   │
│  │ └───────────────────────┘  │   │
│  │ [+ Add URL]                │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│  [Save] ← N'oubliez pas de sauvegarder
└─────────────────────────────────────┘
```

