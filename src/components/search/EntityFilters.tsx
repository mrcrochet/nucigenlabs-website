/**
 * Entity Filters
 * 
 * Filter results by extracted entities (countries, companies, persons, etc.)
 */

import { useState, useMemo } from 'react';
import { Globe, Building2, User, Package, Briefcase, X, Filter } from 'lucide-react';
import type { Entity } from '../../types/search';

interface EntityFiltersProps {
  entities: Entity[];
  selectedEntities: string[];
  onEntityToggle: (entityId: string) => void;
  onClearAll: () => void;
  groupBy?: 'type' | 'name';
}

const entityTypeIcons: Record<string, React.ReactNode> = {
  country: <Globe className="w-3 h-3" />,
  company: <Building2 className="w-3 h-3" />,
  person: <User className="w-3 h-3" />,
  commodity: <Package className="w-3 h-3" />,
  organization: <Briefcase className="w-3 h-3" />,
};

const entityTypeLabels: Record<string, string> = {
  country: 'Countries',
  company: 'Companies',
  person: 'Persons',
  commodity: 'Commodities',
  organization: 'Organizations',
};

export default function EntityFilters({
  entities,
  selectedEntities,
  onEntityToggle,
  onClearAll,
  groupBy = 'type',
}: EntityFiltersProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['country', 'company']));
  const [searchQuery, setSearchQuery] = useState('');

  // Group entities by type
  const groupedEntities = useMemo(() => {
    const groups: Record<string, Entity[]> = {};
    
    entities.forEach((entity) => {
      if (!groups[entity.type]) {
        groups[entity.type] = [];
      }
      groups[entity.type].push(entity);
    });

    // Sort entities within each group by confidence
    Object.keys(groups).forEach((type) => {
      groups[type].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    });

    return groups;
  }, [entities]);

  // Filter entities by search query
  const filteredGroupedEntities = useMemo(() => {
    if (!searchQuery.trim()) {
      return groupedEntities;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered: Record<string, Entity[]> = {};

    Object.keys(groupedEntities).forEach((type) => {
      const filteredEntities = groupedEntities[type].filter(
        (entity) => entity.name.toLowerCase().includes(query)
      );
      if (filteredEntities.length > 0) {
        filtered[type] = filteredEntities;
      }
    });

    return filtered;
  }, [groupedEntities, searchQuery]);

  const toggleType = (type: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const hasActiveFilters = selectedEntities.length > 0;

  if (entities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <h3 className="text-sm font-semibold text-text-primary">Filter by Entities</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-text-tertiary hover:text-text-primary transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search entities..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-background-glass-subtle border border-borders-subtle rounded-lg text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary/50 focus:bg-background-glass-medium transition-all"
        />
        <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-text-tertiary" />
      </div>

      {/* Entity Groups */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {Object.keys(filteredGroupedEntities).map((type) => {
          const typeEntities = filteredGroupedEntities[type];
          const isExpanded = expandedTypes.has(type);
          const selectedCount = typeEntities.filter((e) => selectedEntities.includes(e.id)).length;

          return (
            <div key={type} className="border border-borders-subtle rounded-lg overflow-hidden">
              {/* Type Header */}
              <button
                onClick={() => toggleType(type)}
                className="w-full flex items-center justify-between px-3 py-2 bg-background-glass-subtle hover:bg-background-glass-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">
                    {entityTypeIcons[type] || <Filter className="w-3 h-3" />}
                  </span>
                  <span className="text-xs font-medium text-text-primary">
                    {entityTypeLabels[type] || type}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    ({typeEntities.length})
                  </span>
                  {selectedCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-xs">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <span className="text-text-tertiary text-xs">
                  {isExpanded ? '−' : '+'}
                </span>
              </button>

              {/* Entity List */}
              {isExpanded && (
                <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                  {typeEntities.slice(0, 20).map((entity) => {
                    const isSelected = selectedEntities.includes(entity.id);
                    return (
                      <label
                        key={entity.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-background-glass-subtle cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onEntityToggle(entity.id)}
                          className="w-3 h-3 text-primary bg-background-glass-subtle border-borders-subtle rounded focus:ring-primary"
                        />
                        <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors flex-1">
                          {entity.name}
                        </span>
                        {entity.confidence && (
                          <span className="text-xs text-text-tertiary">
                            {(entity.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </label>
                    );
                  })}
                  {typeEntities.length > 20 && (
                    <div className="text-xs text-text-tertiary px-2 py-1 text-center">
                      +{typeEntities.length - 20} more
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-borders-subtle">
          <span className="text-xs text-text-tertiary">Active:</span>
          {selectedEntities.slice(0, 5).map((entityId) => {
            const entity = entities.find((e) => e.id === entityId);
            if (!entity) return null;
            return (
              <button
                key={entityId}
                onClick={() => onEntityToggle(entityId)}
                className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs hover:bg-primary/30 transition-colors"
              >
                {entity.name}
                <X className="w-3 h-3" />
              </button>
            );
          })}
          {selectedEntities.length > 5 && (
            <span className="text-xs text-text-tertiary">
              +{selectedEntities.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
