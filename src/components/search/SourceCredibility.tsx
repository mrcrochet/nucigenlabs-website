/**
 * Source Credibility Component
 * 
 * Displays credibility score and factors for sources
 * Includes fact-check rating, bias rating, and verification status
 */

import { Shield, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import type { SearchResult } from '../../types/search';

interface SourceCredibilityData {
  score: number; // 0-100
  factors: {
    domainAuthority: number;
    factCheckRating?: 'verified' | 'mostly-true' | 'mixed' | 'unverified' | 'disputed';
    biasRating?: 'left' | 'center-left' | 'center' | 'center-right' | 'right' | 'unknown';
    verificationStatus: 'verified' | 'unverified' | 'disputed';
  };
  verificationSources?: string[];
}

interface SourceCredibilityProps {
  result: SearchResult;
  credibility?: SourceCredibilityData;
}

// Known credible domains (in production, this would come from a database)
const CREDIBLE_DOMAINS: Record<string, Partial<SourceCredibilityData>> = {
  'reuters.com': {
    score: 95,
    factors: {
      domainAuthority: 95,
      factCheckRating: 'verified',
      biasRating: 'center',
      verificationStatus: 'verified',
    },
  },
  'ap.org': {
    score: 95,
    factors: {
      domainAuthority: 95,
      factCheckRating: 'verified',
      biasRating: 'center',
      verificationStatus: 'verified',
    },
  },
  'bbc.com': {
    score: 90,
    factors: {
      domainAuthority: 92,
      factCheckRating: 'mostly-true',
      biasRating: 'center-left',
      verificationStatus: 'verified',
    },
  },
  'ft.com': {
    score: 92,
    factors: {
      domainAuthority: 90,
      factCheckRating: 'verified',
      biasRating: 'center',
      verificationStatus: 'verified',
    },
  },
  'wsj.com': {
    score: 90,
    factors: {
      domainAuthority: 92,
      factCheckRating: 'verified',
      biasRating: 'center-right',
      verificationStatus: 'verified',
    },
  },
  'economist.com': {
    score: 88,
    factors: {
      domainAuthority: 88,
      factCheckRating: 'mostly-true',
      biasRating: 'center',
      verificationStatus: 'verified',
    },
  },
};

// Calculate credibility from domain
function calculateCredibility(result: SearchResult): SourceCredibilityData {
  const domain = extractDomain(result.url);
  const knownCredibility = CREDIBLE_DOMAINS[domain];

  if (knownCredibility) {
    return knownCredibility as SourceCredibilityData;
  }

  // Default calculation based on source score and domain patterns
  const domainAuthority = result.sourceScore * 100 || 50;
  const isGovernment = domain.includes('.gov') || domain.includes('.edu');
  const isNews = domain.includes('news') || domain.includes('reuters') || domain.includes('ap');
  
  let score = domainAuthority;
  if (isGovernment) score += 10;
  if (isNews) score += 5;
  
  score = Math.min(100, Math.max(0, score));

  return {
    score: Math.round(score),
    factors: {
      domainAuthority: Math.round(domainAuthority),
      factCheckRating: score > 70 ? 'mostly-true' : score > 50 ? 'mixed' : 'unverified',
      biasRating: 'unknown',
      verificationStatus: score > 70 ? 'verified' : score > 50 ? 'unverified' : 'disputed',
    },
  };
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

function getCredibilityColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function getCredibilityIcon(score: number) {
  if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-400" />;
  if (score >= 60) return <Info className="w-4 h-4 text-yellow-400" />;
  if (score >= 40) return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

export default function SourceCredibility({ result, credibility }: SourceCredibilityProps) {
  const credibilityData = credibility || calculateCredibility(result);
  const { score, factors } = credibilityData;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Shield className={`w-3.5 h-3.5 ${getCredibilityColor(score)}`} />
        <span className={`text-xs font-medium ${getCredibilityColor(score)}`}>
          {score}% credible
        </span>
      </div>
      
      {/* Tooltip with details */}
      <div className="group relative">
        {getCredibilityIcon(score)}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-background-elevated border border-borders-subtle rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="space-y-2 text-xs">
            <div className="font-semibold text-text-primary mb-2">Credibility Details</div>
            
            <div>
              <span className="text-text-secondary">Domain Authority:</span>
              <span className="text-text-primary ml-2">{factors.domainAuthority}/100</span>
            </div>
            
            {factors.factCheckRating && (
              <div>
                <span className="text-text-secondary">Fact Check:</span>
                <span className="text-text-primary ml-2 capitalize">
                  {factors.factCheckRating.replace('-', ' ')}
                </span>
              </div>
            )}
            
            {factors.biasRating && factors.biasRating !== 'unknown' && (
              <div>
                <span className="text-text-secondary">Bias:</span>
                <span className="text-text-primary ml-2 capitalize">
                  {factors.biasRating.replace('-', ' ')}
                </span>
              </div>
            )}
            
            <div>
              <span className="text-text-secondary">Status:</span>
              <span className="text-text-primary ml-2 capitalize">
                {factors.verificationStatus}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export function to get credibility badge for use in ResultCard
export function CredibilityBadge({ result, credibility }: SourceCredibilityProps) {
  const credibilityData = credibility || calculateCredibility(result);
  const { score } = credibilityData;

  if (score < 50) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-xs">
        <AlertTriangle className="w-3 h-3" />
        Low credibility
      </span>
    );
  }

  return null;
}
