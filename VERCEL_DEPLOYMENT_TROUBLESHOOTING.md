# Guide de Dépannage - Déploiement Vercel

## Problème : Les modifications ne sont pas visibles sur Vercel

### ✅ Vérifications à faire

## 1. Vérifier la branche déployée sur Vercel

**Problème le plus courant** : Vercel déploie peut-être la branche `main` au lieu de `a11y-seo-perf`.

### Solution :

1. **Allez sur Vercel Dashboard**
   - [vercel.com](https://vercel.com) → Votre projet

2. **Vérifiez la branche de production**
   - Settings → Git → Production Branch
   - **Assurez-vous que c'est `a11y-seo-perf`** (pas `main`)

3. **Si c'est `main`, changez-le :**
   - Cliquez sur "Edit"
   - Changez "Production Branch" en `a11y-seo-perf`
   - Sauvegardez

4. **Redéployez :**
   - Deployments → Cliquez sur les 3 points du dernier déploiement
   - "Redeploy" ou créez un nouveau déploiement depuis la branche `a11y-seo-perf`

---

## 2. Vérifier que les commits sont bien sur GitHub

```bash
# Vérifier que votre branche est à jour
git log origin/a11y-seo-perf -5 --oneline

# Vérifier que le dernier commit est bien celui que vous attendez
git log -1 --oneline
```

**Si les commits ne correspondent pas :**
```bash
git push origin a11y-seo-perf
```

---

## 3. Vérifier les logs de build sur Vercel

1. **Allez sur Vercel Dashboard**
   - Deployments → Cliquez sur le dernier déploiement

2. **Vérifiez les logs de build**
   - Regardez s'il y a des erreurs
   - Vérifiez que le build se termine avec succès

3. **Erreurs communes :**
   - `npm install` échoue → Vérifiez `.npmrc` avec `legacy-peer-deps=true`
   - Variables d'environnement manquantes → Voir section 4
   - Erreurs TypeScript → Vérifiez `tsconfig.json`
   - Erreurs de build → Vérifiez `vite.config.ts`

---

## 4. Vérifier les variables d'environnement

**Variables REQUISES sur Vercel :**

1. **VITE_SUPABASE_URL**
   - Value: `https://igyrrebxrywokxgmtogl.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneXJyZWJ4cnl3b2t4Z210b2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMzc4MDYsImV4cCI6MjA4MTkxMzgwNn0.Qg5f86nLE7ET3DxDZjmdLbQtogNWU9zOs7S7A1hdJ2Q`

3. **VITE_NEWS_API_KEY**
   - Value: `3f496fd50f0040f3a3ebdf569047834c`

4. **VITE_RESEND_API_KEY** (pour les emails)
   - Value: `re_NjpCUge6_2rv7NpmvPdmYyTPrR7gpHLCJ`

5. **VITE_RESEND_FROM_EMAIL** (pour les emails)
   - Value: `Nucigen Labs <onboarding@resend.dev>`

**Comment vérifier :**
- Settings → Environment Variables
- Vérifiez que toutes ces variables existent
- Vérifiez qu'elles sont activées pour "Production"

**Après avoir ajouté/modifié des variables :**
- **REDÉPLOYEZ** : Deployments → ... → Redeploy

---

## 5. Forcer un nouveau déploiement

### Option 1 : Via le Dashboard Vercel

1. Allez sur **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Attendez la fin du build (2-5 minutes)

### Option 2 : Via un commit vide

```bash
# Créer un commit vide pour déclencher un nouveau déploiement
git commit --allow-empty -m "chore: Trigger Vercel redeployment"
git push origin a11y-seo-perf
```

### Option 3 : Vider le cache Vercel

1. Settings → General
2. Scroll jusqu'à "Build & Development Settings"
3. Cliquez sur "Clear Build Cache"
4. Redéployez

---

## 6. Vérifier la configuration Vercel

Votre `vercel.json` doit contenir :

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Vérifiez que ce fichier est bien commité :**
```bash
git ls-files | grep vercel.json
```

---

## 7. Vérifier que le build fonctionne en local

```bash
# Nettoyer le cache
rm -rf node_modules dist
npm cache clean --force

# Réinstaller
npm install --legacy-peer-deps

# Tester le build
npm run build

# Vérifier que dist/ contient les fichiers
ls -la dist/
```

**Si le build local échoue**, corrigez les erreurs avant de pousser.

---

## 8. Vérifier le domaine de production

1. **Allez sur Vercel Dashboard**
   - Settings → Domains
   - Vérifiez quel domaine est configuré pour la production

2. **Vérifiez que vous visitez le bon domaine**
   - Si vous avez plusieurs environnements (Preview, Production)
   - Assurez-vous de visiter le domaine de **Production**

---

## 9. Solution rapide : Redéploiement complet

Si rien ne fonctionne, faites un redéploiement complet :

1. **Sur Vercel Dashboard :**
   - Settings → General → Scroll jusqu'en bas
   - Cliquez sur "Remove Project" (⚠️ Ne supprimez pas vraiment)
   - Ou allez dans Deployments → ... → Redeploy

2. **Ou reconnectez le projet :**
   - Settings → Git → Disconnect
   - Puis reconnectez avec GitHub
   - Sélectionnez la branche `a11y-seo-perf`

---

## 10. Vérifier les fichiers critiques

Assurez-vous que ces fichiers sont bien commités :

```bash
# Vérifier les fichiers importants
git ls-files | grep -E "(vercel.json|package.json|vite.config|tsconfig)"
```

**Fichiers critiques :**
- ✅ `vercel.json` - Configuration Vercel
- ✅ `package.json` - Dépendances et scripts
- ✅ `.npmrc` - Configuration npm (legacy-peer-deps)
- ✅ `vite.config.ts` - Configuration Vite
- ✅ `src/` - Tout le code source

---

## Checklist finale

Avant de vérifier sur Vercel, assurez-vous que :

- [ ] La branche `a11y-seo-perf` est bien la branche de production sur Vercel
- [ ] Tous les commits sont poussés sur GitHub (`git push origin a11y-seo-perf`)
- [ ] Le build fonctionne en local (`npm run build`)
- [ ] Toutes les variables d'environnement sont configurées sur Vercel
- [ ] Le dernier déploiement sur Vercel est récent (après vos modifications)
- [ ] Les logs de build sur Vercel ne montrent pas d'erreurs
- [ ] Vous visitez le bon domaine (production, pas preview)

---

## Commandes utiles

```bash
# Vérifier le statut git
git status

# Voir les derniers commits
git log --oneline -10

# Vérifier la branche distante
git branch -vv

# Pousser vers GitHub
git push origin a11y-seo-perf

# Tester le build local
npm run build

# Vérifier les variables d'environnement (local)
cat .env
```

---

## Contact

Si le problème persiste après avoir suivi ce guide :
1. Vérifiez les logs de build sur Vercel
2. Vérifiez la console du navigateur sur le site en production (F12)
3. Comparez le code local avec ce qui est sur GitHub


