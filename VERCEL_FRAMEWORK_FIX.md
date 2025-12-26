# Fix : Vercel détecte incorrectement Next.js

## Problème Identifié

Vercel (et Netlify) détectent automatiquement votre projet comme Next.js à cause de la dépendance `next` dans `package.json`, alors que c'est un projet **Vite**.

### Symptômes
- Les modifications ne sont pas visibles en production
- Vercel cherche un dossier `.next` au lieu de `dist/`
- Le build échoue ou utilise la mauvaise configuration

## Solution Appliquée

### 1. Suppression de la dépendance Next.js

La dépendance `next` a été retirée de `package.json` car elle n'est **pas utilisée** dans le code.

**Avant :**
```json
"dependencies": {
  "next": "^16.1.0",  // ❌ À retirer
  "react": "^19.2.3",
}
```

**Après :**
```json
"dependencies": {
  "react": "^19.2.3",  // ✅ Next retiré
}
```

### 2. Configuration Vercel Forcée

Le `vercel.json` a été mis à jour pour forcer Vite :

```json
{
  "framework": null,  // Force Vercel à ne pas auto-détecter
  "buildCommand": "npm run build",
  "outputDirectory": "dist",  // Important : doit être "dist" pour Vite
  ...
}
```

## Actions à Faire sur Vercel

### 1. Vérifier la Configuration du Projet

1. Allez sur **Vercel Dashboard** → Votre projet → **Settings**
2. **General** → Scroll jusqu'à "Build & Development Settings"
3. Vérifiez :
   - **Framework Preset** : Doit être "Other" ou "Vite" (pas "Next.js")
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm install --legacy-peer-deps`

### 2. Si "Framework Preset" est sur "Next.js"

1. Cliquez sur "Edit"
2. Changez "Framework Preset" en **"Other"** ou **"Vite"**
3. Sauvegardez

### 3. Redéployer

1. **Deployments** → Cliquez sur les 3 points du dernier déploiement
2. **Redeploy**
3. Attendez la fin du build

## Vérification

Après le redéploiement, vérifiez dans les logs :

✅ **Bon signe :**
```
> vite build
✓ built in X.XXs
```

❌ **Mauvais signe :**
```
> next build
Error: Could not find a production build
```

## Si le Problème Persiste

### Option 1 : Forcer la Configuration via UI

1. Settings → General → Build & Development Settings
2. **Override** tous les champs :
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install --legacy-peer-deps`
3. Sauvegardez et redéployez

### Option 2 : Vérifier les Variables d'Environnement

Assurez-vous que toutes les variables sont configurées (voir `VERCEL_ENV_SETUP.md`)

### Option 3 : Nettoyer et Redéployer

1. Settings → General → Scroll jusqu'en bas
2. "Clear Build Cache"
3. Redéployez

## Commandes Locales

Pour vérifier que tout fonctionne en local :

```bash
# Nettoyer
rm -rf node_modules dist

# Réinstaller (sans next)
npm install --legacy-peer-deps

# Tester le build
npm run build

# Vérifier que dist/ existe
ls -la dist/
```

## Résultat Attendu

Après ces corrections :
- ✅ Vercel détecte correctement Vite
- ✅ Le build produit `dist/` (pas `.next/`)
- ✅ Les modifications sont visibles en production
- ✅ Le routing fonctionne correctement

