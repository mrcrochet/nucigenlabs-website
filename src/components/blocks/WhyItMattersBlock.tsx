/**
 * WhyItMattersBlock Component
 * 
 * Displays the "Why It Matters" section with optional expand/collapse
 */

import { useState } from 'react';
import { WhyItMattersBlock as WhyItMattersBlockType } from '../../types/blocks';
import SectionHeader from '../ui/SectionHeader';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface WhyItMattersBlockProps {
  block: WhyItMattersBlockType;
  text: string | null | undefined;
}

export default function WhyItMattersBlock({ block, text }: WhyItMattersBlockProps) {
  if (!text) {
    return null;
  }

  const maxLength = block.config?.maxLength || 200;
  const expandable = block.config?.expandable !== false;
  const shouldTruncate = text.length > maxLength;
  const [expanded, setExpanded] = useState(false);

  const displayText = expanded || !shouldTruncate 
    ? text 
    : text.substring(0, maxLength) + '...';

  return (
    <div className="mb-10 pb-10 border-b border-white/[0.02]">
      <SectionHeader
        title="Why It Matters"
        action={expandable && shouldTruncate ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-slate-500 hover:text-white transition-colors flex items-center gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3 h-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3" />
                Show more
              </>
            )}
          </button>
        ) : undefined}
      />
      <p className="text-base text-slate-300 font-light leading-relaxed">
        {displayText}
      </p>
    </div>
  );
}

