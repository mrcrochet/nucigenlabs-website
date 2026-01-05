/**
 * API Optimizer - Maximize API Usage
 * 
 * Système intelligent pour maximiser l'utilisation des APIs :
 * - Parallélisation intelligente
 * - Batch processing optimisé
 * - Retry avec backoff exponentiel
 * - Rate limit detection et adaptation
 */

export interface ApiConfig {
  maxConcurrency: number; // Nombre de requêtes parallèles
  batchSize: number; // Taille des batches
  retryAttempts: number; // Nombre de tentatives
  retryDelay: number; // Délai initial entre retries (ms)
  rateLimitBuffer: number; // Buffer pour éviter les rate limits (%)
}

// Configurations par API
export const API_CONFIGS: Record<string, ApiConfig> = {
  openai: {
    maxConcurrency: 50, // OpenAI supporte beaucoup de requêtes parallèles
    batchSize: 100,
    retryAttempts: 5,
    retryDelay: 1000,
    rateLimitBuffer: 10, // 10% de marge
  },
  tavily: {
    maxConcurrency: 20, // Tavily peut gérer beaucoup de requêtes
    batchSize: 50,
    retryAttempts: 3,
    retryDelay: 500,
    rateLimitBuffer: 15,
  },
  firecrawl: {
    maxConcurrency: 10, // Firecrawl plus conservateur
    batchSize: 30,
    retryAttempts: 3,
    retryDelay: 2000,
    rateLimitBuffer: 20,
  },
};

/**
 * Exécute des tâches en parallèle avec contrôle de concurrence
 * Retourne les résultats et les erreurs séparément
 */
export async function parallelExecute<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  config: ApiConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<{ results: R[]; errors: Array<{ item: T; error: any }> }> {
  const results: R[] = [];
  const errors: Array<{ item: T; error: any }> = [];
  let completed = 0;
  const total = items.length;

  // Créer des batches
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += config.batchSize) {
    batches.push(items.slice(i, i + config.batchSize));
  }

  // Traiter chaque batch en parallèle
  for (const batch of batches) {
    const batchPromises = batch.map(async (item) => {
      let lastError: any;
      
      // Retry logic
      for (let attempt = 0; attempt < config.retryAttempts; attempt++) {
        try {
          const result = await processor(item);
          results.push(result);
          completed++;
          if (onProgress) onProgress(completed, total);
          return;
        } catch (error: any) {
          lastError = error;
          
          // Vérifier si c'est un rate limit
          const isRateLimit = 
            error?.message?.includes('rate limit') ||
            error?.message?.includes('429') ||
            error?.status === 429 ||
            error?.code === 'rate_limit_exceeded';

          if (isRateLimit && attempt < config.retryAttempts - 1) {
            // Backoff exponentiel pour rate limits
            const delay = config.retryDelay * Math.pow(2, attempt);
            console.warn(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${config.retryAttempts})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }

          // Si ce n'est pas un rate limit ou dernière tentative, break
          if (!isRateLimit || attempt === config.retryAttempts - 1) {
            break;
          }
        }
      }

      // Échec après tous les retries
      errors.push({ item, error: lastError });
      completed++;
      if (onProgress) onProgress(completed, total);
    });

    // Limiter la concurrence
    const chunks: Promise<void>[] = [];
    for (let i = 0; i < batchPromises.length; i += config.maxConcurrency) {
      const chunk = batchPromises.slice(i, i + config.maxConcurrency);
      chunks.push(Promise.all(chunk).then(() => {}));
    }

    // Exécuter les chunks séquentiellement mais items en parallèle dans chaque chunk
    for (const chunk of chunks) {
      await chunk;
    }
  }

  if (errors.length > 0) {
    console.warn(`[API Optimizer] ${errors.length} items failed after retries`);
  }

  return { results, errors };
}

/**
 * Exécute des tâches avec contrôle de débit (rate limiting intelligent)
 */
export async function rateLimitedExecute<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  requestsPerSecond: number,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = [];
  const delay = 1000 / requestsPerSecond; // Délai entre requêtes
  let completed = 0;

  for (const item of items) {
    const result = await processor(item);
    results.push(result);
    completed++;
    if (onProgress) onProgress(completed, items.length);

    // Délai entre requêtes (sauf pour la dernière)
    if (completed < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
}

/**
 * Détecte les rate limits et ajuste automatiquement
 */
export class RateLimitManager {
  private rateLimitHits: number = 0;
  private lastRateLimitTime: number = 0;
  private currentDelay: number = 1000;

  hitRateLimit() {
    this.rateLimitHits++;
    this.lastRateLimitTime = Date.now();
    this.currentDelay = Math.min(this.currentDelay * 2, 10000); // Max 10s
    console.warn(`[RateLimitManager] Rate limit hit. New delay: ${this.currentDelay}ms`);
  }

  getDelay(): number {
    // Réduire progressivement le délai si pas de rate limit récent
    const timeSinceLastHit = Date.now() - this.lastRateLimitTime;
    if (timeSinceLastHit > 60000) { // 1 minute sans rate limit
      this.currentDelay = Math.max(this.currentDelay * 0.9, 100); // Réduire de 10%, min 100ms
    }
    return this.currentDelay;
  }

  reset() {
    this.rateLimitHits = 0;
    this.currentDelay = 1000;
  }
}

/**
 * Batch processor optimisé avec parallélisation
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number,
  maxConcurrency: number = 5
): Promise<R[]> {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const results: R[] = [];

  // Traiter les batches en parallèle (limité par maxConcurrency)
  for (let i = 0; i < batches.length; i += maxConcurrency) {
    const batchChunk = batches.slice(i, i + maxConcurrency);
    const chunkResults = await Promise.all(
      batchChunk.map(batch => processor(batch))
    );
    results.push(...chunkResults.flat());
  }

  return results;
}

/**
 * Utilise les capacités complètes d'une API avec gestion intelligente
 */
export async function maximizeApiUsage<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  apiType: 'openai' | 'tavily' | 'firecrawl',
  onProgress?: (completed: number, total: number) => void
): Promise<{ results: R[]; errors: Array<{ item: T; error: any }> }> {
  const config = API_CONFIGS[apiType];
  const rateLimitManager = new RateLimitManager();

  const errors: Array<{ item: T; error: any }> = [];

  // Wrapper avec gestion de rate limits
  const safeProcessor = async (item: T): Promise<R> => {
    try {
      const result = await processor(item);
      return result;
    } catch (error: any) {
      const isRateLimit = 
        error?.message?.includes('rate limit') ||
        error?.message?.includes('429') ||
        error?.status === 429;

      if (isRateLimit) {
        rateLimitManager.hitRateLimit();
        const delay = rateLimitManager.getDelay();
        await new Promise(resolve => setTimeout(resolve, delay));
        // Retry une fois après le délai
        return processor(item);
      }
      throw error;
    }
  };

  const { results: processedResults, errors: processedErrors } = await parallelExecute(
    items,
    safeProcessor,
    config,
    onProgress
  );

  // Filter out undefined results (from errors)
  const validResults = processedResults.filter((r): r is R => r !== undefined);

  // Combine errors from parallelExecute with our own error tracking
  const allErrors = [...errors, ...processedErrors];

  return {
    results: validResults,
    errors: allErrors,
  };
}

