/**
 * Sentiment Analysis Component
 * 
 * Analyzes sentiment of search results and displays visual badges
 * Shows polarity, emotions, and impact level
 */

import { TrendingUp, TrendingDown, Minus, AlertCircle, Smile, Frown, Meh } from 'lucide-react';
import type { SearchResult } from '../../types/search';

export interface SentimentData {
  polarity: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  emotions?: {
    fear?: number;
    anger?: number;
    joy?: number;
    sadness?: number;
  };
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
}

interface SentimentAnalysisProps {
  result: SearchResult;
  sentiment?: SentimentData;
}

// Simple sentiment analysis based on keywords (in production, use NLP API)
function analyzeSentiment(result: SearchResult): SentimentData {
  const text = `${result.title} ${result.summary}`.toLowerCase();
  
  // Positive keywords
  const positiveKeywords = [
    'growth', 'increase', 'rise', 'gain', 'profit', 'success', 'improve', 'boost',
    'expansion', 'surge', 'rally', 'recovery', 'breakthrough', 'achievement', 'win',
    'positive', 'optimistic', 'strong', 'robust', 'thriving', 'flourishing'
  ];
  
  // Negative keywords
  const negativeKeywords = [
    'decline', 'fall', 'drop', 'loss', 'crisis', 'collapse', 'failure', 'decrease',
    'recession', 'crash', 'plunge', 'downturn', 'struggle', 'threat', 'risk',
    'negative', 'pessimistic', 'weak', 'vulnerable', 'concern', 'worry', 'fear'
  ];
  
  // Impact keywords
  const highImpactKeywords = [
    'critical', 'urgent', 'major', 'significant', 'important', 'breaking', 'alert',
    'emergency', 'crisis', 'disaster', 'catastrophic', 'severe', 'extreme'
  ];
  
  let positiveCount = 0;
  let negativeCount = 0;
  let impactLevel: 'high' | 'medium' | 'low' = 'low';
  
  positiveKeywords.forEach(keyword => {
    if (text.includes(keyword)) positiveCount++;
  });
  
  negativeKeywords.forEach(keyword => {
    if (text.includes(keyword)) negativeCount++;
  });
  
  highImpactKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      impactLevel = 'high';
    }
  });
  
  // Calculate polarity score
  const total = positiveCount + negativeCount;
  let score = 0;
  let polarity: 'positive' | 'neutral' | 'negative' = 'neutral';
  
  if (total > 0) {
    score = (positiveCount - negativeCount) / Math.max(total, 1);
  }
  
  if (score > 0.2) {
    polarity = 'positive';
  } else if (score < -0.2) {
    polarity = 'negative';
  }
  
  // Determine impact if not already high
  if (impactLevel === 'low') {
    if (Math.abs(score) > 0.5 || total > 3) {
      impactLevel = 'medium';
    }
  }
  
  // Estimate emotions (simplified)
  const emotions = {
    fear: text.includes('fear') || text.includes('worry') || text.includes('concern') ? 0.6 : 0,
    anger: text.includes('anger') || text.includes('frustration') || text.includes('outrage') ? 0.5 : 0,
    joy: polarity === 'positive' && score > 0.5 ? 0.7 : 0,
    sadness: polarity === 'negative' && score < -0.5 ? 0.6 : 0,
  };
  
  return {
    polarity,
    score: Math.max(-1, Math.min(1, score)),
    emotions,
    impact: impactLevel,
    confidence: total > 0 ? Math.min(1, total / 5) : 0.3,
  };
}

function getSentimentColor(polarity: string): string {
  switch (polarity) {
    case 'positive':
      return 'text-green-400';
    case 'negative':
      return 'text-red-400';
    default:
      return 'text-yellow-400';
  }
}

function getSentimentBgColor(polarity: string): string {
  switch (polarity) {
    case 'positive':
      return 'bg-green-500/20 border-green-500/50';
    case 'negative':
      return 'bg-red-500/20 border-red-500/50';
    default:
      return 'bg-yellow-500/20 border-yellow-500/50';
  }
}

function getSentimentIcon(polarity: string) {
  switch (polarity) {
    case 'positive':
      return <TrendingUp className="w-3.5 h-3.5" />;
    case 'negative':
      return <TrendingDown className="w-3.5 h-3.5" />;
    default:
      return <Minus className="w-3.5 h-3.5" />;
  }
}

function getEmotionIcon(emotion: string) {
  switch (emotion) {
    case 'joy':
      return <Smile className="w-3 h-3" />;
    case 'sadness':
      return <Frown className="w-3 h-3" />;
    case 'fear':
    case 'anger':
      return <AlertCircle className="w-3 h-3" />;
    default:
      return <Meh className="w-3 h-3" />;
  }
}

export default function SentimentAnalysis({ result, sentiment }: SentimentAnalysisProps) {
  const sentimentData = sentiment || analyzeSentiment(result);
  const { polarity, score, emotions, impact, confidence } = sentimentData;

  // Only show if confidence is reasonable
  if (confidence < 0.3) {
    return null;
  }

  const dominantEmotion = emotions
    ? Object.entries(emotions)
        .filter(([_, value]) => value > 0.4)
        .sort(([_, a], [__, b]) => b - a)[0]
    : null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Main sentiment badge */}
      <div
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${getSentimentBgColor(polarity)} ${getSentimentColor(polarity)} border`}
        title={`Sentiment: ${polarity} (${(score * 100).toFixed(0)}%)`}
      >
        {getSentimentIcon(polarity)}
        <span className="capitalize">{polarity}</span>
        {Math.abs(score) > 0.5 && (
          <span className="text-[10px] opacity-75">
            {score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {/* Impact badge */}
      {impact === 'high' && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-400">
          <AlertCircle className="w-3 h-3" />
          <span>High Impact</span>
        </div>
      )}

      {/* Dominant emotion */}
      {dominantEmotion && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-background-glass-subtle border border-borders-subtle rounded text-xs text-text-secondary">
          {getEmotionIcon(dominantEmotion[0])}
          <span className="capitalize">{dominantEmotion[0]}</span>
        </div>
      )}
    </div>
  );
}

// Compact badge for use in ResultCard
export function SentimentBadge({ result, sentiment }: SentimentAnalysisProps) {
  const sentimentData = sentiment || analyzeSentiment(result);
  const { polarity, impact, confidence } = sentimentData;

  if (confidence < 0.3) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${getSentimentBgColor(polarity)} ${getSentimentColor(polarity)} border`}
        title={`Sentiment: ${polarity}`}
      >
        {getSentimentIcon(polarity)}
        <span className="capitalize">{polarity}</span>
      </div>
      {impact === 'high' && (
        <div className="w-1.5 h-1.5 rounded-full bg-red-400" title="High impact" />
      )}
    </div>
  );
}
