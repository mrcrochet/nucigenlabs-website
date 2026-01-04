/**
 * PHASE 8: Feedback Modal Component
 * 
 * Permet aux utilisateurs de donner du feedback sur les extractions/prédictions
 */

import { useState } from 'react';
import { submitModelFeedback, type ModelFeedback } from '../lib/supabase';
import { X, AlertCircle, CheckCircle2, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentType: ModelFeedback['component_type'];
  eventId?: string;
  causalChainId?: string;
  scenarioId?: string;
  recommendationId?: string;
  originalContent: any;
}

export default function FeedbackModal({
  isOpen,
  onClose,
  componentType,
  eventId,
  causalChainId,
  scenarioId,
  recommendationId,
  originalContent,
}: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<ModelFeedback['feedback_type']>('improvement');
  const [reasoning, setReasoning] = useState('');
  const [correctedContent, setCorrectedContent] = useState('');
  const [severity, setSeverity] = useState<ModelFeedback['severity']>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let corrected: any = null;
      
      // Si correction, essayer de parser le JSON corrigé
      if (feedbackType === 'correction' && correctedContent.trim()) {
        try {
          corrected = JSON.parse(correctedContent);
        } catch {
          // Si ce n'est pas du JSON, stocker comme texte
          corrected = correctedContent;
        }
      }

      await submitModelFeedback({
        event_id: eventId || null,
        causal_chain_id: causalChainId || null,
        scenario_id: scenarioId || null,
        recommendation_id: recommendationId || null,
        feedback_type: feedbackType,
        component_type: componentType,
        original_content: originalContent,
        corrected_content: corrected || null,
        reasoning: reasoning || null,
        severity: severity || null,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setReasoning('');
        setCorrectedContent('');
        setFeedbackType('improvement');
        setSeverity('medium');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getComponentName = () => {
    const names: Record<ModelFeedback['component_type'], string> = {
      event_extraction: 'Event Extraction',
      causal_chain: 'Causal Chain',
      scenario: 'Scenario Prediction',
      recommendation: 'Recommendation',
      relationship: 'Event Relationship',
      historical_comparison: 'Historical Comparison',
    };
    return names[componentType] || componentType;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Provide Feedback</h2>
            <p className="text-sm text-gray-400 mt-1">Help improve {getComponentName()}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Feedback Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Type of Feedback
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFeedbackType('validation')}
                className={`p-3 rounded-lg border transition-colors ${
                  feedbackType === 'validation'
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <ThumbsUp className="w-5 h-5 mx-auto mb-2" />
                <div className="text-sm font-medium">Correct</div>
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('correction')}
                className={`p-3 rounded-lg border transition-colors ${
                  feedbackType === 'correction'
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <ThumbsDown className="w-5 h-5 mx-auto mb-2" />
                <div className="text-sm font-medium">Needs Correction</div>
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('improvement')}
                className={`p-3 rounded-lg border transition-colors ${
                  feedbackType === 'improvement'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <MessageSquare className="w-5 h-5 mx-auto mb-2" />
                <div className="text-sm font-medium">Suggestion</div>
              </button>
              <button
                type="button"
                onClick={() => setFeedbackType('rejection')}
                className={`p-3 rounded-lg border transition-colors ${
                  feedbackType === 'rejection'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                <div className="text-sm font-medium">Reject</div>
              </button>
            </div>
          </div>

          {/* Severity (only for correction/rejection) */}
          {(feedbackType === 'correction' || feedbackType === 'rejection') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Severity
              </label>
              <select
                value={severity || 'medium'}
                onChange={(e) => setSeverity(e.target.value as ModelFeedback['severity'])}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="low">Low - Minor issue</option>
                <option value="medium">Medium - Moderate issue</option>
                <option value="high">High - Significant issue</option>
                <option value="critical">Critical - Major issue</option>
              </select>
            </div>
          )}

          {/* Reasoning */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Explanation {feedbackType === 'correction' && '(required)'}
            </label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain what's wrong or how it could be improved..."
              rows={4}
              required={feedbackType === 'correction'}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Corrected Content (only for correction) */}
          {feedbackType === 'correction' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Corrected Content (JSON or text)
              </label>
              <textarea
                value={correctedContent}
                onChange={(e) => setCorrectedContent(e.target.value)}
                placeholder='{"corrected_field": "corrected_value"} or plain text'
                rows={6}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide the corrected version. JSON format preferred for structured data.
              </p>
            </div>
          )}

          {/* Error/Success */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Feedback submitted successfully! Thank you for helping improve Nucigen.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (feedbackType === 'correction' && !reasoning.trim())}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white font-medium transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

