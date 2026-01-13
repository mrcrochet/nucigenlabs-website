/**
 * Analytics Utility
 * 
 * Centralized user action tracking for analytics
 * 
 * Note: recordUserAction is server-side only, so we'll create a client-side wrapper
 * that calls an API endpoint or stores actions locally
 */

interface AnalyticsEvent {
  action_type: 'click' | 'view' | 'read' | 'share' | 'bookmark' | 'ignore' | 'feedback_positive' | 'feedback_negative' | 'alert_created' | 'export' | 'deep_dive';
  event_id?: string;
  recommendation_id?: string;
  page_url?: string;
  referrer?: string;
  time_spent_seconds?: number;
  scroll_depth?: number;
  feed_position?: number;
  feed_type?: string;
  recommendation_priority?: string;
}

class Analytics {
  private sessionId: string;
  private startTime: number = Date.now();

  constructor() {
    // Generate session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Track a user action
   */
  async track(event: AnalyticsEvent, userId?: string): Promise<void> {
    if (!userId || typeof window === 'undefined') {
      return;
    }

    try {
      // Call API endpoint to track action (server-side will handle database insert)
      const apiUrl = '/api/track-action';
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventId: event.event_id,
          recommendationId: event.recommendation_id,
          actionType: event.action_type,
          sessionId: this.sessionId,
          pageUrl: event.page_url || window.location.href,
          referrer: event.referrer || document.referrer,
          timeSpentSeconds: event.time_spent_seconds,
          scrollDepth: event.scroll_depth,
          feedPosition: event.feed_position,
          feedType: event.feed_type,
          recommendationPriority: event.recommendation_priority,
        }),
      }).catch(() => {
        // Silently fail - analytics should never break the app
      });
    } catch (error) {
      // Silently fail - analytics should never break the app
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string, userId?: string): void {
    this.track({
      action_type: 'view',
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
    }, userId);
  }

  /**
   * Track click on event
   */
  trackEventClick(eventId: string, position?: number, userId?: string): void {
    this.track({
      action_type: 'click',
      event_id: eventId,
      feed_position: position,
      feed_type: 'intelligence',
    }, userId);
  }

  /**
   * Track feedback
   */
  trackFeedback(eventId: string, isPositive: boolean, userId?: string): void {
    this.track({
      action_type: isPositive ? 'feedback_positive' : 'feedback_negative',
      event_id: eventId,
    }, userId);
  }

  /**
   * Track time spent on page
   */
  trackTimeSpent(seconds: number, scrollDepth: number, userId?: string): void {
    this.track({
      action_type: 'read',
      time_spent_seconds: seconds,
      scroll_depth: scrollDepth,
    }, userId);
  }
}

// Singleton instance
export const analytics = new Analytics();
