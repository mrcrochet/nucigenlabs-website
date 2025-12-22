# 🚀 Guide de Déploiement sur Vercel

## Prérequis

1. Un compte Vercel (gratuit) : [vercel.com](https://vercel.com)
2. Un compte GitHub/GitLab/Bitbucket (pour le déploiement automatique)
3. Les clés API nécessaires (Supabase, NewsAPI)

---

## 📋 Étapes de Déploiement

### Option 1 : Déploiement via GitHub (Recommandé)

#### 1. Préparer le Repository

```bash
# Assurez-vous que votre code est sur GitHub
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

#### 2. Connecter à Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New Project"**
3. Importez votre repository GitHub
4. Vercel détectera automatiquement Vite

#### 3. Configuration du Projet

Vercel devrait détecter automatiquement :
- **Framework Preset** : Vite
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

#### 4. Variables d'Environnement

Dans les **Environment Variables** de Vercel, ajoutez :

```
VITE_SUPABASE_URL=https://igyrrebxrywokxgmtogl.supabase.co
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
VITE_NEWS_API_KEY=3f496fd50f0040f3a3ebdf569047834c
```

⚠️ **Important** : Ne jamais ajouter la Service Role Key dans les variables d'environnement publiques !

#### 5. Déployer

Cliquez sur **"Deploy"** et attendez la fin du build.

---

### Option 2 : Déploiement via Vercel CLI

#### 1. Installer Vercel CLI

```bash
npm i -g vercel
```

#### 2. Se connecter

```bash
vercel login
```

#### 3. Déployer

```bash
# Depuis le répertoire du projet
vercel

# Pour la production
vercel --prod
```

#### 4. Configurer les Variables d'Environnement

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_NEWS_API_KEY
```

---

## 🔧 Configuration Post-Déploiement

### 1. Vérifier le Routing

Le fichier `vercel.json` est déjà configuré pour que React Router fonctionne correctement. Toutes les routes sont redirigées vers `index.html` pour le client-side routing.

### 2. Domaine Personnalisé (Optionnel)

1. Allez dans **Project Settings** → **Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions DNS

### 3. Variables d'Environnement par Environnement

Vous pouvez configurer des variables différentes pour :
- **Production**
- **Preview** (branches)
- **Development**

Dans **Project Settings** → **Environment Variables**

---

## 🐛 Dépannage

### Problème : Routes 404 après déploiement

**Solution** : Vérifiez que `vercel.json` contient bien les rewrites pour React Router.

### Problème : Variables d'environnement non chargées

**Solution** : 
1. Vérifiez que les variables commencent par `VITE_`
2. Redéployez après avoir ajouté les variables
3. Les variables sont injectées au build time, pas au runtime

### Problème : Build échoue

**Solution** :
1. Vérifiez les logs de build dans Vercel
2. Testez le build localement : `npm run build`
3. Vérifiez que toutes les dépendances sont dans `package.json`

### Problème : API NewsAPI bloque les requêtes

**Solution** : 
- NewsAPI a des limites sur le plan gratuit
- Pour la production, considérez un proxy ou une alternative
- Les requêtes depuis Vercel peuvent être bloquées (CORS)

---

## 📊 Monitoring

### Vercel Analytics (Optionnel)

1. Allez dans **Project Settings** → **Analytics**
2. Activez Vercel Analytics (gratuit jusqu'à 100k events/mois)

### Logs

- **Build Logs** : Disponibles dans chaque déploiement
- **Function Logs** : Si vous utilisez des Edge Functions
- **Real-time Logs** : Via Vercel CLI (`vercel logs`)

---

## 🔄 Déploiement Automatique

Une fois connecté à GitHub, Vercel déploie automatiquement :
- ✅ Chaque push sur `main` → Production
- ✅ Chaque pull request → Preview deployment
- ✅ Chaque branche → Preview deployment

---

## 📝 Checklist de Déploiement

- [ ] Code poussé sur GitHub
- [ ] Variables d'environnement configurées dans Vercel
- [ ] `vercel.json` présent dans le projet
- [ ] Build testé localement (`npm run build`)
- [ ] Routes testées après déploiement
- [ ] Domaine personnalisé configuré (si nécessaire)
- [ ] Analytics activé (optionnel)

---

## 🎯 Prochaines Étapes

1. **Performance** : Vérifiez le score Lighthouse dans Vercel
2. **SEO** : Vérifiez que les meta tags sont corrects
3. **Monitoring** : Configurez des alertes pour les erreurs
4. **Backup** : Gardez une copie locale de `.env.example`

---

## 📚 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Vite + Vercel](https://vercel.com/docs/frameworks/vite)
- [Environment Variables](https://vercel.com/docs/environment-variables)

---

**Note** : Le fichier `vercel.json` est déjà configuré dans le projet. Il suffit d'ajouter les variables d'environnement et de déployer !

