/**
 * BlockRenderer Component
 * 
 * Routes to the appropriate block component based on block type
 */

import { Block } from '../../types/blocks';
import EventHeaderBlock from './EventHeaderBlock';
import CausalChainBlock from './CausalChainBlock';
import WhyItMattersBlock from './WhyItMattersBlock';
import ExposureBlock from './ExposureBlock';
import HistoricalContextBlock from './HistoricalContextBlock';
import OfficialDocumentsBlock from './OfficialDocumentsBlock';

interface BlockRendererProps {
  block: Block;
  data: {
    event?: any;
    chain?: any;
    whyItMatters?: string;
    context?: any;
    documents?: any[];
    [key: string]: any;
  };
  onFeedbackClick?: () => void;
}

export default function BlockRenderer({ block, data, onFeedbackClick }: BlockRendererProps) {
  // Don't render if block is not visible
  if (!block.visible) {
    return null;
  }

  // Route to the appropriate block component
  switch (block.type) {
    case 'event_header':
      return <EventHeaderBlock block={block} event={data.event} onFeedbackClick={onFeedbackClick} />;
    
    case 'causal_chain':
      return <CausalChainBlock block={block} chain={data.chain} />;
    
    case 'why_it_matters':
      return <WhyItMattersBlock block={block} text={data.whyItMatters} />;
    
    case 'exposure':
      return <ExposureBlock block={block} event={data.event} chain={data.chain} />;
    
    case 'historical_context':
      return <HistoricalContextBlock block={block} context={data.context} />;
    
    case 'official_documents':
      return <OfficialDocumentsBlock block={block} documents={data.documents} />;
    
    default:
      // Unknown block type - log warning but don't crash
      console.warn(`Unknown block type: ${(block as any).type}`);
      return null;
  }
}

