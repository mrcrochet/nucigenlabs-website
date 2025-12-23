# Configuration des Variables d'Environnement sur Vercel

## Variables d'environnement requises

Votre application utilise **3 variables d'environnement** qui doivent être configurées sur Vercel :

### 1. Supabase URL
```
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
```

### 2. Supabase Anon Key (clé publique)
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q
```

### 3. NewsAPI Key
```
VITE_NEWS_API_KEY=3f496fd50f0040f3a3ebdf569047834c
```

---

## Guide étape par étape pour Vercel

### Méthode 1 : Via le Dashboard Vercel (Recommandé)

1. **Accédez à votre projet sur Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez-vous à votre compte
   - Sélectionnez le projet `nucigenlabs-website`

2. **Accédez aux paramètres du projet**
   - Cliquez sur **Settings** (Paramètres) dans le menu du projet
   - Dans le menu latéral, cliquez sur **Environment Variables** (Variables d'environnement)

3. **Ajoutez chaque variable**
   Pour chaque variable ci-dessous, cliquez sur **Add New** et remplissez :
   
   **Variable 1 :**
   - **Key** : `VITE_SUPABASE_URL`
   - **Value** : `https://igyrrebxrywokxgmtogl.supabase.co`
   - **Environments** : Cochez toutes les cases (Production, Preview, Development)
   - Cliquez sur **Save**

   **Variable 2 :**
   - **Key** : `VITE_SUPABASE_ANON_KEY`
   - **Value** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q`
   - **Environments** : Cochez toutes les cases (Production, Preview, Development)
   - Cliquez sur **Save**

   **Variable 3 :**
   - **Key** : `VITE_NEWS_API_KEY`
   - **Value** : `3f496fd50f0040f3a3ebdf569047834c`
   - **Environments** : Cochez toutes les cases (Production, Preview, Development)
   - Cliquez sur **Save**

4. **Redéployez votre application**
   - Allez dans l'onglet **Deployments**
   - Cliquez sur les **3 points** (⋯) à côté du dernier déploiement
   - Sélectionnez **Redeploy**
   - Ou simplement poussez un nouveau commit sur GitHub pour déclencher un nouveau déploiement

---

### Méthode 2 : Via Vercel CLI (Optionnel)

Si vous préférez utiliser la ligne de commande :

```bash
# Installer Vercel CLI (si pas déjà installé)
npm i -g vercel

# Se connecter à Vercel
vercel login

# Ajouter les variables d'environnement
vercel env add VITE_SUPABASE_URL
# Entrez la valeur quand demandé : https://igyrrebxrywokxgmtogl.supabase.co
# Sélectionnez tous les environnements (Production, Preview, Development)

vercel env add VITE_SUPABASE_ANON_KEY
# Entrez la valeur quand demandé : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q
# Sélectionnez tous les environnements

vercel env add VITE_NEWS_API_KEY
# Entrez la valeur quand demandé : 3f496fd50f0040f3a3ebdf569047834c
# Sélectionnez tous les environnements
```

---

## Vérification

Après avoir ajouté les variables et redéployé :

1. **Vérifiez les logs de build**
   - Dans Vercel, allez dans **Deployments**
   - Cliquez sur le dernier déploiement
   - Vérifiez les logs pour confirmer que les variables sont chargées

2. **Testez votre application**
   - Visitez votre site déployé
   - Testez les fonctionnalités qui utilisent Supabase (formulaires d'accès)
   - Testez les fonctionnalités qui utilisent NewsAPI (actualités en temps réel)

---

## ⚠️ Notes importantes

- **VITE_** : Toutes les variables commencent par `VITE_` car c'est un projet Vite. Ces variables sont exposées côté client.
- **Sécurité** : La clé `VITE_SUPABASE_ANON_KEY` est une clé publique, donc sûre pour le client. Ne jamais utiliser la Service Role Key côté client.
- **Environnements** : Cochez toutes les cases (Production, Preview, Development) pour que les variables soient disponibles partout.

---

## Support

Si vous rencontrez des problèmes :
1. Vérifiez que les noms des variables sont exactement identiques (sensible à la casse)
2. Vérifiez que vous avez redéployé après avoir ajouté les variables
3. Vérifiez les logs de build dans Vercel pour voir les erreurs éventuelles

