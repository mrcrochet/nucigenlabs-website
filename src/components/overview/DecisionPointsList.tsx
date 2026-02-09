/**
 * Decision Points — Moments de choix, pas des conseils.
 * Ex. "Energy routing shifting from Europe → Asia". Cliquable → Enquête.
 * Data: à brancher sur API (pour l'instant vide ou mock).
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { apiUrl } from '../../lib/api-base';

export interface DecisionPoint {
  id: string;
  label: string;
  oneLine: string;
  investigateId: string | null;
}

interface DecisionPointsListProps {
  limit?: number;
}

const MOCK_DECISION_POINTS: DecisionPoint[] = [
  { id: 'dp-1', label: 'Energy routing shift', oneLine: 'Europe → Asia reconfiguration', investigateId: '/search' },
  { id: 'dp-2', label: 'Gold supply risk', oneLine: 'DRC North Kivu – sourcing decisions', investigateId: '/search' },
  { id: 'dp-3', label: 'Sanctions compliance', oneLine: 'London – financial compliance pressure', investigateId: '/search' },
];

export default function DecisionPointsList({ limit = 5 }: DecisionPointsListProps) {
  const [items, setItems] = useState<DecisionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl('/api/overview/decision-points?limit=' + limit))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        if (json?.success && Array.isArray(json.data)) {
          setItems(json.data.slice(0, limit));
        } else {
          setItems(MOCK_DECISION_POINTS.slice(0, limit));
        }
      })
      .catch(() => {
        if (!cancelled) setItems(MOCK_DECISION_POINTS.slice(0, limit));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [limit]);

  if (loading) {
    return (
      <Card>
        <SectionHeader title="Decision Points" />
        <div className="h-40 animate-pulse bg-background-glass-subtle rounded-lg mt-4" />
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader
        title="Decision Points"
        subtitle="Moments de choix, pas des conseils"
      />
      {items.length === 0 ? (
        <div className="mt-4 text-sm text-text-secondary flex items-center gap-2">
          <GitBranch className="w-4 h-4 shrink-0" />
          <span>Aucun point de décision récent</span>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((point) => (
            <Link
              key={point.id}
              to={point.investigateId || '/search'}
              className="block p-3 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors group"
            >
              <div className="text-sm font-medium text-text-primary group-hover:text-[#E1463E] transition-colors">
                {point.label}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">{point.oneLine}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#E1463E]">
                <span>Explorer</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
