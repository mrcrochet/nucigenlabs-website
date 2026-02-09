# PHASE 1: Event Extraction MVP - Setup Guide

## ✅ Deliverables créés

1. **`phase1_nucigen_events_table.sql`** - Migration SQL pour créer la table `nucigen_events`
2. **`src/server/phase1/event-extractor.ts`** - Service d'extraction utilisant OpenAI
3. **`src/server/phase1/phase1_validate.ts`** - Script de validation sur 10 articles
4. **`src/server/phase1/PROMPT_FINAL.md`** - Prompt final utilisé
5. **`src/server/phase1/README.md`** - Documentation

## 🚀 Étapes pour exécuter la Phase 1

### 1. Installer les dépendances

```bash
npm install openai
npm install -D tsx  # Pour exécuter les scripts TypeScript
```

### 2. Configurer les variables d'environnement

Ajoutez à votre `.env` :

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...  # Service role key (pas anon key)
```

### 3. Appliquer la migration SQL

1. Allez sur Supabase Dashboard → SQL Editor
2. Exécutez le contenu de `phase1_nucigen_events_table.sql`
3. Vérifiez que la table `nucigen_events` a été créée

### 4. Préparer des données de test

Insérez au moins 10 articles dans la table `events` :

```sql
-- Exemple d'insertion
INSERT INTO events (source, source_id, title, description, content, published_at, url, status)
VALUES 
  ('manual', 'test-1', 
   'EU Announces New Sanctions on Russian Energy', 
   'The European Union has announced expanded sanctions targeting Russian energy exports, including refined petroleum products.',
   'The European Union has announced expanded sanctions targeting Russian energy exports, including refined petroleum products. The measures are expected to impact global energy markets and supply chains. Energy prices are likely to adjust as markets price in reduced supply from Russia.',
   NOW() - INTERVAL '1 day',
   'https://example.com/article1',
   'pending'),
  
  ('manual', 'test-2',
   'Taiwan Semiconductor Factory Closure',
   'Major TSMC facility halts operations due to power grid instability.',
   'Major TSMC facility halts operations due to power grid instability. Supply chain disruption expected across consumer electronics and automotive sectors within 12-24 hours.',
   NOW() - INTERVAL '2 hours',
   'https://example.com/article2',
   'pending');
   
-- Ajoutez 8 autres articles similaires
```

### 5. Exécuter la validation

```bash
npm run phase1:validate
```

Ou directement :

```bash
npx tsx src/server/phase1/phase1_validate.ts
```

## 📊 Résultats attendus

Le script de validation va :
1. ✅ Extraire 10 événements
2. ✅ Valider le schéma JSON
3. ✅ Vérifier les scores (0-1)
4. ✅ Générer un rapport avec :
   - Taux de succès
   - Score de confiance moyen
   - Score d'impact moyen
   - Exemples d'événements extraits

## ✅ Critères de validation

La Phase 1 est validée si :
- ✅ Taux de succès >= 80%
- ✅ Tous les JSON sont valides
- ✅ Tous les scores sont dans [0, 1]
- ✅ Pas de champs inventés
- ✅ 10 rows créées dans `nucigen_events`

## 📝 Prochaines étapes

Une fois la Phase 1 validée, vous pouvez :
1. Examiner les événements extraits dans `nucigen_events`
2. Ajuster le prompt si nécessaire
3. Demander "PHASE 1 ready for review" avec :
   - Prompt final
   - Extrait de 2 events structurés (JSON)
   - Résultats du script de validation

