# 📡 API Endpoints Specification

## Overview

This document lists all API endpoints required by the dashboard UI components. These endpoints should be implemented on the backend API server (`src/server/api-server.ts`).

---

## 1. Overview Page Endpoints

### GET /api/overview/kpis
**Purpose:** Get KPI statistics for Overview page

**Response:**
```json
{
  "events_24h": {
    "count": 42,
    "delta": 5.2,
    "trend": [10, 15, 12, 18, 20, 16, 14]
  },
  "signals_24h": {
    "count": 8,
    "delta": -2.1,
    "trend": [5, 8, 6, 10, 12, 9, 7]
  },
  "high_impact_impacts_7d": {
    "count": 3,
    "delta": 0,
    "trend": [2, 3, 2, 4, 5, 3, 2]
  },
  "watchlist_volatility": {
    "value": "18.5%",
    "delta": 2.3,
    "trend": [15, 18, 16, 20, 22, 19, 17]
  }
}
```

### GET /api/overview/narrative?range=24h
**Purpose:** Get today's narrative (factual aggregation)

**Response:**
```json
{
  "bullets": [
    "Multiple geopolitical events detected in key regions.",
    "Market volatility increased across commodities sector."
  ],
  "linked_events": [
    { "id": "event_1", "headline": "Event 1" },
    { "id": "event_2", "headline": "Event 2" }
  ],
  "linked_tickers": [
    { "symbol": "AAPL", "name": "Apple Inc." }
  ],
  "linked_signal": {
    "id": "signal_1",
    "title": "Signal Title"
  }
}
```

### GET /api/markets/movers?range=24h
**Purpose:** Get market movers with sparklines

**Response:**
```json
{
  "movers": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "change_percent": 2.5,
      "volume": 50000000,
      "sparkline_data": [150, 152, 151, 153, 155, 154, 153]
    }
  ]
}
```

### GET /api/alerts/triggered?range=7d&limit=8
**Purpose:** Get triggered alerts

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_1",
      "title": "Alert Title",
      "severity": "critical",
      "triggered_at": "2024-01-15T10:00:00Z",
      "related_event_id": "event_1",
      "related_signal_id": "signal_1"
    }
  ]
}
```

---

## 2. Events Endpoints

### GET /api/events?{filters}
**Purpose:** Get normalized events with filters

**Query Parameters:**
- `dateFrom` (ISO-8601)
- `dateTo` (ISO-8601)
- `region` (string)
- `sector` (string)
- `eventType` (string)
- `source_type` (string)
- `confidence_min` (number)
- `confidence_max` (number)
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "events": [
    {
      "id": "event_1",
      "type": "event",
      "headline": "Event headline",
      "description": "Event description",
      "date": "2024-01-15T10:00:00Z",
      "location": "Location",
      "actors": ["Actor 1", "Actor 2"],
      "sectors": ["Energy"],
      "sources": [
        { "name": "Source Name", "url": "https://..." }
      ],
      "source_count": 3,
      "confidence": 85
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### GET /api/events/:id/context
**Purpose:** Get event context (related entities, assets, similar events)

**Response:**
```json
{
  "related_entities": [
    {
      "id": "entity_1",
      "name": "Entity Name",
      "type": "company"
    }
  ],
  "related_assets": [
    {
      "symbol": "AAPL",
      "name": "Apple Inc."
    }
  ],
  "similar_events": [
    {
      "id": "event_2",
      "headline": "Similar Event"
    }
  ]
}
```

---

## 3. Signals Endpoints

### GET /api/signals?{filters}
**Purpose:** Get signals with filters

**Query Parameters:**
- `dateFrom` (ISO-8601)
- `dateTo` (ISO-8601)
- `scope` (string)
- `horizon` (string)
- `min_impact` (number)
- `min_confidence` (number)
- `theme` (string)
- `sector` (string)
- `region` (string)
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "signals": [
    {
      "id": "signal_1",
      "type": "signal",
      "title": "Signal Title",
      "summary": "Signal summary",
      "impact_score": 85,
      "confidence_score": 90,
      "scope": "regional",
      "horizon": "short",
      "related_event_ids": ["event_1", "event_2"],
      "last_updated": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

### GET /api/signals/:id
**Purpose:** Get signal detail

**Response:**
```json
{
  "id": "signal_1",
  "type": "signal",
  "title": "Signal Title",
  "summary": "Signal summary",
  "impact_score": 85,
  "confidence_score": 90,
  "scope": "regional",
  "horizon": "short",
  "related_event_ids": ["event_1", "event_2"],
  "evidence_graph": {
    "nodes": [
      { "id": "event_1", "type": "event" },
      { "id": "entity_1", "type": "entity" }
    ],
    "edges": [
      { "from": "event_1", "to": "entity_1", "type": "linked_by" }
    ]
  },
  "market_validation": {
    "assets": [
      {
        "symbol": "AAPL",
        "correlation": 0.75,
        "sparkline_data": [150, 152, 151, 153]
      }
    ],
    "note": "validation based on price/volume changes, not causality"
  }
}
```

---

## 4. Markets Endpoints

### GET /api/markets/overview
**Purpose:** Get markets overview

**Response:**
```json
{
  "indices": [
    {
      "symbol": "SPX",
      "name": "S&P 500",
      "price": 4500,
      "change_percent": 0.5
    }
  ],
  "heatmap": {
    "watchlist": "default",
    "data": [
      {
        "symbol": "AAPL",
        "change_percent": 2.5,
        "sector": "Technology"
      }
    ]
  }
}
```

### GET /api/markets/asset/:symbol/history?range=1M
**Purpose:** Get asset price history

**Response:**
```json
{
  "symbol": "AAPL",
  "data": [
    {
      "timestamp": "2024-01-15T10:00:00Z",
      "price": 150.5,
      "volume": 50000000
    }
  ]
}
```

### GET /api/markets/asset/:symbol/metrics?range=1M
**Purpose:** Get asset metrics (volatility, etc.)

**Response:**
```json
{
  "symbol": "AAPL",
  "volatility": 15.5,
  "volume_avg": 45000000,
  "price_range": {
    "min": 145.0,
    "max": 155.0
  }
}
```

### GET /api/markets/asset/:symbol/attribution
**Purpose:** Get event attribution (temporal proximity)

**Response:**
```json
{
  "symbol": "AAPL",
  "attributions": [
    {
      "event_id": "event_1",
      "event_headline": "Event headline",
      "timestamp": "2024-01-15T10:00:00Z",
      "delta_percent": 2.5,
      "temporal_proximity": "within 24h"
    }
  ],
  "note": "Temporal proximity, not causality"
}
```

---

## 5. Impacts Endpoints

### GET /api/impacts?{filters}
**Purpose:** Get impacts with filters

**Query Parameters:**
- `probability_min` (number)
- `magnitude_min` (number)
- `timeframe` (string)
- `sector` (string)
- `region` (string)
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "impacts": [
    {
      "id": "impact_1",
      "type": "impact",
      "risk_headline": "Risk headline",
      "opportunity": "Opportunity description",
      "probability": 75,
      "magnitude": 80,
      "timeframe": "medium",
      "linked_signal_ids": ["signal_1"],
      "affected_assets": ["AAPL", "MSFT"]
    }
  ],
  "total": 20,
  "limit": 10,
  "offset": 0
}
```

### GET /api/impacts/:id
**Purpose:** Get impact detail

**Response:**
```json
{
  "id": "impact_1",
  "type": "impact",
  "scenario_summary": "Scenario summary",
  "assumptions": [
    "Assumption 1",
    "Assumption 2"
  ],
  "probability": 75,
  "magnitude": 80,
  "timeframe": "medium",
  "pathways": {
    "first_order_effects": [
      {
        "effect": "First order effect",
        "confidence": 85
      }
    ],
    "second_order_effects": [
      {
        "effect": "Second order effect",
        "confidence": 70
      }
    ]
  },
  "assets_exposure": [
    {
      "symbol": "AAPL",
      "exposure": "high",
      "sparkline_data": [150, 152, 151, 153]
    }
  ],
  "invalidation_conditions": [
    "Condition 1",
    "Condition 2"
  ]
}
```

---

## 6. Watchlists Endpoints

### GET /api/watchlists
**Purpose:** Get user watchlists

**Response:**
```json
{
  "watchlists": [
    {
      "id": "watchlist_1",
      "name": "Energy",
      "asset_count": 10,
      "keyword_count": 5,
      "last_active_signal": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### GET /api/watchlists/:id
**Purpose:** Get watchlist detail

**Response:**
```json
{
  "id": "watchlist_1",
  "name": "Energy",
  "assets": ["AAPL", "MSFT"],
  "keywords": ["energy", "oil"],
  "movers": [
    {
      "symbol": "AAPL",
      "change_percent": 2.5,
      "sparkline_data": [150, 152, 151, 153]
    }
  ],
  "events": [],
  "signals": [],
  "impacts": []
}
```

---

## 7. Entities Endpoints

### GET /api/entities?{filters}
**Purpose:** Get entities with filters

**Query Parameters:**
- `type` (string: company/person/country/org)
- `search` (string)
- `limit` (number)
- `offset` (number)

**Response:**
```json
{
  "entities": [
    {
      "id": "entity_1",
      "name": "Entity Name",
      "type": "company",
      "last_mention": "2024-01-15T10:00:00Z",
      "linked_assets": ["AAPL"]
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### GET /api/entities/:id
**Purpose:** Get entity detail

**Response:**
```json
{
  "id": "entity_1",
  "name": "Entity Name",
  "type": "company",
  "latest_events": [],
  "related_entities": [],
  "linked_assets": [],
  "risk_profile": {}
}
```

---

## Implementation Notes

1. **All endpoints should return UI contract-compliant types** (Signal, Event, Impact, etc.)
2. **All market data must include timestamps**
3. **All events must include sources**
4. **Temporal proximity, not causality** for market attribution
5. **Error handling:** Return appropriate HTTP status codes and error messages
6. **Pagination:** Use `limit` and `offset` for paginated endpoints
7. **Authentication:** All endpoints require authentication (Clerk user ID)

---

## Current Status

- ✅ Events endpoints: Partially implemented via `getNormalizedEvents()`
- ✅ Signals endpoints: Partially implemented via `getSignalsFromEvents()`
- ⏳ Markets endpoints: Need implementation
- ⏳ Impacts endpoints: Need implementation
- ⏳ Watchlists endpoints: Need implementation
- ⏳ Entities endpoints: Need implementation
