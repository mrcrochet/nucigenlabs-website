# 🔧 Configuration des Variables d'Environnement

## ❌ Erreur rencontrée

```
Supabase is not configured
```

Cette erreur signifie que les variables d'environnement Supabase ne sont pas configurées ou ne sont pas chargées correctement.

## 🔍 Vérification rapide

Exécutez cette commande pour vérifier votre configuration :

```bash
npm run check-env
```

Cette commande vérifiera si votre fichier `.env` est correctement configuré.

## ✅ Solution

### 1. Créer le fichier `.env`

Créez un fichier `.env` à la racine du projet (même niveau que `package.json`).

### 2. Obtenir vos credentials Supabase

1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **API**
4. Vous verrez :
   - **Project URL** : C'est votre `VITE_SUPABASE_URL`
   - **anon public** key : C'est votre `VITE_SUPABASE_ANON_KEY`

### 3. Configurer le fichier `.env`

Copiez le contenu suivant dans votre fichier `.env` :

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key-ici
```

**Remplacez** :
- `https://votre-projet.supabase.co` par votre **Project URL** de Supabase
- `votre-anon-key-ici` par votre **anon public** key de Supabase

### 4. Exemple de fichier `.env` complet

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.exemple
```

### 5. Redémarrer le serveur de développement

**IMPORTANT** : Après avoir créé ou modifié le fichier `.env`, vous devez **redémarrer** le serveur de développement.

1. Arrêtez le serveur (Ctrl+C ou Cmd+C)
2. Redémarrez avec `npm run dev`

### 6. Vérifier la configuration

Pour vérifier que la configuration fonctionne :

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet **Console**
3. Essayez de vous connecter
4. Vous ne devriez plus voir l'erreur "Supabase is not configured"

## 📝 Notes importantes

- ⚠️ **Ne commitez JAMAIS** le fichier `.env` dans Git (il est déjà dans `.gitignore`)
- ✅ Le fichier `.env.example` peut être commité (il ne contient pas de secrets)
- 🔄 Redémarrez toujours le serveur après modification de `.env`
- 🔒 Gardez vos credentials secrets et ne les partagez pas

## 🐛 Dépannage

### Le serveur ne charge pas les variables

1. Vérifiez que le fichier s'appelle exactement `.env` (avec le point au début)
2. Vérifiez qu'il est à la racine du projet
3. Redémarrez le serveur de développement
4. Vérifiez qu'il n'y a pas d'espaces autour du `=` dans `.env`

### Les variables sont toujours undefined

1. Vérifiez que les variables commencent par `VITE_` (obligatoire pour Vite)
2. Vérifiez qu'il n'y a pas de guillemets autour des valeurs
3. Redémarrez le serveur

### Erreur de connexion à Supabase

1. Vérifiez que l'URL est correcte (commence par `https://`)
2. Vérifiez que la clé anon est complète (très longue)
3. Vérifiez que vous avez copié la bonne clé (anon public, pas service_role)

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Vite - Variables d'environnement](https://vitejs.dev/guide/env-and-mode.html)

