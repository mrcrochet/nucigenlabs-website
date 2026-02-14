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

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  }, [onClose]);

  const handleGenerate = useCallback(() => {
    if (!eventDescription.trim()) return;
    setIsGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      onGenerate({ event: eventDescription, timeframe, severity, scope, sectors, depth });
      setIsGenerating(false);
      setEventDescription('');
      setSectors('');
      onClose();
    }, 2000);
  }, [eventDescription, timeframe, severity, scope, sectors, depth, onGenerate, onClose]);

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
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder={"Describe the hypothetical event in detail...\n\ne.g., China announces full naval blockade of Taiwan shipping lanes, citing security concerns. US 7th Fleet moves to international waters. Japan and South Korea issue joint statement."}
              className="w-full min-h-[120px] bg-[#0a0a0a] border border-[#2a2a2a] text-white p-3 font-mono text-[0.75rem] leading-relaxed resize-y focus:outline-none focus:border-white focus:bg-[#0f0f0f] transition-all"
            />
            <div className="text-[0.65rem] font-mono text-[#666] mt-2 italic">
              Be specific about actors, actions, and initial reactions
            </div>

            {/* Examples */}
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 mt-4">
              <div className="text-[0.65rem] font-mono text-[#666] tracking-[1px] mb-3">
                EXAMPLE SCENARIOS
              </div>
              {EXAMPLE_LABELS.map((ex) => (
                <div
                  key={ex.key}
                  onClick={() => setEventDescription(EXAMPLES[ex.key])}
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
