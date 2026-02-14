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
// Two layers working together:
// 1. VISIBLE: Credibility Analysis panel with plausibility score + bar
// 2. INVISIBLE: Quiet reformulation below textarea when needed
// TODO: Replace heuristics with real AI endpoint.

// ── Layer 1: Credibility Score ──────────────────────────────────

interface CredibilityScore {
  plausibility: number; // 0-100
  label: 'HIGH' | 'MODERATE' | 'LOW' | 'IMPLAUSIBLE';
}

const PLAUSIBILITY_COLORS: Record<string, string> = {
  HIGH: '#00ff00',
  MODERATE: '#ffaa00',
  LOW: '#ff6600',
  IMPLAUSIBLE: '#ff0000',
};

function computeCredibilityScore(input: string): CredibilityScore | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // Implausible patterns
  const implausiblePatterns = [
    /\b(aliens?|ufo|extraterrestrial|zombie|asteroid\s+hit|meteor\s+strike)\b/i,
    /\b(god|jesus|rapture|magic|supernatural|time\s+travel)\b/i,
    /\b(nukes?|nuclear\s+(bomb|strike|attack))\s+(on|against)\s+(new\s+york|london|paris|tokyo|washington)\b/i,
    /\b(bitcoin|crypto)\s+(to\s+)?(zero|0|million|billion|infinity)\b/i,
    /\b(stock\s+)?market\s+(crash|crashes?)\s*(100%|completely|total)\b/i,
  ];

  for (const p of implausiblePatterns) {
    if (p.test(trimmed)) return { plausibility: 12, label: 'IMPLAUSIBLE' };
  }

  // Micro-state invasions
  if (/\b(invades?|invasion of)\s+(monaco|vatican|luxembourg|liechtenstein|andorra|san marino)\b/i.test(trimmed)) {
    return { plausibility: 15, label: 'IMPLAUSIBLE' };
  }

  // Leader death/assassination
  if (/\b(trump|biden|putin|xi|macron|modi|zelensky)\s+(dies?|dead|assassinat|killed|murdered)\b/i.test(trimmed)) {
    return { plausibility: 20, label: 'LOW' };
  }

  // WW3
  if (/\b(world\s+war\s+(3|iii|three)|ww3|global\s+war)\b/i.test(trimmed)) {
    return { plausibility: 18, label: 'IMPLAUSIBLE' };
  }

  // Vague single-word
  if (/^(war|crisis|crash|collapse|attack|boom|recession|oil|energy|china|taiwan|russia|ukraine|iran|israel)$/i.test(trimmed)) {
    return { plausibility: 30, label: 'LOW' };
  }

  // Heuristic scoring
  const wordCount = trimmed.split(/\s+/).length;
  const hasActors = /\b(us|usa|china|russia|eu|nato|opec|fed|ecb|un|iran|israel|saudi|japan|korea|india|ukraine|taiwan)\b/i.test(trimmed);
  const hasActions = /\b(announces?|sanctions?|deploys?|cuts?|raises?|blocks?|invades?|attacks?|negotiat|withdraw|escalat|de-escalat|signs?|breaks?|suspends?|bans?|tariffs?)\b/i.test(trimmed);
  const hasMarketContext = /\b(oil|gold|treasury|bonds?|stocks?|futures?|currencies|dollar|euro|yuan|markets?|prices?|rates?|yields?|inflation|gdp|trade)\b/i.test(trimmed);

  let score = 40;
  if (wordCount >= 10) score += 10;
  if (wordCount >= 20) score += 10;
  if (wordCount >= 35) score += 5;
  if (hasActors) score += 15;
  if (hasActions) score += 10;
  if (hasMarketContext) score += 10;
  score = Math.min(score, 95);

  let label: CredibilityScore['label'] = 'HIGH';
  if (score < 30) label = 'IMPLAUSIBLE';
  else if (score < 50) label = 'LOW';
  else if (score < 70) label = 'MODERATE';

  return { plausibility: score, label };
}

// ── Layer 2: Invisible Reformulation ────────────────────────────

interface Reformulation {
  text: string;
  shouldReplace: boolean;
}

const REFORMULATION_RULES: { pattern: RegExp; reformulate: (input: string) => string }[] = [
  {
    pattern: /\b(invades?|invasion of)\s+(monaco|vatican|luxembourg|liechtenstein|andorra|san marino)\b/i,
    reformulate: (input: string) => {
      const country = input.match(/(monaco|vatican|luxembourg|liechtenstein|andorra|san marino)/i)?.[1] || 'Monaco';
      const actor = input.match(/^(\w+)/)?.[1] || 'France';
      return `${actor} escalates diplomatic tensions with ${country} over territorial and fiscal sovereignty disputes. EU mediators called in. Border controls temporarily reinforced. Markets monitor contagion risk to Eurozone stability.`;
    },
  },
  {
    pattern: /\b(aliens?|ufo|extraterrestrial)\b/i,
    reformulate: () =>
      'Pentagon confirms multiple unauthorized incursions into restricted airspace by unidentified aerial systems. Congressional hearings fast-tracked. Defense contractors surge. Intelligence agencies issue classified briefings to allied nations.',
  },
  {
    pattern: /\bzombie\b/i,
    reformulate: () =>
      'Unknown pathogen triggers mass neurological incidents across multiple regions. WHO declares Public Health Emergency of International Concern. Travel restrictions imposed. Pharmaceutical and biotech sectors see extreme volatility.',
  },
  {
    pattern: /\b(asteroid\s+hit|meteor\s+strike|comet)\b/i,
    reformulate: () =>
      'NASA confirms high-probability near-Earth object on collision trajectory. Global emergency protocols activated. Insurance and reinsurance markets in turmoil. Defense agencies coordinate planetary defense response.',
  },
  {
    pattern: /\b(nukes?|nuclear\s+(bomb|strike|attack|war))\s*(on|against|hits?)?\s*(new\s+york|london|paris|tokyo|washington|moscow|beijing)?\b/i,
    reformulate: (input: string) => {
      const city = input.match(/(new\s+york|london|paris|tokyo|washington|moscow|beijing)/i)?.[1];
      const locationContext = city ? ` near ${city}` : '';
      return `Intelligence agencies report elevated nuclear posture by state actor${locationContext}. DEFCON level raised. Emergency UN Security Council session convened. Global markets enter risk-off mode. Gold surges, treasury yields spike. Diplomatic channels activated.`;
    },
  },
  {
    pattern: /\b(world\s+war\s+(3|iii|three)|ww3|global\s+war)\b/i,
    reformulate: () =>
      'Simultaneous military escalations across multiple theaters — South China Sea, Eastern Europe, and Persian Gulf. NATO and allied forces on heightened alert. Global supply chains face unprecedented disruption risk. Defense spending commitments accelerate across G7.',
  },
  {
    pattern: /\b(bitcoin|crypto)\s+(to\s+)?(zero|0|million|billion|infinity)\b/i,
    reformulate: () =>
      'Major cryptocurrency exchange halts withdrawals citing liquidity crisis. Contagion fears spread to DeFi protocols and stablecoins. SEC announces emergency investigation. Traditional markets monitor spillover risk. Crypto assets drop 40% in 48 hours.',
  },
  {
    pattern: /\b(stock\s+)?market\s+(crash|crashes?)\s*(100%|completely|total)\b/i,
    reformulate: () =>
      'Cascading liquidations trigger circuit breakers across major exchanges. S&P 500 drops 12% in single session — worst since 2020. Federal Reserve issues emergency statement. Global central banks coordinate liquidity injection.',
  },
  {
    pattern: /\b(trump|biden|putin|xi|macron|modi|zelensky)\s+(dies?|dead|assassinat|killed|murdered)\b/i,
    reformulate: (input: string) => {
      const leader = input.match(/(trump|biden|putin|xi|macron|modi|zelensky)/i)?.[1] || 'head of state';
      const name = leader.charAt(0).toUpperCase() + leader.slice(1).toLowerCase();
      return `${name} unexpectedly withdraws from public duties citing undisclosed medical situation. Power transition concerns dominate headlines. Political uncertainty spikes across allied and adversarial nations. Markets react to succession ambiguity and policy continuity risk.`;
    },
  },
  {
    pattern: /\b(god|jesus|rapture|magic|supernatural|time\s+travel)\b/i,
    reformulate: () =>
      'Unprecedented social upheaval driven by mass ideological movement disrupts governance in multiple nations. Markets face uncertainty as institutional stability is questioned. Safe-haven assets surge.',
  },
];

const VAGUE_ENRICHMENTS: { pattern: RegExp; enrichment: string }[] = [
  {
    pattern: /^war$/i,
    enrichment: 'Military conflict escalates between regional powers. UN Security Council emergency session called. Energy markets spike on supply disruption fears. NATO allies assess collective defense obligations.',
  },
  {
    pattern: /^(crisis|crash)$/i,
    enrichment: 'Systemic financial crisis emerges as major institution fails stress tests. Interbank lending freezes. Central banks coordinate emergency liquidity measures. Sovereign credit default swaps widen sharply.',
  },
  {
    pattern: /^recession$/i,
    enrichment: 'Leading economic indicators confirm synchronized global recession. US GDP contracts for second consecutive quarter. Unemployment claims surge. Federal Reserve pivots to aggressive easing. Corporate earnings revisions cascade.',
  },
  {
    pattern: /^(collapse|meltdown)$/i,
    enrichment: 'Systemic failure cascades through interconnected financial markets. Multiple circuit breakers triggered. Emergency G7 summit convened. Central banks announce coordinated intervention. Safe-haven assets see historic inflows.',
  },
  {
    pattern: /^(attack|terrorism|terror)$/i,
    enrichment: 'Coordinated attack on critical infrastructure in major Western capital. Security forces respond. Government declares state of emergency. International allies offer intelligence support. Markets enter risk-off mode.',
  },
  {
    pattern: /^(sanctions?|embargo)$/i,
    enrichment: 'Sweeping sanctions package targeting major economy announced by Western coalition. Trade flows disrupted. Commodity prices surge on supply chain reconfiguration. Targeted nation announces retaliatory measures.',
  },
  {
    pattern: /^(oil|energy)$/i,
    enrichment: 'Major disruption to global energy supply — key chokepoint compromised. Oil futures surge past $110/bbl. OPEC+ convenes emergency meeting. Strategic petroleum reserves released. Industrial nations activate contingency plans.',
  },
  {
    pattern: /^(china|taiwan)$/i,
    enrichment: 'China escalates military posture around Taiwan Strait. Live-fire exercises announced in shipping lanes. US carrier group repositions. Semiconductor supply chain faces imminent disruption risk. Regional markets sell off sharply.',
  },
  {
    pattern: /^(russia|ukraine)$/i,
    enrichment: 'Russia-Ukraine conflict enters new escalation phase. Major offensive launched along eastern front. NATO reinforces eastern flank. European energy security concerns resurface. Grain futures spike on Black Sea disruption.',
  },
  {
    pattern: /^(iran|israel)$/i,
    enrichment: 'Iran-Israel tensions escalate to direct military exchange. Strait of Hormuz transit risk elevated. Oil prices surge. US deploys additional assets to region. UN calls for immediate ceasefire.',
  },
];

function getReformulation(input: string): Reformulation | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 2) return null;

  for (const { pattern, enrichment } of VAGUE_ENRICHMENTS) {
    if (pattern.test(trimmed)) {
      return { text: enrichment, shouldReplace: true };
    }
  }

  for (const { pattern, reformulate } of REFORMULATION_RULES) {
    if (pattern.test(trimmed)) {
      return { text: reformulate(trimmed), shouldReplace: true };
    }
  }

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount >= 2 && wordCount <= 4 && trimmed.length < 40) {
    const hasActor = /\b(us|usa|china|russia|eu|nato|opec|fed|iran|israel|saudi|japan|korea|india|ukraine|taiwan|turkey|brazil|uk|france|germany)\b/i.test(trimmed);
    const hasAction = /\b(war|attack|sanctions?|blockade|invasion|crash|crisis|collapse|strike|coup|revolt|default)\b/i.test(trimmed);

    if (hasActor && hasAction) {
      return {
        text: `${trimmed.charAt(0).toUpperCase() + trimmed.slice(1)}. International community responds. Markets react to escalation risk. Regional allies assess strategic implications. Commodity and currency volatility spikes.`,
        shouldReplace: false,
      };
    }
  }

  return null;
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

export default function CustomScenarioModal({ isOpen, onClose, onGenerate }: CustomScenarioModalProps) {
  const [eventDescription, setEventDescription] = useState('');
  const [timeframe, setTimeframe] = useState<CustomScenarioFormData['timeframe']>('immediate');
  const [severity, setSeverity] = useState<CustomScenarioFormData['severity']>('high');
  const [scope, setScope] = useState<CustomScenarioFormData['scope']>('geopolitical');
  const [sectors, setSectors] = useState('');
  const [depth, setDepth] = useState<CustomScenarioFormData['depth']>('standard');
  const [isGenerating, setIsGenerating] = useState(false);

  // Layer 1: Credibility score
  const [credibility, setCredibility] = useState<CredibilityScore | null>(null);

  // Layer 2: Invisible reformulation
  const [reformulation, setReformulation] = useState<Reformulation | null>(null);
  const [showReformulation, setShowReformulation] = useState(false);

  // Shared
  const [isThinking, setIsThinking] = useState(false);
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

  // Debounced analysis — both layers run together
  const handleDescriptionChange = useCallback((value: string) => {
    setEventDescription(value);
    setShowReformulation(false);
    setReformulation(null);
    setCredibility(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim() || value.trim().length < 2) {
      setIsThinking(false);
      return;
    }

    setIsThinking(true);
    debounceRef.current = setTimeout(() => {
      // Layer 1: Score
      const score = computeCredibilityScore(value);
      setCredibility(score);

      // Layer 2: Reformulation (only when needed)
      const reform = getReformulation(value);
      setReformulation(reform);
      setShowReformulation(!!reform);

      setIsThinking(false);
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  const handleUseReformulation = useCallback(() => {
    if (reformulation) {
      setEventDescription(reformulation.text);
      setReformulation(null);
      setShowReformulation(false);
      // Re-score the reformulated text
      const score = computeCredibilityScore(reformulation.text);
      setCredibility(score);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [reformulation]);

  const handleGenerate = useCallback(() => {
    // If the original is implausible and user didn't act on reformulation,
    // silently use the reformulation instead
    const finalEvent = (reformulation?.shouldReplace && reformulation.text)
      ? reformulation.text
      : eventDescription;

    if (!finalEvent.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      onGenerate({ event: finalEvent, timeframe, severity, scope, sectors, depth });
      setIsGenerating(false);
      setEventDescription('');
      setSectors('');
      setReformulation(null);
      setShowReformulation(false);
      setCredibility(null);
      onClose();
    }, 2000);
  }, [eventDescription, reformulation, timeframe, severity, scope, sectors, depth, onGenerate, onClose]);

  if (!isOpen) return null;

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

            {/* Subtle thinking dots */}
            {isThinking && (
              <div className="flex items-center gap-2 mt-2 opacity-40">
                <div className="w-1 h-1 bg-[#666] animate-pulse" />
                <div className="w-1 h-1 bg-[#666] animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-1 bg-[#666] animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}

            {/* ── Layer 1: CREDIBILITY ANALYSIS panel ── */}
            {credibility && !isThinking && (
              <div className="mt-3 border border-[#1a1a1a] bg-[#0a0a0a] animate-[fadeIn_0.3s_ease]">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[0.6rem] font-mono text-[#444] tracking-[1px]">
                    CREDIBILITY ANALYSIS
                  </span>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[0.6rem] font-mono tracking-[1px]"
                      style={{ color: PLAUSIBILITY_COLORS[credibility.label] }}
                    >
                      {credibility.label}
                    </span>
                    <span className="text-[0.85rem] font-mono text-white">
                      {credibility.plausibility}
                      <span className="text-[0.55rem] text-[#444]">/100</span>
                    </span>
                  </div>
                </div>
                {/* Plausibility bar */}
                <div className="px-4 pb-3">
                  <div className="w-full h-[2px] bg-[#1a1a1a]">
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{
                        width: `${credibility.plausibility}%`,
                        backgroundColor: PLAUSIBILITY_COLORS[credibility.label],
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Layer 2: Invisible reformulation ── */}
            {showReformulation && reformulation && !isThinking && (
              <div className="mt-3 animate-[fadeIn_0.4s_ease]">
                <div
                  onClick={handleUseReformulation}
                  className="group relative border-l border-[#333] pl-3 py-2 cursor-pointer transition-all duration-300 hover:border-l-white"
                >
                  <div className="text-[0.6rem] font-mono text-[#444] tracking-[1px] mb-1.5">
                    ENGINE INTERPRETATION
                  </div>
                  <div className="text-[0.72rem] font-mono text-[#666] leading-relaxed group-hover:text-[#b4b4b4] transition-colors duration-300">
                    {reformulation.text}
                  </div>
                  <div className="text-[0.55rem] font-mono text-[#333] mt-2 group-hover:text-[#555] transition-colors duration-300">
                    CLICK TO USE THIS VERSION
                  </div>
                </div>
              </div>
            )}

            {/* Helper text — only when nothing is showing */}
            {!credibility && !showReformulation && !isThinking && (
              <div className="text-[0.65rem] font-mono text-[#666] mt-2 italic">
                Be specific about actors, actions, and initial reactions
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
              disabled={isGenerating || !eventDescription.trim()}
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
