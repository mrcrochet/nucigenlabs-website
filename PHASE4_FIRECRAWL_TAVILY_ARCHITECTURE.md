# PHASE 4: Firecrawl & Tavily Integration (CORRECTED)

## 🎯 Objectif

**IMPORTANT**: Tavily et Firecrawl sont des outils d'**enrichissement et vérification uniquement**, pas des sources primaires.

Enrichir les events existants avec :
- **Tavily** : Contexte historique, événements similaires, validation des effets
- **Firecrawl** : Documents officiels ciblés (whitelist uniquement)

---

## 📊 Architecture Corrigée

### 1. **Tavily Integration**
**Rôle** : Enrichir le contexte des events existants

**Workflow** :
```
nucigen_events (après Phase 1 + 2B)
  ↓
Tavily Context Enrichment → event_context
  - historical_context (événements similaires passés)
  - background_explanation (explications de fond)
  - validation_notes (validation second-order effects)
  ↓
Enrichit "Why it matters" avec contexte
```

**Règles** :
- ❌ Tavily ne détecte JAMAIS de nouveaux events
- ✅ Tavily s'exécute UNIQUEMENT après qu'un event existe
- ✅ Tavily enrichit "Why it matters" et ajoute du contexte
- ✅ Tavily ne déclenche pas d'alerts directement

---

### 2. **Firecrawl Integration**
**Rôle** : Cibler des sources officielles spécifiques

**Workflow** :
```
events (URL détectée dans whitelist)
  ↓
Firecrawl (whitelist check) → official_documents
  - Domaines whitelistés uniquement
  - Gouvernement, régulateurs, institutions
  - Documents complets non disponibles via NewsAPI
  ↓
Enrichit events avec official_content
```

**Règles** :
- ❌ Pas de crawling large
- ❌ Pas de scraping de news à grande échelle
- ✅ Firecrawl cible uniquement des domaines whitelistés
- ✅ Firecrawl complète les events existants, ne remplace pas l'ingestion

**Whitelist de domaines** (exemples) :
- `gov.uk`, `gov.fr`, `europa.eu` (gouvernements)
- `sec.gov`, `fca.org.uk` (régulateurs)
- `federalreserve.gov`, `ecb.europa.eu` (banques centrales)
- `who.int`, `un.org` (organisations internationales)

---

## 🗄️ Database Schema

### Table: `event_context` (Tavily)
```sql
CREATE TABLE event_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nucigen_event_id UUID REFERENCES nucigen_events(id) ON DELETE CASCADE NOT NULL,
  
  -- Contexte historique
  historical_context TEXT, -- Événements similaires passés
  similar_events JSONB, -- Array de {title, date, relevance}
  
  -- Explications de fond
  background_explanation TEXT, -- Explications contextuelles
  
  -- Validation
  validation_notes TEXT, -- Notes sur validation des second-order effects
  
  -- Métadonnées
  enriched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `official_documents` (Firecrawl)
```sql
CREATE TABLE official_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  nucigen_event_id UUID REFERENCES nucigen_events(id) ON DELETE CASCADE,
  
  -- Document info
  url TEXT NOT NULL,
  title TEXT,
  content TEXT, -- Full scraped content
  markdown TEXT, -- Markdown version
  
  -- Source
  domain TEXT NOT NULL, -- Must be in whitelist
  source_type TEXT CHECK (source_type IN ('government', 'regulator', 'institution', 'central_bank')),
  
  -- Métadonnées
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `firecrawl_whitelist` (Configuration)
```sql
CREATE TABLE firecrawl_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL, -- e.g., 'gov.uk'
  source_type TEXT CHECK (source_type IN ('government', 'regulator', 'institution', 'central_bank')),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔧 Services Refactorisés

### 1. `tavily-context-service.ts`
```typescript
// Enrichir avec contexte historique
async function enrichEventContext(nucigenEventId: string): Promise<{
  historical_context: string;
  similar_events: Array<{title: string, date: string, relevance: number}>;
  background_explanation: string;
  validation_notes: string;
}>
```

### 2. `firecrawl-official-service.ts`
```typescript
// Scraper uniquement si domaine dans whitelist
async function scrapeOfficialDocument(
  url: string,
  checkWhitelist: boolean = true
): Promise<{
  content: string;
  markdown?: string;
  domain: string;
} | null>
```

---

## 🔄 Intégration Pipeline

### Workflow Correct
```
1. Data Collector → events (title, description, url)
2. Event Processor → nucigen_events (Phase 1 + 2B)
3. Tavily Context Enricher → event_context (contexte historique)
4. Firecrawl Official Enricher → official_documents (si whitelist)
5. EventDetail affiche contexte + documents officiels
```

---

## 📝 Implementation Plan

### Step 1: Database Migrations
- [ ] Créer `event_context` table
- [ ] Créer `official_documents` table
- [ ] Créer `firecrawl_whitelist` table
- [ ] Populer whitelist avec domaines officiels

### Step 2: Tavily Context Service
- [ ] Refactoriser `tavily-service.ts` → `tavily-context-service.ts`
- [ ] Rechercher événements similaires passés
- [ ] Générer contexte historique
- [ ] Valider second-order effects

### Step 3: Firecrawl Official Service
- [ ] Refactoriser `firecrawl-service.ts` → `firecrawl-official-service.ts`
- [ ] Implémenter whitelist check
- [ ] Scraper uniquement domaines whitelistés
- [ ] Extraire contenu structuré

### Step 4: Workers
- [ ] `context-enricher.ts` (Tavily)
- [ ] `official-document-enricher.ts` (Firecrawl)

### Step 5: Frontend
- [ ] Afficher contexte historique dans EventDetail
- [ ] Afficher documents officiels
- [ ] Section "Historical Context" et "Official Sources"

---

## 🎯 Success Metrics

- ✅ 80%+ des events ont contexte historique enrichi (Tavily)
- ✅ Documents officiels disponibles pour events pertinents (Firecrawl)
- ✅ EventDetail affiche contexte + documents (pas juste placeholder)
- ✅ Whitelist respectée (0% de crawling non autorisé)

---

## ⚠️ Règles Strictes

### Tavily
- ❌ Ne jamais utiliser pour détecter de nouveaux events
- ✅ Uniquement pour enrichir events existants
- ✅ Focus sur contexte historique et validation

### Firecrawl
- ❌ Ne jamais scraper toutes les URLs
- ✅ Whitelist uniquement
- ✅ Focus sur sources officielles (gouvernement, régulateurs)
