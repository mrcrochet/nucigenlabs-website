/**
 * Finnhub Service
 * 
 * API client for Finnhub financial data
 * https://finnhub.io/docs/api
 */

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd4ahl8pr01qnehvumlcgd4ahl8pr01qnehvumld0';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price
  l: number; // Low price
  o: number; // Open price
  pc: number; // Previous close
  t: number; // Timestamp
}

interface MarketData {
  symbol: string;
  name: string;
  price: string;
  change: number;
  changePercent: number;
}

interface CompanyData {
  symbol: string;
  name: string;
  price: string;
  changePercent: number;
}

/**
 * Get quote for a symbol
 */
export async function getQuote(symbol: string): Promise<FinnhubQuote | null> {
  try {
    // Don't clean symbol - use it as-is (Finnhub handles exchange prefixes like BINANCE:)
    const response = await fetch(
      `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`[Finnhub] HTTP error for ${symbol}:`, response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // Check if we got an error response from Finnhub
    if (data.error) {
      console.warn(`[Finnhub] API error for ${symbol}:`, data.error);
      return null;
    }
    
    // Check if data is valid (price > 0 or has valid change data)
    if (data.c === 0 && data.d === null && data.dp === null && data.pc === 0) {
      console.warn(`[Finnhub] Empty/invalid data for ${symbol}`);
      return null;
    }
    
    return data;
  } catch (error: any) {
    console.error(`[Finnhub] Network error for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Get market outlook data
 */
export async function getMarketOutlook(): Promise<MarketData[]> {
  // Use major indices and crypto that Finnhub supports
  // Tested symbols that work: SPY, QQQ, BINANCE:BTCUSDT, VIXY (VIX ETF proxy)
  const symbols = [
    { symbol: 'SPY', name: 'S&P 500', displaySymbol: 'ESUSD' }, // S&P 500 ETF
    { symbol: 'QQQ', name: 'NASDAQ', displaySymbol: 'NQUSD' }, // NASDAQ ETF
    { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', displaySymbol: 'BTCUSD' },
    { symbol: 'VIXY', name: 'VIX', displaySymbol: 'VIX' }, // VIX ETF (proxy for VIX index)
  ];

  const results = await Promise.all(
    symbols.map(async ({ symbol, name, displaySymbol }) => {
      try {
        const quote = await getQuote(symbol);
        if (!quote) {
          return null;
        }

        // Use current price, fallback to previous close if current is 0
        const price = quote.c > 0 ? quote.c : (quote.pc > 0 ? quote.pc : 0);
        
        // Only skip if we have absolutely no valid data
        // VIXY has valid data: c=25.48, d=-0.78, dp=-2.9703
        if (price === 0 && (quote.d === null || quote.d === undefined) && (quote.dp === null || quote.dp === undefined)) {
          console.warn(`[Finnhub] No valid data for ${symbol} (price: ${price}, d: ${quote.d}, dp: ${quote.dp})`);
          return null;
        }
        
        // Debug log for troubleshooting
        if (symbol === 'VIXY') {
          console.log(`[Finnhub] VIXY processing:`, { 
            symbol, 
            price, 
            c: quote.c, 
            pc: quote.pc, 
            d: quote.d, 
            dp: quote.dp,
            willInclude: price > 0 || quote.d !== null || quote.dp !== null
          });
        }

        // Format price appropriately
        let formattedPrice: string;
        if (price >= 1000) {
          formattedPrice = `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (price >= 1) {
          formattedPrice = `$${price.toFixed(2)}`;
        } else {
          formattedPrice = `$${price.toFixed(4)}`;
        }

        return {
          symbol: displaySymbol,
          name,
          price: formattedPrice,
          change: quote.d ?? 0,
          changePercent: quote.dp ?? 0,
        };
      } catch (error: any) {
        console.error(`[Finnhub] Error processing ${symbol}:`, error.message);
        return null;
      }
    })
  );

  return results.filter((r): r is MarketData => r !== null);
}

/**
 * Get trending companies
 */
export async function getTrendingCompanies(): Promise<CompanyData[]> {
  // Popular tech/finance stocks
  const symbols = [
    { symbol: 'TSM', name: 'Taiwan Semiconductor M.' },
    { symbol: 'GS', name: 'The Goldman Sachs Gro...' },
    { symbol: 'MS', name: 'Morgan Stanley' },
    { symbol: 'BLK', name: 'BlackRock, Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  ];

  const results = await Promise.all(
    symbols.map(async ({ symbol, name }) => {
      const quote = await getQuote(symbol);
      if (!quote || quote.c === 0 || quote.c === null) {
        console.warn(`[Finnhub] Invalid quote for ${symbol}, skipping`);
        return null;
      }

      return {
        symbol,
        name,
        price: `$${quote.c.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        changePercent: quote.dp || 0,
      };
    })
  );

  // Filter out nulls and sort by absolute change
  return results
    .filter((r): r is CompanyData => r !== null)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);
}
