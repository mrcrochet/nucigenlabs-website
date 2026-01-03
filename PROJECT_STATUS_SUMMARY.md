# Nucigen Labs - Project Status Summary

**Date**: January 2025  
**Purpose**: Architecture overview for continuation with ChatGPT

---

## 🎯 Project Overview

**Nucigen Labs** is an intelligence platform that extracts structured events from news, generates causal chains, and provides personalized alerts. The platform uses LLMs (OpenAI) for extraction, Supabase for data storage, and React/TypeScript for the frontend.

---

## ✅ Completed Phases

### **PHASE 1: Event Extraction MVP** ✅

**Objective**: Transform raw articles into structured events

**Deliverables**:
- Database table: `nucigen_events` (structured events)
- Service: `src/server/phase1/event-extractor.ts`
- Validation script: `src/server/phase1/phase1_validate.ts`
- SQL migration: `phase1_nucigen_events_table.sql`

**Schema** (`nucigen_events`):
```sql
- id, source_event_id (FK → events)
- event_type: Geopolitical | Industrial | SupplyChain | Regulatory | Security | Market
- summary, country, region, sector, actors[]
- why_it_matters, first_order_effect, second_order_effect
- impact_score (0-1), confidence (0-1)
```

**Key Features**:
- LLM extraction using OpenAI (strict JSON schema)
- Quality validation (required fields, score ranges)
- RLS policies for authenticated users

**Status**: ✅ Complete and validated

---

### **PHASE 2B: Causal Chain Extraction** ✅

**Objective**: Generate structured causal chains from events

**Deliverables**:
- Database table: `nucigen_causal_chains`
- Service: `src/server/phase2b/causal-extractor.ts`
- Validation script: `src/server/phase2b/phase2b_validate.ts`
- SQL migration: `phase2b_causal_chains_table.sql`

**Schema** (`nucigen_causal_chains`):
```sql
- id, nucigen_event_id (FK → nucigen_events)
- cause, first_order_effect, second_order_effect
- affected_sectors[], affected_regions[]
- time_horizon: hours | days | weeks
- confidence (0-1)
```

**Key Features**:
- LLM extraction with strict rules (no price predictions, no financial figures)
- Logical consistency validation
- Time horizon classification

**Status**: ✅ Complete and validated

---

### **PHASE 2C: Events Page with Search & Filters** ✅

**Objective**: Display events with search, filters, and pagination

**Deliverables**:
- Page: `src/pages/Events.tsx`
- Features:
  - Search (summary, why_it_matters, causal chain)
  - Filters (sector, region, event_type, time_horizon)
  - Pagination (5 events per page)
  - Client-side filtering

**Status**: ✅ Complete

---

### **PHASE 2D: Product Architecture & Design Lock** ✅

**Objective**: Refactor application to match official sitemap

**Deliverables**:
- Official sitemap implemented:
  - `/dashboard` - Overview
  - `/intelligence` - Main feed
  - `/events` - Events list
  - `/events/[event_id]` - Event detail (SOURCE OF TRUTH)
  - `/alerts` - User alerts
  - `/research` - Placeholder
  - `/profile` - User profile
  - `/settings` - System settings
  - `/settings/alerts` - Alert preferences
  - `/quality` - Quality dashboard (Phase 3B)

**Shared UI Components**:
- `Card`, `Badge`, `Metric`, `SectionHeader`, `Timeline`, `MetaRow`
- Consistent dark theme, analyst-grade design

**Event Detail Page Structure** (SOURCE OF TRUTH):
1. Event Header (summary, country/region, sector, confidence, impact)
2. Why It Matters
3. Causal Chain (Cause → First-order → Second-order)
4. Exposure (sectors + regions)
5. Sources & Evidence (Phase 4)

**Status**: ✅ Complete

---

### **PHASE 3A: Pipeline Automation** ✅

**Objective**: Automate data collection and event processing

**Deliverables**:
- Worker: `src/server/workers/data-collector.ts`
  - Collects from NewsAPI (business, technology, general)
  - Deduplication by URL
  - Inserts into `events` table with `status: 'pending'`

- Worker: `src/server/workers/event-processor.ts`
  - Processes `pending` events
  - Calls Phase 1 (extraction) + Phase 2B (causal chains)
  - Updates status to `processed` or `error`

- Orchestrator: `src/server/workers/pipeline-orchestrator.ts`
  - Coordinates collection + processing
  - Configurable intervals (default: 1h collection, 15min processing)
  - Supports `runOnce` mode

**Pipeline Flow**:
```
1. Data Collector → events (status: pending)
2. Event Processor → nucigen_events + nucigen_causal_chains
3. Alerts Generator → user_alerts (Phase 3C)
```

**Status**: ✅ Complete and operational

---

### **PHASE 3B: Quality Improvement System** ✅

**Objective**: Monitor and improve extraction quality

**Deliverables**:
- Database tables:
  - `event_validations` (human validation of events)
  - `causal_chain_validations` (human validation of chains)
  - `prompt_feedback` (feedback for prompt improvement)
  - `quality_metrics` (aggregated daily metrics)

- Service: `src/server/phase3b/quality-service.ts`
  - Submit validations, feedback
  - Calculate quality metrics (accuracy, consistency, coverage, feedback scores)

- Calculator: `src/server/phase3b/quality-metrics-calculator.ts`
  - Daily aggregation of quality metrics

- Dashboard: `src/pages/QualityDashboard.tsx`
  - Display overall quality score
  - Phase 1 and Phase 2B metrics
  - Validation statistics

**SQL Migration**: `phase3b_quality_tables.sql`

**Status**: ✅ Complete

---

### **PHASE 3C: User Features (Alerts & Advanced Search)** ✅

**Objective**: Personalized alerts and alert management

**Deliverables**:
- Database tables:
  - `alert_preferences` (user alert settings)
  - `user_alerts` (generated alerts)

- Service: `src/server/phase3c/alerts-service.ts`
  - `getAlertPreferences`, `updateAlertPreferences`
  - `getUserAlerts`, `markAlertAsRead`, `dismissAlert`
  - `matchEventToPreferences` (matching logic)
  - `generateAlertsForEvent`, `generateAlertsForPendingEvents`

- Worker: `src/server/workers/alerts-generator.ts`
  - Generates alerts for new events matching user preferences
  - Called after event processing

- Pages:
  - `src/pages/Alerts.tsx` - Display user alerts
  - `src/pages/AlertSettings.tsx` - Configure alert preferences

**Alert Matching Logic**:
- Impact score threshold
- Confidence threshold
- Sector/region filters
- Event type filters
- Notification frequency (realtime, hourly, daily, weekly)

**SQL Migration**: `phase3c_alerts_tables.sql`

**Status**: ✅ Complete

---

### **PHASE 4: Firecrawl & Tavily Integration** ✅

**Objective**: Enrich events with historical context and official documents

**IMPORTANT**: Tavily and Firecrawl are **enrichment tools only**, NOT primary data sources.

#### **Tavily - Context Enrichment** ✅

**Purpose**: Enrich existing events with historical context

**Deliverables**:
- Service: `src/server/phase4/tavily-context-service.ts`
- Worker: `src/server/workers/context-enricher.ts`
- Database table: `event_context`
  - `historical_context` (similar past events)
  - `similar_events[]` (array of similar events)
  - `background_explanation` (why it matters)
  - `validation_notes` (second-order effects validation)

**Rules**:
- ❌ NEVER used to detect new events
- ✅ ONLY enriches existing events
- ✅ Runs AFTER Phase 2B (causal chains exist)

**Status**: ✅ Complete and tested (10 events enriched successfully)

#### **Firecrawl - Official Documents** ✅

**Purpose**: Scrape official documents from whitelisted domains only

**Deliverables**:
- Service: `src/server/phase4/firecrawl-official-service.ts`
- Worker: `src/server/workers/official-document-enricher.ts`
- Database tables:
  - `official_documents` (scraped documents)
  - `firecrawl_whitelist` (whitelist configuration)

**Whitelist Domains** (default):
- Governments: gov.uk, gov.fr, gov.de, gov.us, europa.eu
- Regulators: sec.gov, fca.org.uk, amf-france.org, bafin.de
- Central Banks: federalreserve.gov, ecb.europa.eu, bankofengland.co.uk
- International Orgs: who.int, un.org, imf.org, worldbank.org

**Rules**:
- ❌ NO broad crawling
- ❌ NO news scraping at scale
- ✅ ONLY whitelisted domains
- ✅ Complements existing events, does NOT replace ingestion

**Status**: ✅ Complete and configured (whitelist ready, waiting for whitelisted URLs)

**SQL Migration**: `phase4_context_tables.sql`

---

## 🗄️ Database Schema Overview

### Core Tables
- `events` - Raw articles from NewsAPI
- `nucigen_events` - Structured events (Phase 1)
- `nucigen_causal_chains` - Causal chains (Phase 2B)
- `users` - User profiles and authentication
- `event_context` - Historical context (Phase 4 - Tavily)
- `official_documents` - Official documents (Phase 4 - Firecrawl)
- `firecrawl_whitelist` - Whitelist configuration (Phase 4)

### Quality Tables (Phase 3B)
- `event_validations`
- `causal_chain_validations`
- `prompt_feedback`
- `quality_metrics`

### Alert Tables (Phase 3C)
- `alert_preferences`
- `user_alerts`

---

## 🔧 Technology Stack

### Frontend
- **React 19** + **TypeScript**
- **Tailwind CSS** (dark theme, analyst-grade design)
- **React Router DOM** (routing)
- **Supabase JS** (client-side auth & data)

### Backend
- **Node.js** + **TypeScript**
- **Supabase** (PostgreSQL database, auth, RLS)
- **OpenAI API** (GPT-4 for extraction)
- **Tavily API** (context enrichment)
- **Firecrawl API** (official document scraping)
- **NewsAPI** (data collection)

### Workers
- **tsx** (TypeScript execution)
- **dotenv** (environment variables)
- Sequential processing with rate limiting (delays between requests)

---

## 📁 Key File Structure

```
src/
├── pages/
│   ├── Dashboard.tsx
│   ├── IntelligenceFeed.tsx
│   ├── Events.tsx
│   ├── EventDetail.tsx (SOURCE OF TRUTH)
│   ├── Alerts.tsx
│   ├── AlertSettings.tsx
│   ├── QualityDashboard.tsx
│   └── ...
├── server/
│   ├── phase1/
│   │   ├── event-extractor.ts
│   │   └── phase1_validate.ts
│   ├── phase2b/
│   │   ├── causal-extractor.ts
│   │   └── phase2b_validate.ts
│   ├── phase3b/
│   │   ├── quality-service.ts
│   │   └── quality-metrics-calculator.ts
│   ├── phase3c/
│   │   ├── alerts-service.ts
│   │   └── init-alert-preferences.ts
│   ├── phase4/
│   │   ├── tavily-context-service.ts
│   │   ├── firecrawl-official-service.ts
│   │   └── verify-enrichment.ts
│   └── workers/
│       ├── data-collector.ts
│       ├── event-processor.ts
│       ├── pipeline-orchestrator.ts
│       ├── alerts-generator.ts
│       ├── context-enricher.ts
│       └── official-document-enricher.ts
└── lib/
    └── supabase.ts (database functions, auth)
```

---

## 🔑 Environment Variables

```env
# Supabase
SUPABASE_URL=...
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI
OPENAI_API_KEY=...

# NewsAPI
NEWS_API_KEY=...

# Phase 4
TAVILY_API_KEY=...
FIRECRAWL_API_KEY=...
```

---

## 🚀 Current Pipeline Flow

```
1. Data Collector (NewsAPI)
   ↓
   events (status: pending)

2. Event Processor
   ↓
   Phase 1: extractNucigenEvent()
   ↓
   nucigen_events
   ↓
   Phase 2B: extractCausalChain()
   ↓
   nucigen_causal_chains

3. Context Enricher (Tavily) - OPTIONAL
   ↓
   event_context

4. Official Document Enricher (Firecrawl) - OPTIONAL
   ↓
   official_documents (if URL whitelisted)

5. Alerts Generator
   ↓
   user_alerts (if matches preferences)
```

---

## 📊 Current Status

### ✅ Working Features
- Event extraction (Phase 1)
- Causal chain generation (Phase 2B)
- Events page with search/filters (Phase 2C)
- Complete UI with official sitemap (Phase 2D)
- Automated pipeline (Phase 3A)
- Quality monitoring (Phase 3B)
- User alerts (Phase 3C)
- Context enrichment (Phase 4 - Tavily)
- Official document scraping (Phase 4 - Firecrawl, configured)

### 📈 Metrics
- **Events processed**: ~10-50 per batch
- **Context enriched**: 10 events successfully enriched
- **Quality system**: Operational
- **Alerts system**: Operational

---

## 🎯 Design Principles

1. **Dark, analyst-grade UI**: Sparse use of accent color (red only for critical)
2. **Text-first**: No unnecessary graphics or charts
3. **Source of truth**: Event Detail page is the core
4. **No predictions**: Only structured analysis, no financial predictions
5. **Enrichment only**: Tavily/Firecrawl enrich, don't replace ingestion

---

## 🔜 Potential Next Steps

1. **Full-text search** with Supabase (improve Events/Intelligence search)
2. **Email notifications** for alerts
3. **Research module** (case studies, thematic analysis)
4. **Account management** in Settings
5. **API access** for enterprise
6. **Performance optimizations** (caching, indexing)
7. **Scale considerations** (Redis, job queues if needed)

---

## 📝 Important Notes for Continuation

1. **Tavily & Firecrawl**: Enrichment tools only, NOT primary sources
2. **Event Detail Page**: Source of truth, must always contain complete information
3. **No Redis yet**: Current architecture sufficient, add when scaling
4. **Sequential processing**: Workers process sequentially to respect rate limits
5. **RLS policies**: All tables have Row Level Security for authenticated users
6. **Strict JSON schemas**: LLM outputs validated strictly (no invented fields)

---

## 📚 Documentation Files

- `PHASE1_SETUP.md` - Phase 1 setup
- `PHASE2B_SETUP.md` - Phase 2B setup
- `PHASE3A_SETUP.md` - Pipeline automation
- `PHASE3B_SETUP.md` - Quality system
- `PHASE3C_SETUP.md` - Alerts system
- `PHASE4_SETUP.md` - Firecrawl & Tavily
- `PHASE4_FIRECRAWL_TAVILY_ARCHITECTURE.md` - Phase 4 architecture

---

**Last Updated**: January 2025  
**Status**: All phases complete and operational

