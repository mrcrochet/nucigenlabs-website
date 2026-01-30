/**
 * TriggeredAlertsFeed - 8 alerts
 * Data: GET /api/alerts/triggered?range=7d&limit=8&userId=
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { Bell } from 'lucide-react';
import { apiUrl } from '../../lib/api-base';

interface Alert {
  id: string;
  title: string;
  severity: 'moderate' | 'high' | 'critical';
  triggeredAt: string;
  relatedEventId?: string;
  relatedSignalId?: string;
}

function normalizeSeverity(s: string | undefined): 'moderate' | 'high' | 'critical' {
  if (s === 'high' || s === 'critical' || s === 'moderate') return s;
  if (s === 'low') return 'moderate';
  return 'moderate';
}

export default function TriggeredAlertsFeed() {
  const { user } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setAlerts([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const url = apiUrl(`/api/alerts/triggered?range=7d&limit=8&userId=${encodeURIComponent(user.id)}`);
    fetch(url)
      .then((res) => {
        if (cancelled) return null;
        if (res.status === 400) {
          setAlerts([]);
          return null;
        }
        if (!res.ok) throw new Error('Indisponible');
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json) return;
        if (json.success && json.data?.alerts) {
          setAlerts(
            json.data.alerts.map((a: { id: string; title: string; severity?: string; triggered_at: string; related_event_id?: string }) => ({
              id: a.id,
              title: a.title || 'Alert',
              severity: normalizeSeverity(a.severity),
              triggeredAt: a.triggered_at,
              relatedEventId: a.related_event_id,
            }))
          );
        } else {
          setAlerts([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Indisponible');
          setAlerts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <SectionHeader title="Triggered Alerts" />
        <div className="mt-4 text-sm text-text-secondary flex items-center gap-2">
          <Bell className="w-4 h-4" />
          <span>{error ? 'Indisponible' : !user ? 'Connectez-vous pour voir vos alertes' : 'Aucune alerte déclenchée'}</span>
        </div>
      </Card>
    );
  }

  const getSeverityVariant = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'level';
      default:
        return 'neutral';
    }
  };

  return (
    <Card>
      <SectionHeader title="Triggered Alerts" />
      
      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            to={`/alerts/${alert.id}`}
            className="block p-3 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-medium text-text-primary flex-1">
                {alert.title}
              </h4>
              <Badge variant={getSeverityVariant(alert.severity)}>
                {alert.severity}
              </Badge>
            </div>
            <div className="text-xs text-text-tertiary">
              {new Date(alert.triggeredAt).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
