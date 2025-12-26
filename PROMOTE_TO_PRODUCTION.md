# Comment Promouvoir un Déploiement Preview vers Production sur Vercel

## Situation Actuelle

D'après votre dashboard Vercel, les modifications sont déployées en **Preview** mais pas encore en **Production**.

- ✅ **Preview** : Déploiements `E92YShKdF` et `B4rYfw9y1` (Ready, 15-16m ago)
- ⚠️ **Production** : Dernier déploiement est un "Redeploy" d'un commit plus ancien

## Solution : Promouvoir vers Production

### Option 1 : Promouvoir le Déploiement Preview (Recommandé)

1. **Allez sur Vercel Dashboard**
   - [vercel.com](https://vercel.com) → Votre projet → **Deployments**

2. **Trouvez le déploiement Preview avec vos modifications**
   - Cherchez le déploiement `E92YShKdF` ou `B4rYfw9y1` (celui avec "fix: Remove Next.js dependency...")
   - Il devrait être marqué "Preview" avec un point vert "Ready"

3. **Promouvoir vers Production**
   - Cliquez sur les **3 points** (⋯) à droite du déploiement Preview
   - Sélectionnez **"Promote to Production"** ou **"Promote"**
   - Confirmez

4. **Attendez la fin du déploiement**
   - Le déploiement sera copié vers Production
   - Votre site de production sera mis à jour

### Option 2 : Vérifier la Branche de Production

Si Vercel ne déploie pas automatiquement vers Production, vérifiez la configuration :

1. **Settings → Git**
   - Vérifiez "Production Branch"
   - **Assurez-vous que c'est `a11y-seo-perf`** (pas `main`)

2. **Si ce n'est pas la bonne branche :**
   - Cliquez sur "Edit"
   - Changez "Production Branch" en `a11y-seo-perf`
   - Sauvegardez
   - Vercel redéploiera automatiquement

### Option 3 : Forcer un Nouveau Déploiement Production

Si les options ci-dessus ne fonctionnent pas :

1. **Deployments → Cliquez sur le dernier déploiement Production**
2. **Cliquez sur les 3 points (⋯)**
3. **Sélectionnez "Redeploy"**
4. **Sélectionnez la branche `a11y-seo-perf`**
5. **Confirmez**

## Vérification

Après avoir promu ou redéployé :

1. **Vérifiez les logs de build**
   - Deployments → Cliquez sur le nouveau déploiement Production
   - Vérifiez que le build utilise bien `vite build` (pas `next build`)
   - Vérifiez qu'il n'y a pas d'erreurs

2. **Vérifiez que les modifications sont visibles**
   - Visitez votre domaine de production
   - Vérifiez que les changements sont présents

## Différence entre Preview et Production

- **Preview** : Environnement de test pour chaque commit/PR
- **Production** : Environnement public, accessible via votre domaine principal

Les modifications sont actuellement en Preview. Pour qu'elles soient visibles publiquement, elles doivent être en Production.


