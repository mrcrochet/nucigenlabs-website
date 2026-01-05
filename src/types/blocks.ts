/**
 * Modular Blocks System - Type Definitions
 * 
 * Defines all block types and their configurations for the modular page system
 */

export type BlockType = 
  | 'event_header'
  | 'causal_chain'
  | 'why_it_matters'
  | 'exposure'
  | 'historical_context'
  | 'official_documents'
  | 'metrics'
  | 'event_list'
  | 'search'
  | 'filters'
  | 'alerts'
  | 'recommendations';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
  visible: boolean;
  config?: Record<string, any>;
}

export interface EventHeaderBlock extends BaseBlock {
  type: 'event_header';
  config: {
    showTags?: boolean;
    showMetrics?: boolean;
    showActions?: boolean;
  };
}

export interface CausalChainBlock extends BaseBlock {
  type: 'causal_chain';
  config: {
    showSecondOrder?: boolean;
    layout?: 'timeline' | 'cards' | 'graph';
    showMetadata?: boolean;
  };
}

export interface WhyItMattersBlock extends BaseBlock {
  type: 'why_it_matters';
  config: {
    expandable?: boolean;
    maxLength?: number;
  };
}

export interface ExposureBlock extends BaseBlock {
  type: 'exposure';
  config: {
    showSectors?: boolean;
    showRegions?: boolean;
    layout?: 'grid' | 'list';
  };
}

export interface HistoricalContextBlock extends BaseBlock {
  type: 'historical_context';
  config: {
    maxSimilarEvents?: number;
    showBackground?: boolean;
    showValidation?: boolean;
  };
}

export interface OfficialDocumentsBlock extends BaseBlock {
  type: 'official_documents';
  config: {
    maxDocuments?: number;
    showSource?: boolean;
  };
}

export interface MetricsBlock extends BaseBlock {
  type: 'metrics';
  config: {
    showEventsIngested?: boolean;
    showRegionsCovered?: boolean;
    showLastUpdate?: boolean;
  };
}

export interface EventListBlock extends BaseBlock {
  type: 'event_list';
  config: {
    limit?: number;
    showFilters?: boolean;
    showSearch?: boolean;
  };
}

export interface SearchBlock extends BaseBlock {
  type: 'search';
  config: {
    placeholder?: string;
    showLiveSearch?: boolean;
  };
}

export interface FiltersBlock extends BaseBlock {
  type: 'filters';
  config: {
    showSectorFilter?: boolean;
    showRegionFilter?: boolean;
    showEventTypeFilter?: boolean;
    showTimeHorizonFilter?: boolean;
  };
}

export interface AlertsBlock extends BaseBlock {
  type: 'alerts';
  config: {
    showUnreadOnly?: boolean;
    limit?: number;
  };
}

export interface RecommendationsBlock extends BaseBlock {
  type: 'recommendations';
  config: {
    limit?: number;
    showActions?: boolean;
  };
}

export type Block = 
  | EventHeaderBlock
  | CausalChainBlock
  | WhyItMattersBlock
  | ExposureBlock
  | HistoricalContextBlock
  | OfficialDocumentsBlock
  | MetricsBlock
  | EventListBlock
  | SearchBlock
  | FiltersBlock
  | AlertsBlock
  | RecommendationsBlock;

/**
 * Page types that support modular blocks
 */
export type PageType = 'event_detail' | 'dashboard' | 'intelligence' | 'events' | 'alerts';

/**
 * User block preferences for a specific page
 */
export interface UserBlockPreferences {
  id?: string;
  user_id: string;
  page_type: PageType;
  blocks: Block[];
  created_at?: string;
  updated_at?: string;
}

