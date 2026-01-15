/**
 * ImpactMappingMatrix - Simple mapping by markets/regions/industries
 * 
 * Displays impacts with magnitude indicators (↑ ↓ →)
 * Organized by:
 * - Markets (assets/sectors)
 * - Regions
 * - Industries
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, MapPin, Building2, BarChart3 } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import type { Impact } from '../../types/intelligence';

interface ImpactMapping {
  markets: Array<{
    asset: string;
    sector: string;
    magnitude: number;
    direction: 'up' | 'down' | 'neutral';
  }>;
  regions: Array<{
    region: string;
    magnitude: number;
    direction: 'up' | 'down' | 'neutral';
  }>;
  industries: Array<{
    industry: string;
    magnitude: number;
    direction: 'up' | 'down' | 'neutral';
  }>;
}

interface ImpactMappingMatrixProps {
  impacts: Impact[];
}

export default function ImpactMappingMatrix({ impacts }: ImpactMappingMatrixProps) {
  const [mapping, setMapping] = useState<ImpactMapping>({
    markets: [],
    regions: [],
    industries: [],
  });

  useEffect(() => {
    // Extract mapping from impacts
    const marketsMap = new Map<string, { asset: string; sector: string; magnitude: number; direction: 'up' | 'down' | 'neutral' }>();
    const regionsMap = new Map<string, { region: string; magnitude: number; direction: 'up' | 'down' | 'neutral' }>();
    const industriesMap = new Map<string, { industry: string; magnitude: number; direction: 'up' | 'down' | 'neutral' }>();

    impacts.forEach(impact => {
      // Process affected assets (markets)
      if (impact.affected_assets && impact.affected_assets.length > 0) {
        impact.affected_assets.forEach(asset => {
          const existing = marketsMap.get(asset) || { asset, sector: 'Unknown', magnitude: 0, direction: 'neutral' as const };
          marketsMap.set(asset, {
            ...existing,
            magnitude: Math.max(existing.magnitude, impact.magnitude || 0),
            direction: (impact.magnitude || 0) > 50 ? 'down' : (impact.magnitude || 0) > 20 ? 'neutral' : 'up',
          });
        });
      }

      // Extract regions from impact (if available in pathways or assumptions)
      const regionKeywords = ['US', 'EU', 'China', 'Asia', 'Africa', 'Middle East', 'Latin America', 'Europe'];
      regionKeywords.forEach(region => {
        const impactText = `${impact.risk_headline} ${impact.opportunity || ''}`.toLowerCase();
        if (impactText.includes(region.toLowerCase())) {
          const existing = regionsMap.get(region) || { region, magnitude: 0, direction: 'neutral' as const };
          regionsMap.set(region, {
            ...existing,
            magnitude: Math.max(existing.magnitude, impact.magnitude || 0),
            direction: (impact.magnitude || 0) > 50 ? 'down' : (impact.magnitude || 0) > 20 ? 'neutral' : 'up',
          });
        }
      });

      // Extract industries (similar approach)
      const industryKeywords = ['Energy', 'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Mining', 'Agriculture', 'Transport'];
      industryKeywords.forEach(industry => {
        const impactText = `${impact.risk_headline} ${impact.opportunity || ''}`.toLowerCase();
        if (impactText.includes(industry.toLowerCase())) {
          const existing = industriesMap.get(industry) || { industry, magnitude: 0, direction: 'neutral' as const };
          industriesMap.set(industry, {
            ...existing,
            magnitude: Math.max(existing.magnitude, impact.magnitude || 0),
            direction: (impact.magnitude || 0) > 50 ? 'down' : (impact.magnitude || 0) > 20 ? 'neutral' : 'up',
          });
        }
      });
    });

    setMapping({
      markets: Array.from(marketsMap.values()).sort((a, b) => b.magnitude - a.magnitude).slice(0, 10),
      regions: Array.from(regionsMap.values()).sort((a, b) => b.magnitude - a.magnitude).slice(0, 8),
      industries: Array.from(industriesMap.values()).sort((a, b) => b.magnitude - a.magnitude).slice(0, 8),
    });
  }, [impacts]);

  const getDirectionIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-text-tertiary" />;
    }
  };

  const getDirectionLabel = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '→';
    }
  };

  const getMagnitudeColor = (magnitude: number) => {
    if (magnitude >= 70) return 'text-red-500';
    if (magnitude >= 40) return 'text-orange-500';
    if (magnitude >= 20) return 'text-yellow-500';
    return 'text-text-secondary';
  };

  if (mapping.markets.length === 0 && mapping.regions.length === 0 && mapping.industries.length === 0) {
    return (
      <Card>
        <SectionHeader title="Impact Mapping" />
        <div className="text-text-secondary text-sm mt-4">
          No impact mapping available. Impacts need to include affected assets, regions, or industries.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Impact Mapping" />
      
      <div className="space-y-6 mt-4">
        {/* Markets */}
        {mapping.markets.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Markets</h3>
            </div>
            <div className="space-y-2">
              {mapping.markets.map((market, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {getDirectionIcon(market.direction)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary truncate">{market.asset}</p>
                      <p className="text-xs text-text-tertiary truncate">{market.sector}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className={`text-xs sm:text-sm font-semibold ${getMagnitudeColor(market.magnitude)} whitespace-nowrap`}>
                      {getDirectionLabel(market.direction)} {market.magnitude}%
                    </span>
                    <div className="w-16 sm:w-20 h-2 bg-background-glass-medium rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-red"
                        style={{ width: `${market.magnitude}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regions */}
        {mapping.regions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Regions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mapping.regions.map((region, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle"
                >
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(region.direction)}
                    <span className="text-sm text-text-primary">{region.region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${getMagnitudeColor(region.magnitude)}`}>
                      {getDirectionLabel(region.direction)} {region.magnitude}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Industries */}
        {mapping.industries.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-text-secondary" />
              <h3 className="text-sm font-semibold text-text-primary">Industries</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mapping.industries.map((industry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle"
                >
                  <div className="flex items-center gap-2">
                    {getDirectionIcon(industry.direction)}
                    <span className="text-sm text-text-primary">{industry.industry}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${getMagnitudeColor(industry.magnitude)}`}>
                      {getDirectionLabel(industry.direction)} {industry.magnitude}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
