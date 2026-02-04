# Variables Vercel – minimum vital pour Nucigen (sans backend externe)

Noms **exacts** attendus par le code. À configurer dans **Vercel → Settings → Environment Variables** (Production au minimum).

---

## 1. Obligatoires – Frontend (`VITE_*`)

| Nom exact | Où trouver | Exemple (remplace par ta valeur) |
|-----------|-------------|-----------------------------------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk → API Keys → Publishable Key | `pk_test_...` ou `pk_live_...` |

⚠️ Orthographe exacte : `VITE_SUPABASE_ANON_KEY` (avec **L** dans SUPABASE).

---

## 2. Obligatoires – Backend / Serverless Vercel

Utilisées par les routes API (si tu as des serverless functions) ou par un backend déployé ailleurs.

| Nom exact | Où trouver | Exemple |
|-----------|-------------|---------|
| `SUPABASE_URL` | Même valeur que `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role (secret) | `eyJhbGciOiJIUzI1NiIs...` |
| `OPENAI_API_KEY` | platform.openai.com → API Keys | `sk-proj-...` |
| `TAVILY_API_KEY` | tavily.com → Dashboard → API Keys | `tvly-...` |
| `PERPLEXITY_API_KEY` | perplexity.ai → API | `pplx-...` |

Le code utilise **`PERPLEXITY_API_KEY`** (pas `PERPLEXITYAI_API_KEY`).

---

## 3. Recommandées (non bloquantes)

| Nom exact | Usage |
|-----------|--------|
| `EVENTREGISTRY_API_KEY` | Discover / EventRegistry |
| `FINNHUB_API_KEY` | Données marché |
| `TWELVEDATA_API_KEY` | Données marché / time series |
| `FIRECRAWL_API_KEY` | Enrichissement liens / Phase 4 |

Optionnel selon features : `VITE_NEWS_API_KEY`, `VITE_SENTRY_DSN`, `VITE_RESEND_API_KEY`, `VITE_RESEND_FROM_EMAIL`, `NEWS_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.

---

## 4. À ne pas mettre (ou à supprimer) si tout tourne sur Vercel

- **`VITE_API_URL`**  
  À **supprimer** si ton backend API est servi **dans le même projet Vercel** (serverless / rewrites vers des API routes).  
  Dans ce cas, le front appelle `/api/...` en relatif et Vercel route vers tes fonctions.

- À **garder** uniquement si ton backend Express tourne **ailleurs** (Railway, Render, etc.) : alors mets `VITE_API_URL=https://ton-backend.exemple.com` (sans slash final) et redéploie.

---

## 5. Après modification

1. **Redeploy** le projet (Deployments → ⋯ → Redeploy).  
   Les `VITE_*` sont injectées **au build**.
2. Test en console navigateur (F12) :
   ```js
   import.meta.env.VITE_SUPABASE_URL
   import.meta.env.VITE_SUPABASE_ANON_KEY
   ```
   Attendu : l’URL Supabase et une clé JWT longue. Si `undefined` → redeploy ou nom de variable incorrect.

---

## 6. Checklist

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `TAVILY_API_KEY`
- [ ] `PERPLEXITY_API_KEY`
- [ ] `VITE_API_URL` supprimée (si backend = même projet Vercel)
- [ ] Redeploy effectué

---

## 7. Les données ne se chargent pas (Corporate Impact, etc.)

| Message d’erreur côté app | Cause probable | Action |
|---------------------------|----------------|--------|
| *« La réponse reçue est une page web au lieu des données »* | L’app appelle `/api/...` mais reçoit la SPA (HTML). Sur Vercel, le backend Express n’est pas déployé par défaut. | **Option A** : Déployer le backend ailleurs (Railway, Render) et définir **`VITE_API_URL`** = URL de ce backend (sans slash final), puis redéployer le front. **Option B** : Ajouter des serverless functions Vercel pour les routes `/api/*` et adapter les rewrites (ne pas tout renvoyer vers `index.html`). |
| *« Supabase not configured »* | Le backend tourne mais les variables Supabase ne sont pas définies côté **serveur** (pas le front). | Vérifier **SUPABASE_URL** et **SUPABASE_SERVICE_ROLE_KEY** dans les variables d’environnement du **backend** (Railway, Vercel serverless, etc.). |
| *« Le service de données est temporairement indisponible »* ou *« Failed to fetch »* | Réseau ou backend injoignable (CORS, URL incorrecte, backend down). | Vérifier **VITE_API_URL** (orthographe, pas de slash final), que le backend est bien démarré et que CORS autorise l’origine du front. |

**Vérifications rapides**

- En production, si le backend est sur un autre domaine : `VITE_API_URL` doit être défini au **build** (Vercel → Environment Variables → redeploy).
- Les clés **SUPABASE_*** et **PERPLEXITY_*** sont utilisées par le **serveur API** ; les `VITE_*` sont utilisées par le navigateur. Ne pas confondre les deux environnements.

---

## 7. Les données ne se chargent pas (Corporate Impact, etc.)

Si la page affiche **"Error Loading Signals"** ou **"La réponse reçue est une page web au lieu des données"** :

1. **Sur Vercel sans backend déployé**  
   Le projet actuel envoie toutes les requêtes vers `index.html` (SPA). Les appels `/api/corporate-impact/signals` ne touchent donc **pas** un vrai backend.  
   → **Solution** : Déployer le backend Express ailleurs (ex. Railway, Render) et définir **`VITE_API_URL`** = URL de ce backend (sans slash final), puis redéployer le front sur Vercel.

2. **Message "Supabase not configured"**  
   Le backend répond bien en JSON mais Supabase n’est pas configuré côté serveur.  
   → Vérifier sur le **serveur qui exécute l’API** (Railway, Vercel serverless, etc.) : **`SUPABASE_URL`** et **`SUPABASE_SERVICE_ROLE_KEY`** doivent être renseignés (mêmes valeurs que dans Supabase → Settings → API).

3. **Vérifier la réponse API**  
   En local : `npm run api:server` puis ouvrir  
   `http://localhost:3001/api/corporate-impact/signals`  
   → Tu dois voir du JSON (`success`, `data.signals`). Si tu vois du HTML ou une erreur 503, le problème vient du backend ou des clés (Supabase, etc.).

4. **Check env backend (local)**  
   `npm run check-env:backend`  
   → Indique quelles variables backend manquent.

---

**Note** : Ton `.env` local contient les vraies valeurs. Pour Vercel, recopie **les mêmes** dans l’interface (Add Environment Variable), sans commiter le `.env`. Ce fichier liste uniquement les **noms** et où trouver les valeurs.
