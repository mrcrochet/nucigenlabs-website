# Déploiement en production

## Vue d’ensemble

- **Frontend** : déployé sur Vercel (build Vite → `dist/`).
- **API** : serveur Express à déployer séparément (Railway, Render, Fly.io, etc.). Vercel ne fait pas tourner ce serveur.

Pour que les appels `/api/*` (Corporate Impact, Perplexity, signaux, etc.) fonctionnent en production, il faut déployer l’API et indiquer son URL au frontend.

---

## 1. Déployer l’API (Railway ou Render)

### Option A – Railway

1. Crée un projet sur [railway.app](https://railway.app).
2. **New** → **Deploy from GitHub repo** → sélectionne le repo (ex. `mrcrochet/nucigenlabs-website`).
3. **Settings** du service :
   - **Root Directory** : laisser vide (racine du repo).
   - **Build Command** : `npm install --legacy-peer-deps`
   - **Start Command** : `npx tsx src/server/api-server.ts`
   - **Watch Paths** : optionnel, pour redéploiement auto.
4. **Variables** : ajoute toutes les variables du `.env` (Supabase, Perplexity, OpenAI, Twelve Data, etc.). Ne committe pas le `.env`.
5. Railway injecte `PORT` ; le serveur l’utilise déjà.
6. **Deploy** → une fois déployé, récupère l’URL publique (ex. `https://nucigenlabs-website-production.up.railway.app`).

### Option B – Render

1. [render.com](https://render.com) → **New** → **Web Service**.
2. Connecte le repo GitHub.
3. **Build Command** : `npm install --legacy-peer-deps`
4. **Start Command** : `npx tsx src/server/api-server.ts`
5. **Environment** : ajoute les variables d’environnement (mêmes que `.env`).
6. Render fournit une URL (ex. `https://nucigenlabs-api.onrender.com`).

---

## 2. Configurer le frontend (Vercel)

1. **Vercel** → projet → **Settings** → **Environment Variables**.
2. Ajoute :
   - **Name** : `VITE_API_URL`
   - **Value** : l’URL de ton API **sans** slash final (ex. `https://nucigenlabs-website-production.up.railway.app`)
   - **Environment** : Production (et Preview si tu veux les mêmes appels en preview).
3. **Redeploy** le frontend (Deployments → … → Redeploy) pour que la nouvelle variable soit prise en compte.

Le frontend utilisera alors cette URL pour tous les appels `fetch('/api/...')`.

---

## 3. CORS

L’API Express a déjà `cors()` activé. Si ton front est sur un domaine Vercel (ex. `*.vercel.app` ou un domaine perso), les requêtes depuis ce domaine vers l’URL de l’API sont en général acceptées. Si tu as une erreur CORS, restreins l’origine côté API (ex. `origin: ['https://ton-site.vercel.app']`).

---

## 4. Récap des variables

| Où        | Variable          | Description                                      |
|----------|-------------------|---------------------------------------------------|
| Railway/Render | `PORT`        | Fourni par la plateforme (ne pas définir à la main) |
| Railway/Render | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Base de données |
| Railway/Render | `PERPLEXITY_API_KEY`, `OPENAI_API_KEY` | Recherche / LLM |
| Railway/Render | Autres clés (Twelve Data, etc.) | Selon tes besoins |
| Vercel   | `VITE_API_URL`    | URL publique de l’API (sans slash final)         |

---

## 5. Vérification

- **Frontend** : ouvre le site Vercel, va sur Corporate Impact → Recherche en temps réel, pose une question.
- Si tu vois encore « Erreur 404 / le serveur API ne répond pas », vérifie que `VITE_API_URL` est bien défini en Production et qu’un redeploy a été fait après l’ajout.

---

## 6. Si le build Vercel échoue (Deployment failed)

1. **Voir l’erreur exacte** : Vercel → Deployments → cliquer sur le déploiement en échec → **Building** → ouvrir les logs et lire la dernière erreur (souvent une ligne en rouge).

2. **Vérifications courantes** :
   - **Node** : le projet impose Node 20 (`.nvmrc` + `engines` dans `package.json`). Si besoin, dans Vercel → Settings → General → **Node.js Version** = 20.x.
   - **Install** : la commande d’install est `npm install --legacy-peer-deps` (déjà dans `vercel.json`). Ne pas la changer sauf si tu as une raison.
   - **Variables au build** : le build Vite n’a pas besoin de secrets pour réussir. Tu peux définir `VITE_API_URL` et `VITE_CLERK_PUBLISHABLE_KEY` dans Vercel (Settings → Environment Variables) pour que l’app les utilise en prod ; si elles manquent, le build passe quand même (l’app peut afficher des warnings en console).

3. **Erreur mémoire (OOM)** : si les logs indiquent un crash mémoire, dans Vercel → Settings → General → **Build Command** override avec :  
   `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

4. **« Hobby accounts are limited to daily cron jobs »** : sur le plan Hobby, les crons ne peuvent s’exécuter qu’**une fois par jour**. Dans `vercel.json`, les crons sont donc en `0 2 * * *` et `0 3 * * *` (une fois par jour). Si vous passez en Pro, vous pouvez remettre par ex. `0 */2 * * *` (toutes les 2 h) et `0 * * * *` (toutes les heures).
