/**
 * Create Alert Modal
 * 
 * Allows users to create alerts on watch indicators
 */

import { useState } from 'react';
import { X, Bell, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Outlook } from '../../types/prediction';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: string;
  scenarioTitle?: string;
  eventId?: string;
}

export default function CreateAlertModal({
  isOpen,
  onClose,
  indicator,
  scenarioTitle,
  eventId,
}: CreateAlertModalProps) {
  const [alertName, setAlertName] = useState('');
  const [notificationMethods, setNotificationMethods] = useState({
    email: true,
    inApp: true,
    webhook: false,
  });
  const [threshold, setThreshold] = useState('medium');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Implement API call to create alert
      // await fetch('/api/alerts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name: alertName || indicator,
      //     indicator,
      //     scenario_title: scenarioTitle,
      //     event_id: eventId,
      //     notification_methods: notificationMethods,
      //     threshold,
      //   }),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Alert created successfully');
      onClose();
    } catch (error: any) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background-base border border-borders-subtle rounded-xl p-6 w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-light text-text-primary">
              Create Alert
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* Indicator Preview */}
        <div className="mb-6 p-4 bg-white/[0.02] border border-white/[0.08] rounded-lg">
          <p className="text-xs text-text-tertiary mb-1">Watch Indicator</p>
          <p className="text-sm text-text-primary font-light">{indicator}</p>
          {scenarioTitle && (
            <p className="text-xs text-text-tertiary mt-2">
              From scenario: {scenarioTitle}
            </p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Alert Name */}
          <div>
            <label className="block text-sm font-light text-text-secondary mb-2">
              Alert Name
            </label>
            <input
              type="text"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
              placeholder={indicator}
              className="w-full px-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Threshold */}
          <div>
            <label className="block text-sm font-light text-text-secondary mb-2">
              Alert Threshold
            </label>
            <select
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-4 py-2 bg-white/[0.02] border border-white/[0.08] rounded-lg text-sm text-text-primary focus:outline-none focus:border-white/20"
            >
              <option value="low">Low - Any mention</option>
              <option value="medium">Medium - Significant change</option>
              <option value="high">High - Critical development</option>
            </select>
          </div>

          {/* Notification Methods */}
          <div>
            <label className="block text-sm font-light text-text-secondary mb-2">
              Notification Methods
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationMethods.email}
                  onChange={(e) =>
                    setNotificationMethods({
                      ...notificationMethods,
                      email: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.02] text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-text-secondary">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationMethods.inApp}
                  onChange={(e) =>
                    setNotificationMethods({
                      ...notificationMethods,
                      inApp: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.02] text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-text-secondary">In-App Notification</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationMethods.webhook}
                  onChange={(e) =>
                    setNotificationMethods({
                      ...notificationMethods,
                      webhook: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.02] text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-text-secondary">Webhook (API)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.15] rounded-lg text-sm font-light text-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm font-light text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Alert</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
