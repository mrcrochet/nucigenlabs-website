# Economic Data Service

## Overview

This service replaces any Trading Economics API dependencies by using **Perplexity AI** to fetch economic data and market indicators in real-time.

## Why This Solution?

- ✅ **No external API key needed** - Uses existing Perplexity API
- ✅ **Real-time data** - Perplexity searches the web for current information
- ✅ **Comprehensive** - Can fetch any economic indicator or market data
- ✅ **Reliable** - Uses the same infrastructure as other Perplexity services

## API Endpoints

### 1. Get Economic Indicators

**GET** `/api/economic-data/indicators`

Get current economic indicators (GDP, inflation, unemployment, interest rates, etc.)

**Query Parameters:**
- `country` (optional): Filter by country (e.g., "United States", "China")
- `indicators` (optional): Comma-separated list of specific indicators

**Example:**
```bash
GET /api/economic-data/indicators?country=United%20States&indicators=GDP,inflation,unemployment
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "GDP Growth",
      "value": "2.1%",
      "change": "+0.3%",
      "change_percent": 0.3,
      "date": "2024-01-15",
      "source": "https://..."
    },
    {
      "name": "Inflation Rate",
      "value": "3.2%",
      "change": "-0.1%",
      "change_percent": -0.1,
      "date": "2024-01-15",
      "source": "https://..."
    }
  ]
}
```

### 2. Get Market Indicators

**GET** `/api/economic-data/market-indicators`

Get market indicators (commodities, currencies, bond yields)

**Query Parameters:**
- `type` (optional): `commodities` | `currencies` | `bonds` | `all`

**Example:**
```bash
GET /api/economic-data/market-indicators?type=commodities
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "indicator": "Crude Oil (WTI)",
      "value": "75.50",
      "previous": "74.20",
      "change": "+1.30",
      "unit": "USD",
      "date": "2024-01-15"
    },
    {
      "indicator": "Gold",
      "value": "2025.00",
      "previous": "2018.50",
      "change": "+6.50",
      "unit": "USD",
      "date": "2024-01-15"
    }
  ]
}
```

### 3. Get Economic Calendar

**GET** `/api/economic-data/calendar`

Get upcoming economic events and releases

**Query Parameters:**
- `days` (optional): Number of days ahead to fetch (default: 7)

**Example:**
```bash
GET /api/economic-data/calendar?days=14
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-16",
      "event": "US CPI Release",
      "country": "United States",
      "impact": "high",
      "previous": "3.2%",
      "forecast": "3.1%"
    },
    {
      "date": "2024-01-17",
      "event": "ECB Interest Rate Decision",
      "country": "Eurozone",
      "impact": "high",
      "previous": "4.5%",
      "forecast": "4.5%"
    }
  ]
}
```

### 4. Health Check

**GET** `/api/economic-data/health`

Check if the economic data service is operational

**Response:**
```json
{
  "status": "ok",
  "service": "economic-data",
  "provider": "perplexity",
  "message": "Economic data service is operational (using Perplexity AI)"
}
```

## Usage in Frontend

```typescript
// Fetch economic indicators
const response = await fetch('/api/economic-data/indicators?country=United%20States');
const { data } = await response.json();

// Fetch market indicators
const marketResponse = await fetch('/api/economic-data/market-indicators?type=commodities');
const { data: marketData } = await marketResponse.json();

// Fetch economic calendar
const calendarResponse = await fetch('/api/economic-data/calendar?days=7');
const { data: calendarData } = await calendarResponse.json();
```

## Migration from Trading Economics

If you were using Trading Economics API before:

1. **Replace API calls** with the new endpoints above
2. **Update data structures** to match the new response format
3. **No API key needed** - Uses existing Perplexity configuration

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common error codes:
- `PERPLEXITY_API_ERROR`: Perplexity API not configured or unavailable
- `RATE_LIMIT_ERROR`: Too many requests
- `INVALID_REQUEST`: Invalid parameters

## Performance

- **Caching**: Consider implementing client-side caching for frequently accessed data
- **Rate Limits**: Perplexity has rate limits - use responsibly
- **Response Time**: Typically 2-5 seconds (Perplexity needs to search the web)

## Future Enhancements

- [ ] Add caching layer for frequently requested indicators
- [ ] Add WebSocket support for real-time updates
- [ ] Add historical data support
- [ ] Add data visualization helpers
