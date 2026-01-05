/**
 * CausalChainBlock Component
 * 
 * Displays the causal chain timeline with optional metadata
 */

import { CausalChainBlock as CausalChainBlockType } from '../../types/blocks';
import Timeline from '../ui/Timeline';
import SectionHeader from '../ui/SectionHeader';
import MetaRow from '../ui/MetaRow';
import { Clock } from 'lucide-react';

interface CausalChainBlockProps {
  block: CausalChainBlockType;
  chain: {
    cause: string;
    first_order_effect: string;
    second_order_effect: string | null;
    affected_sectors: string[];
    affected_regions: string[];
    time_horizon: 'hours' | 'days' | 'weeks';
    confidence: number;
  } | null | undefined;
}

export default function CausalChainBlock({ block, chain }: CausalChainBlockProps) {
  if (!chain) {
    return null;
  }

  const getTimeHorizonLabel = (horizon: string) => {
    switch (horizon) {
      case 'hours': return 'Hours';
      case 'days': return 'Days';
      case 'weeks': return 'Weeks';
      default: return horizon;
    }
  };

  // Build timeline items
  const timelineItems = [
    { label: 'Cause', content: chain.cause },
    { label: 'First-Order Effect', content: chain.first_order_effect },
  ];

  if (block.config?.showSecondOrder && chain.second_order_effect) {
    timelineItems.push({ label: 'Second-Order Effect', content: chain.second_order_effect });
  }

  const layout = block.config?.layout || 'timeline';

  if (layout === 'timeline') {
    return (
      <div className="mb-10 pb-10 border-b border-white/[0.02]">
        <SectionHeader title="Causal Chain" />
        <Timeline items={timelineItems} />

        {/* Chain Metadata */}
        {block.config?.showMetadata && (
          <div className="pt-6 mt-6 border-t border-white/[0.02]">
            <MetaRow
              items={[
                {
                  label: 'Time horizon',
                  value: getTimeHorizonLabel(chain.time_horizon),
                  icon: Clock,
                },
                ...(chain.affected_sectors.length > 0 ? [{
                  label: 'Affected sectors',
                  value: chain.affected_sectors.join(', '),
                }] : []),
                ...(chain.affected_regions.length > 0 ? [{
                  label: 'Affected regions',
                  value: chain.affected_regions.join(', '),
                }] : []),
                {
                  label: 'Chain confidence',
                  value: chain.confidence,
                  variant: 'confidence' as const,
                },
              ]}
            />
          </div>
        )}
      </div>
    );
  }

  // Future: Support other layouts (cards, graph)
  return null;
}

