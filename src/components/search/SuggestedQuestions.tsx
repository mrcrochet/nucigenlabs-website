/**
 * Suggested Questions Component
 * 
 * AI-generated questions based on search results
 * Each question triggers a followup search
 */

import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Search, CheckCircle2, XCircle, TrendingUp, Factory, AlertTriangle } from 'lucide-react';
import type { SearchResult, KnowledgeGraph } from '../../types/search';

interface SuggestedQuestionsProps {
  query: string;
  inputType: 'text' | 'url';
  results: SearchResult[];
  graph: KnowledgeGraph;
  onQuestionClick: (question: string) => void;
  isLoading?: boolean;
}

interface SuggestedQuestion {
  id: string;
  text: string;
  category: 'similar' | 'verify' | 'contradict' | 'impact' | 'prediction' | 'exposure';
  icon: React.ReactNode;
}

export default function SuggestedQuestions({
  query,
  inputType,
  results,
  graph,
  onQuestionClick,
  isLoading = false,
}: SuggestedQuestionsProps) {
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate questions based on query and results
  useEffect(() => {
    if (results.length === 0) {
      setQuestions([]);
      return;
    }

    const generateQuestions = async () => {
      setIsGenerating(true);

      try {
        const response = await fetch('/api/search/session/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            inputType,
            resultsCount: results.length,
            entities: graph.nodes
              .filter((n: any) => ['country', 'company', 'organization'].includes(n.type))
              .slice(0, 5)
              .map((n: any) => n.label),
            // NEW: Include claims, impact scores, and high-impact results
            claims: results.flatMap(r => (r as any).claims || []).slice(0, 5).map((c: any) => ({
              text: c.text,
              certainty: c.certainty,
              type: c.type,
            })),
            highImpactResults: results
              .filter(r => ((r as any).impactScore || 0) > 0.7)
              .slice(0, 3)
              .map(r => ({
                title: r.title,
                impactScore: (r as any).impactScore,
              })),
            sectors: results
              .flatMap(r => r.tags || [])
              .filter((tag, idx, arr) => arr.indexOf(tag) === idx)
              .slice(0, 5),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate questions');
        }

        const data = await response.json();
        
        if (data.success && data.questions) {
          setQuestions(data.questions.map((q: string, idx: number) => ({
            id: `q-${idx}`,
            text: q,
            category: categorizeQuestion(q),
            icon: getQuestionIcon(categorizeQuestion(q)),
          })));
        } else {
          // Fallback to default questions
          setQuestions(generateDefaultQuestions(query, inputType));
        }
      } catch (error: any) {
        console.error('[SuggestedQuestions] Error generating questions:', error);
        // Fallback to default questions
        setQuestions(generateDefaultQuestions(query, inputType));
      } finally {
        setIsGenerating(false);
      }
    };

    generateQuestions();
  }, [query, inputType, results.length, graph.nodes]);

  // Categorize question based on keywords
  const categorizeQuestion = (question: string): SuggestedQuestion['category'] => {
    const lower = question.toLowerCase();
    if (lower.includes('similar') || lower.includes('related')) return 'similar';
    if (lower.includes('confirm') || lower.includes('verify') || lower.includes('true')) return 'verify';
    if (lower.includes('false') || lower.includes('misleading') || lower.includes('contradict')) return 'contradict';
    if (lower.includes('impact') || lower.includes('affect') || lower.includes('consequence')) return 'impact';
    if (lower.includes('next') || lower.includes('happen') || lower.includes('predict')) return 'prediction';
    if (lower.includes('expose') || lower.includes('sector') || lower.includes('company')) return 'exposure';
    return 'similar';
  };

  // Get icon for category
  const getQuestionIcon = (category: SuggestedQuestion['category']) => {
    switch (category) {
      case 'similar':
        return <Search className="w-4 h-4" />;
      case 'verify':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'contradict':
        return <XCircle className="w-4 h-4" />;
      case 'impact':
        return <TrendingUp className="w-4 h-4" />;
      case 'prediction':
        return <Sparkles className="w-4 h-4" />;
      case 'exposure':
        return <Factory className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  // Generate default questions if AI generation fails
  const generateDefaultQuestions = (query: string, type: 'text' | 'url'): SuggestedQuestion[] => {
    if (type === 'url') {
      return [
        {
          id: 'q-1',
          text: 'Find similar articles',
          category: 'similar',
          icon: <Search className="w-4 h-4" />,
        },
        {
          id: 'q-2',
          text: 'Is this information confirmed by other sources?',
          category: 'verify',
          icon: <CheckCircle2 className="w-4 h-4" />,
        },
        {
          id: 'q-3',
          text: 'What could be misleading or false here?',
          category: 'contradict',
          icon: <XCircle className="w-4 h-4" />,
        },
        {
          id: 'q-4',
          text: 'What are the potential economic impacts?',
          category: 'impact',
          icon: <TrendingUp className="w-4 h-4" />,
        },
        {
          id: 'q-5',
          text: 'What could happen next if this escalates?',
          category: 'prediction',
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          id: 'q-6',
          text: 'Which sectors or companies are exposed?',
          category: 'exposure',
          icon: <Factory className="w-4 h-4" />,
        },
      ];
    } else {
      // Text search questions
      return [
        {
          id: 'q-1',
          text: `Find more recent updates about ${query}`,
          category: 'similar',
          icon: <Search className="w-4 h-4" />,
        },
        {
          id: 'q-2',
          text: `What are the key actors involved in ${query}?`,
          category: 'similar',
          icon: <Search className="w-4 h-4" />,
        },
        {
          id: 'q-3',
          text: `What are the potential risks related to ${query}?`,
          category: 'impact',
          icon: <AlertTriangle className="w-4 h-4" />,
        },
        {
          id: 'q-4',
          text: `Which sectors are affected by ${query}?`,
          category: 'exposure',
          icon: <Factory className="w-4 h-4" />,
        },
      ];
    }
  };

  if (isGenerating) {
    return (
      <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-[#E1463E]" />
          <h3 className="text-lg font-semibold text-text-primary">Suggested Questions</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#E1463E] animate-spin" />
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="bg-background-glass-subtle border border-borders-subtle rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-5 h-5 text-[#E1463E]" />
        <h3 className="text-lg font-semibold text-text-primary">Suggested Questions</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {questions.map((question) => (
          <button
            key={question.id}
            onClick={() => onQuestionClick(question.text)}
            disabled={isLoading}
            className="flex items-start gap-3 p-4 bg-background-glass-medium hover:bg-background-glass-strong border border-borders-subtle rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="text-[#E1463E] mt-0.5 group-hover:scale-110 transition-transform">
              {question.icon}
            </div>
            <span className="text-sm text-text-primary font-medium flex-1">
              {question.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
