# PHASE 1: Event Extraction MVP

## Objectif

Transformer un article brut (row dans `events`) en un objet `nucigen_event` structuré et fiable.

## Setup

### 1. Variables d'environnement

Ajoutez à votre `.env` :

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 2. Installer les dépendances

```bash
npm install openai
```

### 3. Appliquer la migration SQL

Exécutez `phase1_nucigen_events_table.sql` dans Supabase SQL Editor.

### 4. Préparer des données de test

Insérez quelques articles dans la table `events` :

```sql
INSERT INTO events (source, source_id, title, description, content, published_at, url, status)
VALUES 
  ('manual', 'test-1', 'EU Announces New Sanctions on Russian Energy', 
   'The European Union has announced expanded sanctions targeting Russian energy exports...',
   'Full article content here...',
   NOW(), 'https://example.com/article1', 'pending'),
  -- ... plus d'articles
```

## Utilisation

### Extraire un événement unique

```typescript
import { extractNucigenEvent } from './event-extractor';

const extracted = await extractNucigenEvent('event-id-here');
console.log(extracted);
```

### Valider la Phase 1

```bash
npx tsx src/server/phase1/phase1_validate.ts
```

Le script va :
1. Récupérer 10 événements en attente
2. Extraire chaque événement
3. Valider le schéma
4. Générer un rapport avec statistiques

## Deliverables

- ✅ Migration SQL (`phase1_nucigen_events_table.sql`)
- ✅ Service d'extraction (`event-extractor.ts`)
- ✅ Script de validation (`phase1_validate.ts`)
- ✅ Prompt final (dans `event-extractor.ts`)

## Prochaines étapes

Une fois la Phase 1 validée (>= 80% success rate), on passe à la Phase 2.

