/**
 * ExposureBlock Component
 * 
 * Displays exposure information (sectors and regions)
 */

import { ExposureBlock as ExposureBlockType } from '../../types/blocks';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';

interface ExposureBlockProps {
  block: ExposureBlockType;
  event?: {
    sector?: string | null;
    region?: string | null;
  };
  chain?: {
    affected_sectors: string[];
    affected_regions: string[];
  };
}

export default function ExposureBlock({ block, event, chain }: ExposureBlockProps) {
  const showSectors = block.config?.showSectors !== false;
  const showRegions = block.config?.showRegions !== false;
  const layout = block.config?.layout || 'grid';

  // Get sectors from chain or event
  const sectors = chain?.affected_sectors || (event?.sector ? [event.sector] : []);
  const regions = chain?.affected_regions || (event?.region ? [event.region] : []);

  // Don't render if no data to show
  if ((!showSectors || sectors.length === 0) && (!showRegions || regions.length === 0)) {
    return null;
  }

  return (
    <div className="mb-10 pb-10 border-b border-white/[0.02]">
      <SectionHeader title="Exposure" />
      <div className="space-y-6">
        {showSectors && sectors.length > 0 && (
          <div>
            <div className="text-xs text-slate-600 mb-3 font-light uppercase tracking-wide">
              Most exposed sectors
            </div>
            <div className={layout === 'grid' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}>
              {sectors.map(sector => (
                <Badge key={sector} variant="sector">{sector}</Badge>
              ))}
            </div>
          </div>
        )}
        {showRegions && regions.length > 0 && (
          <div>
            <div className="text-xs text-slate-600 mb-3 font-light uppercase tracking-wide">
              Potentially affected regions
            </div>
            <div className={layout === 'grid' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-2'}>
              {regions.map(region => (
                <Badge key={region} variant="region">{region}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

