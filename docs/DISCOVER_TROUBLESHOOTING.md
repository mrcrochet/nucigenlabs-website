# 🔧 Dépannage de la Page Discover

## ❌ Erreur : "Failed to fetch discover items: Internal Server Error"

### Cause la plus fréquente

Le serveur API n'est **pas en cours d'exécution**. Le frontend (Vite) fait des requêtes vers `/api/discover` qui sont proxifiées vers `http://localhost:3001/discover`, mais si le serveur API n'est pas démarré, la requête échoue.

---

## ✅ Solution Rapide

### Étape 1 : Démarrer le serveur API

Dans un **nouveau terminal**, exécutez :

```bash
npm run api:server
```

Vous devriez voir :

```
🚀 API Server running on http://localhost:3001
   Health: http://localhost:3001/health
   Discover Feed: GET http://localhost:3001/api/discover
   Server is ready to accept requests. Press Ctrl+C to stop.
```

### Étape 2 : Vérifier que le serveur fonctionne

Ouvrez un navigateur et allez sur : http://localhost:3001/health

Vous devriez voir :

```json
{
  "status": "ok",
  "services": {
    "twelvedata": "configured",
    "supabase": "configured",
    "perplexity": "configured",
    "eventregistry": "configured"
  }
}
```

### Étape 3 : Tester l'endpoint Discover

Allez sur : http://localhost:3001/discover?category=all&offset=0&limit=12

Vous devriez voir une réponse JSON avec des items.

### Étape 4 : Rafraîchir la page Discover

Retournez sur http://localhost:5173/discover et rafraîchissez la page.

---

## 🔍 Diagnostic Avancé

### Vérifier que le serveur API est en cours d'exécution

```bash
# Vérifier les processus
ps aux | grep "api-server"

# Ou vérifier le port
lsof -i :3001
```

### Vérifier la base de données

```bash
npm run discover:check
```

Cela vérifie :
- ✅ Si la table `events` existe
- ✅ Si les colonnes `discover_*` existent
- ✅ Si des données sont présentes

### Vérifier les logs du serveur API

Si le serveur API est en cours d'exécution, regardez les logs dans le terminal où vous l'avez démarré. Vous devriez voir :

```
[API] Discover request: { category: 'all', offset: 0, ... }
[Discover Service] Fetching items with filters: ...
[Discover Service] Query executed. Results: 12 events
[API] Discover response: { items: 12, total: 12, hasMore: true }
```

Si vous voyez des erreurs, notez-les et consultez la section "Erreurs Courantes" ci-dessous.

---

## 🐛 Erreurs Courantes

### Erreur : "Cannot connect to API server"

**Cause** : Le serveur API n'est pas démarré.

**Solution** : 
```bash
npm run api:server
```

---

### Erreur : "Discover columns not found"

**Cause** : La migration SQL n'a pas été appliquée.

**Solution** :
1. Allez sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Exécutez le contenu de `supabase/migrations/20260110000000_add_discover_columns_to_events.sql`

Ou vérifiez avec :
```bash
npm run discover:check
```

---

### Erreur : "No items found"

**Cause** : Aucune donnée n'a été collectée dans la table `events`.

**Solution** :
```bash
npm run discover:collect
```

Cela collecte des articles, événements et tendances depuis EventRegistry et les insère dans la table `events`.

---

### Erreur : "Connection refused" dans les logs du proxy

**Cause** : Le proxy Vite ne peut pas se connecter au serveur API.

**Solution** :
1. Vérifiez que le serveur API est bien démarré sur le port 3001
2. Vérifiez que `vite.config.ts` a la bonne configuration :
   ```typescript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:3001',
         changeOrigin: true,
         rewrite: (path) => path.replace(/^\/api/, ''),
       },
     },
   }
   ```

---

## 📋 Checklist de Vérification

Avant de signaler un problème, vérifiez :

- [ ] Le serveur API est démarré (`npm run api:server`)
- [ ] Le serveur API répond sur http://localhost:3001/health
- [ ] L'endpoint Discover répond : http://localhost:3001/discover
- [ ] La migration SQL a été appliquée (`npm run discover:check`)
- [ ] Des données existent dans la table `events` (`npm run discover:check`)
- [ ] Les variables d'environnement sont configurées (voir `VERCEL_ENV_COMPLETE.md`)
- [ ] Le serveur de développement Vite est démarré (`npm run dev`)

---

## 🚀 Démarrage Complet (Nouveau Projet)

Si vous démarrez le projet pour la première fois :

1. **Installer les dépendances** :
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement** :
   ```bash
   cp env.template .env
   # Éditez .env et remplissez avec vos vraies valeurs
   ```

3. **Appliquer la migration SQL** :
   - Allez sur Supabase Dashboard → SQL Editor
   - Exécutez `supabase/migrations/20260110000000_add_discover_columns_to_events.sql`

4. **Collecter des données** :
   ```bash
   npm run discover:collect
   ```

5. **Démarrer le serveur API** (dans un terminal) :
   ```bash
   npm run api:server
   ```

6. **Démarrer le serveur de développement** (dans un autre terminal) :
   ```bash
   npm run dev
   ```

7. **Ouvrir la page Discover** :
   - Allez sur http://localhost:5173/discover

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. Vérifiez les logs du serveur API
2. Vérifiez la console du navigateur (F12)
3. Exécutez le diagnostic :
   ```bash
   npx tsx src/server/scripts/diagnose-discover.ts
   ```
4. Notez les messages d'erreur exacts
5. Vérifiez que toutes les variables d'environnement sont configurées (voir `VERCEL_ENV_COMPLETE.md`)

---

**Dernière mise à jour** : Janvier 2025
