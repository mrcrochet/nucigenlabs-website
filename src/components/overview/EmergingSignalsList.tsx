/**
 * Emerging Signals — What to Watch Next.
 * 3 items max. Pas encore critiques, mais "à surveiller". Cliquable → Enquête.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Telescope, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { apiUrl } from '../../lib/api-base';

export interface EmergingSignal {
  id: string;
  label: string;
  oneLine: string;
  investigateId: string | null;
}

interface EmergingSignalsListProps {
  limit?: number;
}

const MOCK_EMERGING: EmergingSignal[] = [
  { id: 'es-1', label: 'Supply fragmentation (Red Sea)', oneLine: 'Early signs of route diversification', investigateId: '/search' },
  { id: 'es-2', label: 'Rare earth stockpiling (Asia)', oneLine: 'Quiet increase in strategic reserves', investigateId: '/search' },
  { id: 'es-3', label: 'Gas storage levels (EU)', oneLine: 'Below seasonal norms – watch refill pace', investigateId: '/search' },
];

export default function EmergingSignalsList({ limit = 3 }: EmergingSignalsListProps) {
  const [items, setItems] = useState<EmergingSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(apiUrl('/api/overview/emerging-signals?limit=' + limit))
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        if (json?.success && Array.isArray(json.data)) {
          setItems(json.data.slice(0, limit));
        } else {
          setItems(MOCK_EMERGING.slice(0, limit));
        }
      })
      .catch(() => {
        if (!cancelled) setItems(MOCK_EMERGING.slice(0, limit));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [limit]);

  if (loading) {
    return (
      <Card>
        <div className="h-32 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <SectionHeader title="Emerging Signals" subtitle="À surveiller" />
        <div className="mt-4 text-sm text-text-secondary flex items-center gap-2">
          <Telescope className="w-4 h-4 shrink-0" />
          <span>Rien d’émergent pour l’instant</span>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader
        title="Emerging Signals"
        subtitle="Pas encore critiques – attention directionnelle"
      />
      <div className="mt-4 space-y-3">
        {items.map((signal) => (
          <Link
            key={signal.id}
            to={signal.investigateId || '/search'}
            className="block p-3 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors group"
          >
            <div className="text-sm font-medium text-text-primary group-hover:text-[#E1463E] transition-colors">
              {signal.label}
            </div>
            <div className="text-xs text-text-secondary mt-0.5">{signal.oneLine}</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-[#E1463E]">
              <span>Explorer</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
