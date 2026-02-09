# PHASE 4: Firecrawl & Tavily Setup (CORRECTED)

## 🎯 Overview

**IMPORTANT**: Tavily et Firecrawl sont des outils d'**enrichissement uniquement**, pas des sources primaires.

Phase 4 enrichit les events existants avec :
- **Tavily** : Contexte historique, événements similaires, validation des effets
- **Firecrawl** : Documents officiels ciblés (whitelist uniquement)

---

## 📋 Prerequisites

1. **API Keys**:
   - Firecrawl API key: https://firecrawl.dev
   - Tavily API key: https://tavily.com

2. **Database Migration**:
   - Run `phase4_context_tables.sql` in Supabase SQL Editor

---

## 🔧 Setup Steps

### 1. Install Dependencies

```bash
npm install @mendable/firecrawl-js @tavily/core
```

### 2. Environment Variables

Add to your `.env` file:

```env
# Firecrawl
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Tavily
TAVILY_API_KEY=your_tavily_api_key
```

### 3. Database Migration

Run the SQL migration in Supabase:

```bash
# Copy the SQL from phase4_context_tables.sql
# Paste into Supabase SQL Editor
# Execute
```

This creates:
- `event_context` table (Tavily context)
- `official_documents` table (Firecrawl documents)
- `firecrawl_whitelist` table (whitelist configuration)
- Default whitelist domains (gov.uk, sec.gov, etc.)

### 4. Verify Setup

```bash
# Check environment variables
npm run check-env

# Test Tavily (optional)
npx tsx -e "import('./src/server/phase4/tavily-context-service.ts').then(m => console.log('Tavily available:', m.isTavilyAvailable()))"

# Test Firecrawl (optional)
npx tsx -e "import('./src/server/phase4/firecrawl-official-service.ts').then(m => console.log('Firecrawl available:', m.isFirecrawlAvailable()))"
```

---

## 🚀 Usage

### Context Enrichment (Tavily)

Enrich `nucigen_events` with historical context:

```bash
# Enrich pending events (default: 10 events)
npm run enrich:context

# Custom batch size
CONTEXT_ENRICHMENT_BATCH_SIZE=20 npm run enrich:context
```

**When to run**:
- After `pipeline:process` (after Phase 2B completes)
- Tavily enriches existing events, does NOT detect new ones

### Official Document Enrichment (Firecrawl)

Scrape official documents from whitelisted domains:

```bash
# Enrich pending events (default: 10 events)
npm run enrich:official

# Custom batch size
OFFICIAL_DOC_ENRICHMENT_BATCH_SIZE=20 npm run enrich:official
```

**When to run**:
- After `pipeline:collect` (when events with whitelisted URLs exist)
- Firecrawl only scrapes whitelisted domains

---

## 🔄 Pipeline Integration

### Workflow Correct

```bash
# 1. Collect events
npm run pipeline:collect

# 2. Process events (Phase 1 + 2B)
npm run pipeline:process

# 3. Enrich context (Tavily) - OPTIONAL
npm run enrich:context

# 4. Enrich official documents (Firecrawl) - OPTIONAL
npm run enrich:official

# 5. Generate alerts
npm run alerts:generate
```

### Automated Integration

Update `pipeline-orchestrator.ts` to include enrichment steps:

```typescript
// In runCycle function:
1. collectNewsEvents()
2. processPendingEvents()
3. enrichPendingEventsContext() // NEW (Tavily)
4. enrichPendingOfficialDocuments() // NEW (Firecrawl)
5. runAlertsGenerator()
```

---

## 📊 Database Schema

### `event_context` Table (Tavily)

```sql
- id: UUID
- nucigen_event_id: UUID (foreign key)
- historical_context: TEXT (similar past events)
- similar_events: JSONB (array of similar events)
- background_explanation: TEXT (why it matters)
- validation_notes: TEXT (second-order effects validation)
- enriched_at: TIMESTAMP
```

### `official_documents` Table (Firecrawl)

```sql
- id: UUID
- event_id: UUID (optional, foreign key)
- nucigen_event_id: UUID (optional, foreign key)
- url: TEXT
- title: TEXT
- content: TEXT (full scraped content)
- markdown: TEXT
- domain: TEXT (must be in whitelist)
- source_type: TEXT ('government' | 'regulator' | 'institution' | 'central_bank' | 'international_org')
- scraped_at: TIMESTAMP
```

### `firecrawl_whitelist` Table

```sql
- id: UUID
- domain: TEXT (unique, e.g., 'gov.uk')
- source_type: TEXT
- enabled: BOOLEAN
- notes: TEXT
```

**Default whitelist includes**:
- Governments: gov.uk, gov.fr, gov.de, gov.us, europa.eu
- Regulators: sec.gov, fca.org.uk, amf-france.org, bafin.de
- Central Banks: federalreserve.gov, ecb.europa.eu, bankofengland.co.uk
- International Orgs: who.int, un.org, imf.org, worldbank.org

---

## 🎨 Frontend Integration

### Update EventDetail.tsx

Display context and official documents:

```typescript
// Fetch context
const { data: context } = await supabase
  .from('event_context')
  .select('*')
  .eq('nucigen_event_id', eventId)
  .single();

// Fetch official documents
const { data: documents } = await supabase
  .from('official_documents')
  .select('*')
  .eq('nucigen_event_id', eventId)
  .order('scraped_at', { ascending: false });

// Display:
// - Historical Context section
// - Similar Events section
// - Official Documents section
```

---

## ⚡ Performance & Rate Limits

### Tavily
- **Rate Limits**: Check your Tavily plan
- **Recommendation**: 3 second delay between requests
- **Query Length**: Limited to 400 chars (handled automatically)

### Firecrawl
- **Rate Limits**: Check your Firecrawl plan
- **Recommendation**: 3 second delay between requests
- **Whitelist Check**: Always performed before scraping

### Batch Sizes
- **Default**: 10 events per batch
- **Adjustable**: Via environment variables
- **Sequential Processing**: To respect rate limits

---

## 🐛 Troubleshooting

### Tavily Issues

**Error: "No context generated"**
- Possible reasons:
  - Query too specific
  - Event summary too short
  - No relevant historical context available
- This is not an error, just logged as a warning

**Error: "Tavily rate limit exceeded"**
- Solution: Increase delay between requests
- Check your Tavily plan limits

### Firecrawl Issues

**Error: "Domain not in whitelist"**
- This is expected behavior
- Only whitelisted domains are scraped
- Add domain to `firecrawl_whitelist` table if needed

**Error: "Firecrawl rate limit exceeded"**
- Solution: Increase delay between requests
- Check your Firecrawl plan limits

### Database Issues

**Error: "relation event_context does not exist"**
- Solution: Run the SQL migration (`phase4_context_tables.sql`)

**Error: "No domains in whitelist"**
- Solution: Check `firecrawl_whitelist` table
- Default domains should be inserted by migration

---

## 📈 Success Metrics

After Phase 4, you should see:

- ✅ 80%+ of events have historical context (Tavily)
- ✅ Official documents available for relevant events (Firecrawl)
- ✅ EventDetail page shows context + documents (not placeholder)
- ✅ Whitelist respected (0% unauthorized crawling)

---

## ⚠️ Important Rules

### Tavily
- ❌ **NEVER** use to detect new events
- ✅ **ONLY** enrich existing events
- ✅ Focus on historical context and validation

### Firecrawl
- ❌ **NEVER** scrape all URLs
- ✅ **ONLY** whitelisted domains
- ✅ Focus on official sources (government, regulators)

---

## 🔜 Next Steps

1. **Integrate into Pipeline Orchestrator** (automated)
2. **Update EventDetail.tsx** (display context + documents)
3. **Add Context Filtering** (by relevance, date, etc.)
4. **Manage Whitelist** (add/remove domains as needed)

---

## 📚 Documentation

- [PHASE4_FIRECRAWL_TAVILY_ARCHITECTURE.md](./PHASE4_FIRECRAWL_TAVILY_ARCHITECTURE.md) - Full architecture
- [Firecrawl Docs](https://docs.firecrawl.dev)
- [Tavily Docs](https://docs.tavily.com)
