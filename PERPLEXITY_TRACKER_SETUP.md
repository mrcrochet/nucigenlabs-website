# Perplexity Discover Tracker - Configuration Automatique

## ✅ Implémentation Complète

Le système de tracking automatique de Perplexity Discover est maintenant configuré avec plusieurs options.

## 🎯 Options de Tracking Automatique

### Option 1 : Vercel Cron Jobs (Recommandé pour Vercel)

**Configuration :**
- ✅ Ajouté dans `vercel.json` : cron job toutes les 2 heures
- ✅ Endpoint créé : `GET /api/cron/track-perplexity`

**Activation :**
1. Le cron job est automatiquement activé sur Vercel après déploiement
2. Vérifiez dans Vercel Dashboard → Settings → Cron Jobs

**Configuration de sécurité (optionnel) :**
Ajoutez une variable d'environnement sur Vercel :
- `CRON_SECRET` ou `VERCEL_CRON_SECRET` : Un secret pour sécuriser l'endpoint

**Test manuel :**
```bash
curl https://votre-domaine.vercel.app/api/cron/track-perplexity
```

---

### Option 2 : GitHub Actions (Alternative)

**Configuration :**
- ✅ Fichier créé : `.github/workflows/track-perplexity.yml`
- ✅ Exécution : Toutes les 2 heures automatiquement
- ✅ Déclenchement manuel : Disponible dans GitHub Actions

**Activation :**
1. Poussez le fichier `.github/workflows/track-perplexity.yml` sur GitHub
2. Configurez les secrets dans GitHub :
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`
   - `FIRECRAWL_API_KEY`
   - `TAVILY_API_KEY`

**Test manuel :**
- GitHub → Actions → "Track Perplexity Discover" → "Run workflow"

---

### Option 3 : Script Local avec Cron (Pour serveur dédié)

**Configuration :**
```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne (toutes les 2 heures)
0 */2 * * * cd /path/to/nucigenlabs-landingpage && npm run track:perplexity >> /var/log/perplexity-tracker.log 2>&1
```

---

## 📊 Monitoring

### Vérifier les résultats

1. **Dans la base de données :**
```sql
SELECT * FROM events 
WHERE source = 'perplexity_discover' 
ORDER BY created_at DESC 
LIMIT 10;
```

2. **Dans la page Discover :**
- Ouvrir `http://localhost:5173/discover`
- Les topics Perplexity apparaissent avec `source = 'perplexity_discover'`

3. **Logs Vercel :**
- Vercel Dashboard → Functions → `/api/cron/track-perplexity`
- Voir les logs d'exécution

---

## 🔧 Configuration

### Variables d'environnement requises

**Pour le tracking :**
- `SUPABASE_URL` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `OPENAI_API_KEY` ✅
- `FIRECRAWL_API_KEY` (optionnel, fallback Tavily si absent)
- `TAVILY_API_KEY` ✅

**Pour la sécurité cron (optionnel) :**
- `CRON_SECRET` ou `VERCEL_CRON_SECRET`

---

## 📈 Statistiques

Le tracking collecte :
- **7 topics** en moyenne par exécution
- **Fréquence** : Toutes les 2 heures
- **Source** : Tavily (fallback si Firecrawl échoue)
- **Enrichissement** : OpenAI gpt-4o

---

## 🚀 Déploiement

### Pour Vercel

1. **Pousser les modifications :**
```bash
git add vercel.json src/server/api-server.ts
git commit -m "feat: Add automatic Perplexity tracking with Vercel Cron"
git push
```

2. **Vérifier le déploiement :**
- Vercel Dashboard → Deployments
- Attendre que le déploiement soit terminé

3. **Vérifier le cron :**
- Vercel Dashboard → Settings → Cron Jobs
- Vous devriez voir `/api/cron/track-perplexity` avec schedule `0 */2 * * *`

### Pour GitHub Actions

1. **Pousser le workflow :**
```bash
git add .github/workflows/track-perplexity.yml
git commit -m "feat: Add GitHub Actions for Perplexity tracking"
git push
```

2. **Configurer les secrets :**
- GitHub → Settings → Secrets and variables → Actions
- Ajouter tous les secrets requis

---

## ✅ Test

### Test manuel

```bash
# Test local
npm run track:perplexity

# Test endpoint (si serveur API tourne)
curl http://localhost:3001/api/cron/track-perplexity
```

---

## 📝 Notes

- Le tracking utilise Tavily comme fallback si Firecrawl échoue (normal pour Perplexity)
- Les topics sont automatiquement insérés dans la table `events` avec `source = 'perplexity_discover'`
- Déduplication automatique basée sur `source_id`
- Le système est déjà intégré dans le pipeline orchestrator (Step 1D)

---

## 🎉 Résultat

Votre feed Discover sera automatiquement enrichi avec les topics trending toutes les 2 heures !
