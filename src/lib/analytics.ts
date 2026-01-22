/**
 * Analytics Service
 * 
 * Wrapper for analytics events tracking
 * Supports multiple providers (Sentry, custom, etc.)
 */

export type AnalyticsEvent = 
  | 'page_view'
  | 'item_view'
  | 'item_save'
  | 'item_share'
  | 'filter_change'
  | 'search_query'
  | 'scroll_depth'
  | 'time_on_page'
  | 'view_mode_change'
  | 'advanced_filter_apply'
  | 'filter_sector'
  | 'filter_region'
  | 'filter_entity'
  | 'prediction_view'
  | 'virtual_scroll_enabled';

/**
 * Track view mode change
 */
export function trackViewModeChange(mode: 'grid' | 'list', properties?: AnalyticsProperties): void {
  trackEvent('view_mode_change', {
    mode,
    ...properties,
  });
}

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Track an analytics event
 */
export function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  // Track in Sentry if available
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    (window as any).Sentry.addBreadcrumb({
      category: 'analytics',
      message: event,
      level: 'info',
      data: properties,
    });
  }

  // Track in console for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', event, properties);
  }

  // Track in custom analytics service (if configured)
  if (typeof window !== 'undefined' && (window as any).analytics) {
    try {
      (window as any).analytics.track(event, properties);
    } catch (err) {
      console.warn('[Analytics] Failed to track event:', err);
    }
  }

  // Send to backend analytics endpoint (optional)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties, timestamp: new Date().toISOString() }),
    }).catch(err => {
      // Silently fail - analytics should not break the app
      console.warn('[Analytics] Failed to send event:', err);
    });
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string, properties?: AnalyticsProperties): void {
  trackEvent('page_view', {
    page,
    ...properties,
  });
}

/**
 * Track item view
 */
export function trackItemView(itemId: string, properties?: AnalyticsProperties): void {
  trackEvent('item_view', {
    item_id: itemId,
    ...properties,
  });
}

/**
 * Track item save
 */
export function trackItemSave(itemId: string, properties?: AnalyticsProperties): void {
  trackEvent('item_save', {
    item_id: itemId,
    ...properties,
  });
}

/**
 * Track item share
 */
export function trackItemShare(itemId: string, platform: string, properties?: AnalyticsProperties): void {
  trackEvent('item_share', {
    item_id: itemId,
    platform,
    ...properties,
  });
}

/**
 * Track filter change
 */
export function trackFilterChange(filterType: string, value: string, properties?: AnalyticsProperties): void {
  trackEvent('filter_change', {
    filter_type: filterType,
    filter_value: value,
    ...properties,
  });
}

/**
 * Track search query
 */
export function trackSearchQuery(query: string, resultCount?: number, properties?: AnalyticsProperties): void {
  trackEvent('search_query', {
    query,
    result_count: resultCount,
    ...properties,
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(depth: number, properties?: AnalyticsProperties): void {
  trackEvent('scroll_depth', {
    depth,
    ...properties,
  });
}

/**
 * Track time on page
 */
export function trackTimeOnPage(seconds: number, properties?: AnalyticsProperties): void {
  trackEvent('time_on_page', {
    seconds,
    ...properties,
  });
}

/**
 * Track advanced filter application
 */
export function trackAdvancedFilterApply(
  filterType: 'sector' | 'region' | 'entity' | 'tag' | 'consensus' | 'tier',
  values: string[],
  properties?: AnalyticsProperties
): void {
  trackEvent('advanced_filter_apply', {
    filter_type: filterType,
    filter_values: values.join(','),
    filter_count: values.length,
    ...properties,
  });
}

/**
 * Track sector filter
 */
export function trackSectorFilter(sectors: string[], properties?: AnalyticsProperties): void {
  trackEvent('filter_sector', {
    sectors: sectors.join(','),
    sector_count: sectors.length,
    ...properties,
  });
}

/**
 * Track region filter
 */
export function trackRegionFilter(regions: string[], properties?: AnalyticsProperties): void {
  trackEvent('filter_region', {
    regions: regions.join(','),
    region_count: regions.length,
    ...properties,
  });
}

/**
 * Track entity filter
 */
export function trackEntityFilter(entities: string[], properties?: AnalyticsProperties): void {
  trackEvent('filter_entity', {
    entities: entities.join(','),
    entity_count: entities.length,
    ...properties,
  });
}

/**
 * Track prediction view
 */
export function trackPredictionView(eventId: string, properties?: AnalyticsProperties): void {
  trackEvent('prediction_view', {
    event_id: eventId,
    ...properties,
  });
}

/**
 * Track virtual scroll enabled
 */
export function trackVirtualScrollEnabled(itemCount: number, properties?: AnalyticsProperties): void {
  trackEvent('virtual_scroll_enabled', {
    item_count: itemCount,
    ...properties,
  });
}

/**
 * Analytics object for backward compatibility
 */
export const analytics = {
  trackEventClick: (itemId: string, index?: number, userId?: string) => {
    trackEvent('item_view', {
      item_id: itemId,
      index,
      user_id: userId,
    });
  },
  track: trackEvent,
  trackPageView,
  trackItemView,
  trackItemSave,
  trackItemShare,
  trackFilterChange,
  trackSearchQuery,
  trackScrollDepth,
  trackTimeOnPage,
  trackViewModeChange,
  trackAdvancedFilterApply,
  trackSectorFilter,
  trackRegionFilter,
  trackEntityFilter,
  trackPredictionView,
  trackVirtualScrollEnabled,
};
