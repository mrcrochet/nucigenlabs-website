/**
 * TriggeredAlertsFeed - 8 alerts
 * 
 * Data: GET /alerts/triggered?range=7d&limit=8
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { Bell } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  severity: 'moderate' | 'high' | 'critical';
  triggeredAt: string;
  relatedEventId?: string;
  relatedSignalId?: string;
}

export default function TriggeredAlertsFeed() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch from GET /alerts/triggered?range=7d&limit=8
    // Placeholder data
    setAlerts([]);
    setLoading(false);
  }, []);

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
          <span>No alerts triggered</span>
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
