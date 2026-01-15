# Perplexity API Setup Guide

This guide explains how to configure and use Perplexity API in Nucigen Labs.

## 📋 Overview

Perplexity API provides:
- **Advanced Research**: Real-time web search with citations
- **Contextual Analysis**: Deep analysis with historical context
- **Signal Enrichment**: Enhance signals with expert analysis and market implications
- **Future Finance Tools**: Market data, ticker lookup, SEC filings (coming soon)

**Roadmap**: https://docs.perplexity.ai/feature-roadmap#finance-tools-integration

## 🔧 Configuration

### 1. Get Your Perplexity API Key

1. Go to [Perplexity API Dashboard](https://www.perplexity.ai/settings/api)
2. Create an account or sign in
3. Generate a new API key
4. Copy your API key (it looks like: `pplx-xxxxxxxxxxxxx`)

### 2. Add Environment Variable

#### Local Development (.env)

Add to your `.env` file:

```env
PERPLEXITY_API_KEY=pplx-your-api-key-here
```

#### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:

| Key | Value | Environment |
|-----|-------|-------------|
| `PERPLEXITY_API_KEY` | `pplx-your-api-key-here` | Production, Preview, Development |

### 3. Verify Configuration

Check that Perplexity is configured:

```bash
# Health check endpoint
curl http://localhost:3001/api/perplexity/health
```

Or check the main health endpoint:

```bash
curl http://localhost:3001/health
```

## 🚀 Usage

### Signal Enrichment

Enrich signals with historical context, expert analysis, and market implications:

```typescript
import { enrichSignalWithPerplexity } from '../lib/api/perplexity-api';

const enrichment = await enrichSignalWithPerplexity(signalId, {
  signalTitle: 'Strike shuts lithium mine in Chile',
  signalSummary: 'Major lithium mine closure affects battery supply chain',
  sector: 'Energy',
  region: 'South America',
  user_preferences: {
    preferred_sectors: ['Energy', 'Technology'],
    preferred_regions: ['South America', 'Asia'],
  },
});

// Returns:
// {
//   historical_context: "Similar events in 2019...",
//   expert_analysis: "Industry analysts note...",
//   market_implications: "Based on historical data...",
//   citations: ["https://...", "https://..."],
//   related_questions: ["What are the alternatives?", ...],
//   confidence: 85
// }
```

### Direct Chat Completions

Use Perplexity for custom research queries:

```typescript
import { chatWithPerplexity } from '../lib/api/perplexity-api';

const response = await chatWithPerplexity({
  messages: [
    {
      role: 'system',
      content: 'You are a financial intelligence analyst.',
    },
    {
      role: 'user',
      content: 'Explain the impact of recent lithium supply disruptions on EV manufacturers',
    },
  ],
  model: 'sonar-pro',
  options: {
    return_citations: true,
    return_related_questions: true,
  },
});
```

## 📊 Features

### Current Features

- ✅ **Chat Completions**: Research and analysis with citations
- ✅ **Signal Enrichment**: Automatic enrichment of intelligence signals
- ✅ **Historical Context**: Similar events and their outcomes
- ✅ **Expert Analysis**: Industry analyst insights
- ✅ **Market Implications**: How events typically affect markets
- ✅ **Citations**: Reliable sources for verification

### Coming Soon (Perplexity Roadmap)

- 🔜 **Market Data Access**: Real-time and historical stock prices
- 🔜 **Ticker Symbol Lookup**: Intelligent company and symbol resolution
- 🔜 **Financial Analysis Tools**: Price history, trend analysis, market insights
- 🔜 **SEC Filing Integration**: Enhanced search and analysis of financial documents

## 🎯 Use Cases

### 1. Intelligence Feed Enhancement

Enrich signals displayed in `/intelligence` with:
- Historical precedents
- Expert opinions
- Market implications
- Reliable citations

### 2. Signal Detail Pages

When viewing a signal detail page, automatically fetch:
- Deep analysis of the signal
- Related questions users might have
- Citations for fact-checking

### 3. Research Page

Use Perplexity for:
- Deep research queries
- Multi-step reasoning
- Real-time web content analysis

## 🔍 API Endpoints

### POST `/api/perplexity/chat`

Direct chat completions with Perplexity.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Your question" }
  ],
  "model": "sonar-pro",
  "options": {
    "return_citations": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "choices": [{
      "message": {
        "content": "Answer...",
        "citations": ["https://..."]
      }
    }]
  }
}
```

### POST `/api/signals/:id/enrich`

Enrich a signal with Perplexity analysis.

**Request:**
```json
{
  "signalTitle": "Signal title",
  "signalSummary": "Signal summary",
  "sector": "Energy",
  "region": "South America",
  "user_preferences": {
    "preferred_sectors": ["Energy"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "historical_context": "...",
    "expert_analysis": "...",
    "market_implications": "...",
    "citations": ["https://..."],
    "confidence": 85
  }
}
```

### GET `/api/perplexity/health`

Check if Perplexity API is configured and working.

## ⚙️ Configuration Options

### Models Available

- `sonar`: Fast, general-purpose model
- `sonar-pro`: Advanced reasoning and analysis
- `sonar-reasoning`: Multi-step reasoning
- `sonar-online`: Real-time web search
- `llama-3.1-sonar-small-128k-online`: Small model with online search
- `llama-3.1-sonar-large-128k-online`: Large model with online search

### Search Options

- `search_domain_filter`: Filter by domain (e.g., `['financial', 'geopolitical']`)
- `search_recency_filter`: `'month' | 'week' | 'day' | 'hour'`
- `return_citations`: Include source citations
- `return_related_questions`: Include related questions
- `return_images`: Include images in response
- `return_videos`: Include videos in response

## 🛠️ Troubleshooting

### API Key Not Working

1. Verify the key is correct in `.env`
2. Check that the key starts with `pplx-`
3. Verify the key is active in Perplexity dashboard
4. Check rate limits (you may have exceeded them)

### Rate Limits

Perplexity has rate limits based on your tier:
- Free tier: Limited requests
- Paid tiers: Higher limits

If you hit rate limits:
- Implement caching for repeated queries
- Use batch requests when possible
- Consider upgrading your tier

### Errors

Common errors:
- `401 Unauthorized`: Invalid API key
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Perplexity service issue

Check logs in `src/server/api-server.ts` for detailed error messages.

## 📚 Resources

- [Perplexity API Documentation](https://docs.perplexity.ai/)
- [Perplexity API Roadmap](https://docs.perplexity.ai/feature-roadmap)
- [Perplexity Chat Completions Guide](https://docs.perplexity.ai/guides/chat-completions-guide)
- [Perplexity Search Guide](https://docs.perplexity.ai/guides/search-guide)

## ✅ Checklist

- [ ] Perplexity account created
- [ ] API key generated
- [ ] `PERPLEXITY_API_KEY` added to `.env` (local)
- [ ] `PERPLEXITY_API_KEY` added to Vercel environment variables
- [ ] Health check passing
- [ ] Test signal enrichment working
- [ ] Test chat completions working
