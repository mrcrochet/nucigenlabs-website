/**
 * Validation Utilities
 * 
 * Provides Zod schemas and validation helpers for API endpoints
 */

import { z } from 'zod';

/**
 * Common validation schemas
 */
export const symbolSchema = z.string()
  .min(1, 'Symbol is required')
  .max(10, 'Symbol must be 10 characters or less')
  .regex(/^[A-Z0-9.]+$/, 'Symbol must contain only uppercase letters, numbers, and dots')
  .transform((val) => val.toUpperCase());

export const intervalSchema = z.enum([
  '1min', '5min', '15min', '30min', '45min',
  '1h', '2h', '4h', '1day', '1week', '1month'
], {
  errorMap: () => ({ message: 'Invalid interval. Must be one of: 1min, 5min, 15min, 30min, 45min, 1h, 2h, 4h, 1day, 1week, 1month' })
});

export const daysSchema = z.coerce.number()
  .int('Days must be an integer')
  .min(1, 'Days must be at least 1')
  .max(365, 'Days cannot exceed 365');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const emailSchema = z.string().email('Invalid email format');

export const urlSchema = z.string().url('Invalid URL format');

/**
 * Market data validation schemas
 */
export const marketDataParamsSchema = z.object({
  symbol: symbolSchema,
});

export const timeSeriesParamsSchema = z.object({
  symbol: symbolSchema,
});

export const timeSeriesQuerySchema = z.object({
  interval: intervalSchema.optional().default('1h'),
  days: daysSchema.optional().default(7),
});

/**
 * Alpha signals validation schemas
 */
export const alphaTechnicalParamsSchema = z.object({
  symbol: symbolSchema,
});

export const alphaTechnicalQuerySchema = z.object({
  interval: intervalSchema.optional().default('1h'),
  days: daysSchema.optional().default(30),
});

export const alphaSignalParamsSchema = z.object({
  symbol: symbolSchema,
  events: z.string().optional().transform((val) => 
    val ? val.split(',').filter(Boolean) : []
  ),
});

export const alphaSignalsBodySchema = z.object({
  symbols: z.array(symbolSchema).min(1, 'At least one symbol is required').max(50, 'Maximum 50 symbols allowed'),
  eventIds: z.array(uuidSchema).optional(),
  eventIdsBySymbol: z.record(z.string(), z.array(uuidSchema)).optional(),
});

/**
 * Search validation schemas
 */
export const searchQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Search query too long'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

/**
 * Sanitize string input (XSS protection)
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null && !Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitized[key].map((item: any) =>
        typeof item === 'string' ? sanitizeString(item) : typeof item === 'object' ? sanitizeObject(item) : item
      );
    }
  }
  
  return sanitized;
}

/**
 * Validate request with Zod schema
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        details: error,
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

/**
 * Express middleware for validation
 */
export function validate(schema: z.ZodSchema, source: 'params' | 'query' | 'body' = 'body') {
  return (req: any, res: any, next: any) => {
    const data = source === 'params' ? req.params : source === 'query' ? req.query : req.body;
    const result = validateRequest(schema, data);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: result.error,
        details: result.details?.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    
    // Replace the data with validated data
    if (source === 'params') {
      req.params = result.data;
    } else if (source === 'query') {
      req.query = result.data;
    } else {
      req.body = result.data;
    }
    
    next();
  };
}
