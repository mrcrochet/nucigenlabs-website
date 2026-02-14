import { useState, useEffect, useRef, useCallback } from 'react';

interface CustomScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: CustomScenarioFormData) => void;
}

export interface CustomScenarioFormData {
  event: string;
  timeframe: 'immediate' | 'near' | 'long';
  severity: 'low' | 'medium' | 'high' | 'critical';
  scope: 'geopolitical' | 'economic' | 'markets' | 'technology';
  sectors: string;
  depth: 'standard' | 'deep';
}

// ── Credibility Alignment Layer ─────────────────────────────────
// Instead of rejecting unrealistic scenarios, we score plausibility
// and suggest a reformulated version when confidence is low.
// TODO: Replace mock logic with real AI validation endpoint.

interface CredibilityResult {
  plausibility: number; // 0-100
  label: 'HIGH' | 'MODERATE' | 'LOW' | 'IMPLAUSIBLE';
  reasoning: string;
  reformulation: string | null; // null if plausibility >= 60
}

// Keyword-based heuristic patterns (mock — will be replaced by AI)
const IMPLAUSIBLE_PATTERNS: { pattern: RegExp; reason: string; reformulate: (input: string) => string }[] = [
  {
    pattern: /\b(invades?|invasion of)\s+(monaco|vatican|luxembourg|liechtenstein|andorra|san marino)\b/i,
    reason: 'Military invasion of micro-states has no historical precedent or strategic logic.',
    reformulate: (input: string) =>
      input.replace(/invades?\s+(monaco|vatican|luxembourg|liechtenstein|andorra|san marino)/i,
        'escalates diplomatic tensions with neighboring $1 over border disputes'),
  },
  {
    pattern: /\b(aliens?|ufo|extraterrestrial|zombie|asteroid\s+hit|meteor\s+strike)\b/i,
    reason: 'Scenario involves non-geopolitical / science-fiction elements outside model scope.',
    reformulate: () =>
      'Unidentified aerial phenomena trigger national security protocols. Pentagon confirms multiple incursions into restricted airspace. Congressional hearings scheduled. Defense contractors see increased activity.',
  },
  {
    pattern: /\b(nukes?|nuclear\s+(bomb|strike|attack)\s+(on|against)\s+(new\s+york|london|paris|tokyo|washington))\b/i,
    reason: 'Direct nuclear strike on major cities is an extreme tail-risk with near-zero baseline probability.',
    reformulate: () =>
      'Intelligence reports suggest elevated nuclear posture by state actor. DEFCON level raised. Emergency UN Security Council session convened. Markets enter risk-off mode. Gold and treasury yields spike.',
  },
  {
    pattern: /\b(world\s+war\s+(3|iii|three)|ww3|global\s+war)\b/i,
    reason: 'Full-scale global war is modeled as a convergence of regional escalations, not a single event.',
    reformulate: () =>
      'Simultaneous military escalations across multiple theaters — South China Sea, Eastern Europe, and Persian Gulf. NATO and allied forces on heightened alert. Global supply chains face unprecedented disruption risk.',
  },
  {
    pattern: /\b(bitcoin\s+to\s+(zero|0|million)|market\s+crash\s+100%|stock\s+market\s+(disappears?|vanish))\b/i,
    reason: 'Complete market collapse or infinite appreciation lacks historical basis for modeling.',
    reformulate: () =>
      'Major cryptocurrency exchange halts withdrawals citing liquidity crisis. Contagion fears spread to traditional markets. SEC announces emergency investigation. Crypto assets drop 40% in 48 hours.',
  },
  {
    pattern: /\b(trump|biden|putin|xi)\s+(dies?|assassinat|killed)\b/i,
    reason: 'Assassination of specific leaders is sensitive. Model frames as succession/power-vacuum scenario.',
    reformulate: (input: string) => {
      const leader = input.match(/(trump|biden|putin|xi)/i)?.[1] || 'head of state';
      return `${leader.charAt(0).toUpperCase() + leader.slice(1)} announces unexpected medical leave. Power transition concerns emerge. Political uncertainty spikes. Markets react to succession ambiguity. Allied nations issue statements of concern.`;
    },
  },
];

const LOW_EFFORT_PATTERN = /^.{0,15}$/; // Less than 15 chars
const VAGUE_PATTERN = /^(war|crisis|crash|collapse|attack|boom|recession)$/i;

function analyzeCredibility(input: string): CredibilityResult | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 5) return null;

  // Check for vague / low-effort
  if (LOW_EFFORT_PATTERN.test(trimmed) || VAGUE_PATTERN.test(trimmed)) {
    return {
      plausibility: 25,
      label: 'LOW',
      reasoning: 'Scenario description is too vague. Add specific actors, actions, and context for meaningful analysis.',
      reformulation: null,
    };
  }

  // Check implausible patterns
  for (const { pattern, reason, reformulate } of IMPLAUSIBLE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        plausibility: 12,
        label: 'IMPLAUSIBLE',
        reasoning: reason,
        reformulation: reformulate(trimmed),
      };
    }
  }

  // Heuristic scoring based on detail level
  const wordCount = trimmed.split(/\s+/).length;
  const hasActors = /\b(us|usa|china|russia|eu|nato|opec|fed|ecb|un|iran|israel|saudi|japan|korea|india|ukraine|taiwan)\b/i.test(trimmed);
  const hasActions = /\b(announces?|sanctions?|deploys?|cuts?|raises?|blocks?|invades?|attacks?|negotiat|withdraw|escalat|de-escalat|signs?|breaks?|suspends?|bans?|tariffs?)\b/i.test(trimmed);
  const hasMarketContext = /\b(oil|gold|treasury|bonds?|stocks?|futures?|currencies|dollar|euro|yuan|markets?|prices?|rates?|yields?|inflation|gdp|trade)\b/i.test(trimmed);

  let score = 40; // baseline
  if (wordCount >= 10) score += 10;
  if (wordCount >= 20) score += 10;
  if (wordCount >= 35) score += 5;
  if (hasActors) score += 15;
  if (hasActions) score += 10;
  if (hasMarketContext) score += 10;

  score = Math.min(score, 95);

  let label: CredibilityResult['label'] = 'HIGH';
  if (score < 30) label = 'IMPLAUSIBLE';
  else if (score < 50) label = 'LOW';
  else if (score < 70) label = 'MODERATE';

  return {
    plausibility: score,
    label,
    reasoning: label === 'HIGH'
      ? 'Scenario contains specific actors, actions, and context. Suitable for probabilistic modeling.'
      : label === 'MODERATE'
        ? 'Scenario is plausible but could benefit from more specificity — actors, reactions, or market context.'
        : 'Scenario lacks sufficient detail or geopolitical grounding for reliable modeling.',
    reformulation: null,
  };
}

// ── End Credibility Layer ───────────────────────────────────────

const EXAMPLES: Record<string, string> = {
  '1': 'OPEC+ announces emergency production cut of 2M barrels/day effective immediately. Saudi Arabia and Russia lead the decision. Oil futures surge 8% in after-hours trading. US administration condemns the move as politically motivated.',
  '2': 'Major cyberattack disrupts European energy grid for 72+ hours, attribution unclear. Germany, France, and Poland most affected. NATO convenes emergency meeting. Russia denies involvement. Energy prices spike across Europe.',
  '3': 'Fed announces emergency rate hike of 100bps citing inflation resurgence. Markets caught off-guard. S&P 500 drops 4% immediately. Treasury yields spike. Dollar strengthens sharply against all major currencies.',
};

const EXAMPLE_LABELS = [
  { key: '1', text: 'OPEC+ announces emergency production cut of 2M barrels/day effective immediately' },
  { key: '2', text: 'Major cyberattack disrupts European energy grid for 72+ hours, attribution unclear' },
  { key: '3', text: 'Fed announces emergency rate hike of 100bps citing inflation resurgence' },
];

const PLAUSIBILITY_COLORS: Record<string, string> = {
  HIGH: '#00ff00',
  MODERATE: '#ffaa00',
  LOW: '#ff6600',
  IMPLAUSIBLE: '#ff0000',
};

export default function CustomScenarioModal({ isOpen, onClose, onGenerate }: CustomScenarioModalProps) {
  const [eventDescription, setEventDescription] = useState('');
  const [timeframe, setTimeframe] = useState<CustomScenarioFormData['timeframe']>('immediate');
  const [severity, setSeverity] = useState<CustomScenarioFormData['severity']>('high');
  const [scope, setScope] = useState<CustomScenarioFormData['scope']>('geopolitical');
  const [sectors, setSectors] = useState('');
  const [depth, setDepth] = useState<CustomScenarioFormData['depth']>('standard');
  const [isGenerating, setIsGenerating] = useState(false);

  // Credibility state
  const [credibility, setCredibility] = useState<CredibilityResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Focus textarea on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Debounced credibility analysis
  const handleDescriptionChange = useCallback((value: string) => {
    setEventDescription(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || value.trim().length < 5) {
      setCredibility(null);
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    debounceRef.current = setTimeout(() => {
      // Simulate network delay for realistic feel
      const result = analyzeCredibility(value);
      setCredibility(result);
      setIsAnalyzing(false);
    }, 800);
  }, []);

  // Clear debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  const handleAcceptReformulation = useCallback(() => {
    if (credibility?.reformulation) {
      setEventDescription(credibility.reformulation);
      // Re-analyze the reformulated text
      setIsAnalyzing(true);
      setTimeout(() => {
        const result = analyzeCredibility(credibility.reformulation!);
        setCredibility(result);
        setIsAnalyzing(false);
      }, 600);
    }
  }, [credibility]);

  const handleGenerate = useCallback(() => {
    if (!eventDescription.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      onGenerate({ event: eventDescription, timeframe, severity, scope, sectors, depth });
      setIsGenerating(false);
      setEventDescription('');
      setSectors('');
      setCredibility(null);
      onClose();
    }, 2000);
  }, [eventDescription, timeframe, severity, scope, sectors, depth, onGenerate, onClose]);

  if (!isOpen) return null;

  const isBlocked = credibility?.label === 'IMPLAUSIBLE' && !credibility.reformulation;
  const canGenerate = eventDescription.trim().length > 0
    && !isGenerating
    && credibility?.label !== 'IMPLAUSIBLE';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 animate-[fadeIn_0.2s_ease]"
    >
      <div className="bg-black border border-[#2a2a2a] w-[90%] max-w-[700px] max-h-[90vh] overflow-y-auto animate-[slideUp_0.3s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <h2 className="text-[0.9rem] font-mono text-white tracking-[2px] font-normal">
            CREATE CUSTOM SCENARIO
          </h2>
          <button
            onClick={onClose}
            className="text-[#666] text-2xl font-normal leading-none cursor-pointer hover:text-white transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Event Description */}
          <div className="mb-8">
            <label className="block text-[0.65rem] font-mono text-[#666] tracking-[1px] uppercase mb-3">
              EVENT DESCRIPTION
            </label>
            <textarea
              ref={textareaRef}
              value={eventDescription}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder={"Describe the hypothetical event in detail...\n\ne.g., China announces full naval blockade of Taiwan shipping lanes, citing security concerns. US 7th Fleet moves to international waters. Japan and South Korea issue joint statement."}
              className="w-full min-h-[120px] bg-[#0a0a0a] border border-[#2a2a2a] text-white p-3 font-mono text-[0.75rem] leading-relaxed resize-y focus:outline-none focus:border-white focus:bg-[#0f0f0f] transition-all"
            />
            <div className="text-[0.65rem] font-mono text-[#666] mt-2 italic">
              Be specific about actors, actions, and initial reactions
            </div>

            {/* ── Credibility Alignment Layer UI ── */}
            {(isAnalyzing || credibility) && (
              <div className="mt-4 border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden animate-[slideUp_0.2s_ease]">
                {/* Header bar with score */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
                  <div className="flex items-center gap-3">
                    <span className="text-[0.6rem] font-mono text-[#666] tracking-[1px]">
                      CREDIBILITY ANALYSIS
                    </span>
                    {isAnalyzing && (
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 border border-[#1a1a1a] border-t-white rounded-full animate-spin" />
                        <span className="text-[0.6rem] font-mono text-[#444]">ANALYZING...</span>
                      </div>
                    )}
                  </div>
                  {credibility && !isAnalyzing && (
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[0.65rem] font-mono tracking-[1px] font-normal"
                        style={{ color: PLAUSIBILITY_COLORS[credibility.label] }}
                      >
                        {credibility.label}
                      </span>
                      <span className="text-[1rem] font-mono font-normal text-white">
                        {credibility.plausibility}
                        <span className="text-[0.6rem] text-[#666]">/100</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Plausibility bar */}
                {credibility && !isAnalyzing && (
                  <div className="px-4 pt-3">
                    <div className="w-full h-1 bg-[#1a1a1a]">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${credibility.plausibility}%`,
                          backgroundColor: PLAUSIBILITY_COLORS[credibility.label],
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Reasoning */}
                {credibility && !isAnalyzing && (
                  <div className="px-4 py-3">
                    <div className="text-[0.7rem] font-mono text-[#888] leading-relaxed">
                      {credibility.reasoning}
                    </div>
                  </div>
                )}

                {/* Reformulation suggestion */}
                {credibility?.reformulation && !isAnalyzing && (
                  <div className="mx-4 mb-4 border border-[#1a3a1a] bg-[#0a1a0a]">
                    <div className="px-4 py-3 border-b border-[#1a3a1a]">
                      <span className="text-[0.6rem] font-mono text-[#00ff00] tracking-[1px]">
                        SUGGESTED REFORMULATION
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <div className="text-[0.7rem] font-mono text-[#b4b4b4] leading-relaxed mb-3">
                        {credibility.reformulation}
                      </div>
                      <button
                        onClick={handleAcceptReformulation}
                        className="bg-[#0a1a0a] border border-[#00ff00] text-[#00ff00] py-2 px-4 font-mono text-[0.65rem] tracking-[1px] uppercase cursor-pointer transition-all duration-200 hover:bg-[#00ff00] hover:text-black"
                      >
                        ACCEPT REFORMULATION
                      </button>
                    </div>
                  </div>
                )}

                {/* Blocked warning for implausible without reformulation */}
                {isBlocked && !isAnalyzing && (
                  <div className="mx-4 mb-4 px-4 py-3 border border-[rgba(255,0,0,0.3)] bg-[rgba(255,0,0,0.05)]">
                    <div className="text-[0.65rem] font-mono text-[#ff0000] tracking-[1px]">
                      SCENARIO BLOCKED — Add more detail and geopolitical context to proceed.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Examples */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 mt-4">
              <div className="text-[0.65rem] font-mono text-[#666] tracking-[1px] mb-3">
                EXAMPLE SCENARIOS
              </div>
              {EXAMPLE_LABELS.map((ex) => (
                <div
                  key={ex.key}
                  onClick={() => handleDescriptionChange(EXAMPLES[ex.key])}
                  className="text-[0.7rem] font-mono text-[#b4b4b4] p-2 border-l-2 border-[#2a2a2a] mb-2 cursor-pointer transition-all duration-200 hover:border-l-white hover:bg-[#0f0f0f] hover:text-white"
                >
                  {ex.text}
                </div>
              ))}
            </div>
          </div>

          {/* Timeframe + Severity */}
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.65rem] font-mono text-[#666] tracking-[1px] uppercase mb-3">
                  TIMEFRAME
                </label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as CustomScenarioFormData['timeframe'])}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white p-3 font-mono text-[0.75rem] cursor-pointer focus:outline-none focus:border-white transition-all rounded-none appearance-none"
                >
                  <option value="immediate">IMMEDIATE (0-3M)</option>
                  <option value="near">NEAR-TERM (3-12M)</option>
                  <option value="long">LONG-TERM (12M+)</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.65rem] font-mono text-[#666] tracking-[1px] uppercase mb-3">
                  INITIAL SEVERITY
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as CustomScenarioFormData['severity'])}
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white p-3 font-mono text-[0.75rem] cursor-pointer focus:outline-none focus:border-white transition-all rounded-none appearance-none"
                >
                  <option value="low">LOW (Tension &lt; 50)</option>
                  <option value="medium">MEDIUM (Tension 50-70)</option>
                  <option value="high">HIGH (Tension 70-85)</option>
                  <option value="critical">CRITICAL (Tension &gt; 85)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="mb-8">
            <label className="block text-[0.65rem] font-mono text-[#666] tracking-[1px] uppercase mb-3">
              PRIMARY SCOPE
            </label>
            <div className="flex flex-wrap gap-4 mt-2">
              {(['geopolitical', 'economic', 'markets', 'technology'] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value={s}
                    checked={scope === s}
                    onChange={() => setScope(s)}
                    className="appearance-none w-3.5 h-3.5 border border-[#2a2a2a] bg-black cursor-pointer relative checked:border-white
                      checked:before:content-[''] checked:before:absolute checked:before:top-[3px] checked:before:left-[3px] checked:before:w-1.5 checked:before:h-1.5 checked:before:bg-white"
                  />
                  <span className="text-[0.7rem] font-mono text-[#b4b4b4] tracking-[1px]">
                    {s.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Sectors */}
          <div className="mb-8">
            <label className="block text-[0.65rem] font-mono text-[#666] tracking-[1px] uppercase mb-3">
              PRIMARY AFFECTED SECTORS (OPTIONAL)
            </label>
            <input
              type="text"
              value={sectors}
              onChange={(e) => setSectors(e.target.value)}
              placeholder="e.g., Energy, Defense, Technology, Finance"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white p-3 font-mono text-[0.75rem] focus:outline-none focus:border-white focus:bg-[#0f0f0f] transition-all"
            />
            <div className="text-[0.65rem] font-mono text-[#666] mt-2 italic">
              Comma-separated list. Leave empty for AI to determine.
            </div>
          </div>

          {/* Analysis Depth */}
          <div className="mb-8">
            <label className="block text-[0.65rem] font-mono text-[#666] tracking-[1px] uppercase mb-3">
              ANALYSIS DEPTH
            </label>
            <div className="flex gap-4 mt-2">
              {([
                { value: 'standard' as const, label: 'STANDARD (3 BRANCHES)' },
                { value: 'deep' as const, label: 'DEEP (5 BRANCHES)' },
              ]).map((d) => (
                <label key={d.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="depth"
                    value={d.value}
                    checked={depth === d.value}
                    onChange={() => setDepth(d.value)}
                    className="appearance-none w-3.5 h-3.5 border border-[#2a2a2a] bg-black cursor-pointer relative checked:border-white
                      checked:before:content-[''] checked:before:absolute checked:before:top-[3px] checked:before:left-[3px] checked:before:w-1.5 checked:before:h-1.5 checked:before:bg-white"
                  />
                  <span className="text-[0.7rem] font-mono text-[#b4b4b4] tracking-[1px]">
                    {d.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Pro tier warning */}
          <div className="bg-[rgba(255,0,0,0.05)] border border-[rgba(255,0,0,0.3)] p-4">
            <div className="text-[0.65rem] font-mono text-[#ff0000] tracking-[1px] mb-2">
              PROFESSIONAL FEATURE
            </div>
            <div className="text-[0.7rem] font-mono text-[#b4b4b4] leading-relaxed">
              Custom scenario generation requires Professional or Institutional tier.
              You have 2/5 custom scenarios remaining this month.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#1a1a1a] flex-wrap gap-4">
          <span className="inline-block px-2 py-1 text-[0.6rem] font-mono border border-[#ffaa00] text-[#ffaa00] tracking-[1px]">
            PRO TIER REQUIRED
          </span>
          <div className="flex items-center gap-4">
            {isGenerating && (
              <div className="flex items-center gap-2 text-[#666] text-[0.7rem] font-mono">
                <div className="w-3 h-3 border-2 border-[#1a1a1a] border-t-white rounded-full animate-spin" />
                <span>GENERATING SCENARIO...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="bg-black border border-[#2a2a2a] text-white py-3 px-6 font-mono text-[0.7rem] tracking-[2px] uppercase cursor-pointer transition-all duration-200 hover:bg-[#1a1a1a] hover:border-white"
            >
              CANCEL
            </button>
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="bg-black border border-white text-white py-3 px-6 font-mono text-[0.7rem] tracking-[2px] uppercase cursor-pointer transition-all duration-200 hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-black disabled:hover:text-white"
            >
              GENERATE SCENARIO
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
