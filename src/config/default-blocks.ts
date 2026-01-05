/**
 * Default Block Configurations
 * 
 * Defines the default block layouts for each page type
 */

import { Block } from '../types/blocks';

/**
 * Default blocks configuration for EventDetail page
 */
export const DEFAULT_EVENT_DETAIL_BLOCKS: Block[] = [
  {
    id: 'event_header',
    type: 'event_header',
    order: 1,
    visible: true,
    config: {
      showTags: true,
      showMetrics: true,
      showActions: true,
    },
  },
  {
    id: 'why_it_matters',
    type: 'why_it_matters',
    order: 2,
    visible: true,
    config: {
      expandable: true,
      maxLength: 200,
    },
  },
  {
    id: 'causal_chain',
    type: 'causal_chain',
    order: 3,
    visible: true,
    config: {
      showSecondOrder: true,
      layout: 'timeline',
      showMetadata: true,
    },
  },
  {
    id: 'exposure',
    type: 'exposure',
    order: 4,
    visible: true,
    config: {
      showSectors: true,
      showRegions: true,
      layout: 'grid',
    },
  },
  {
    id: 'historical_context',
    type: 'historical_context',
    order: 5,
    visible: true,
    config: {
      maxSimilarEvents: 5,
      showBackground: true,
      showValidation: true,
    },
  },
  {
    id: 'official_documents',
    type: 'official_documents',
    order: 6,
    visible: true,
    config: {
      maxDocuments: 10,
      showSource: true,
    },
  },
];

/**
 * Default blocks configuration for Dashboard page
 */
export const DEFAULT_DASHBOARD_BLOCKS: Block[] = [
  {
    id: 'metrics',
    type: 'metrics',
    order: 1,
    visible: true,
    config: {
      showEventsIngested: true,
      showRegionsCovered: true,
      showLastUpdate: true,
    },
  },
  {
    id: 'event_list',
    type: 'event_list',
    order: 2,
    visible: true,
    config: {
      limit: 5,
      showFilters: false,
      showSearch: false,
    },
  },
];

/**
 * Default blocks configuration for IntelligenceFeed page
 */
export const DEFAULT_INTELLIGENCE_FEED_BLOCKS: Block[] = [
  {
    id: 'search',
    type: 'search',
    order: 1,
    visible: true,
    config: {
      placeholder: 'Search events...',
      showLiveSearch: true,
    },
  },
  {
    id: 'filters',
    type: 'filters',
    order: 2,
    visible: true,
    config: {
      showSectorFilter: true,
      showRegionFilter: true,
      showEventTypeFilter: true,
      showTimeHorizonFilter: true,
    },
  },
  {
    id: 'event_list',
    type: 'event_list',
    order: 3,
    visible: true,
    config: {
      limit: 20,
      showFilters: true,
      showSearch: true,
    },
  },
];

/**
 * Get default blocks for a page type
 */
export function getDefaultBlocks(pageType: string): Block[] {
  switch (pageType) {
    case 'event_detail':
      return DEFAULT_EVENT_DETAIL_BLOCKS;
    case 'dashboard':
      return DEFAULT_DASHBOARD_BLOCKS;
    case 'intelligence':
      return DEFAULT_INTELLIGENCE_FEED_BLOCKS;
    default:
      return [];
  }
}

