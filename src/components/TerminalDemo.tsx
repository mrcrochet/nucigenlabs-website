import { useEffect, useState } from 'react';
import { Terminal, Zap, Brain, TrendingUp } from 'lucide-react';

export default function TerminalDemo() {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  const terminalSequence = [
    { text: '$ nucigen init --api-key=sk_live_***', delay: 0 },
    { text: '✓ Connected to Nucigen Labs Intelligence API', delay: 800 },
    { text: '✓ Loading global news sources... 847 sources active', delay: 1200 },
    { text: '', delay: 1600 },
    { text: '$ nucigen analyze --target="TSLA" --horizon="5d"', delay: 2000 },
    { text: '⚡ Analyzing real-time data streams...', delay: 2800 },
    { text: '🧠 Processing 12,847 signals...', delay: 3600 },
    { text: '📊 Causal inference model: 94% confidence', delay: 4400 },
    { text: '', delay: 5000 },
    { text: '━━━ SIGNAL DETECTED ━━━', delay: 5400 },
    { text: 'Asset: TSLA', delay: 5800 },
    { text: 'Direction: BULLISH ↗', delay: 6200 },
    { text: 'Strength: 8.7/10', delay: 6600 },
    { text: 'Confidence: 94%', delay: 7000 },
    { text: 'Time Horizon: 3-5 days', delay: 7400 },
    { text: '', delay: 7800 },
    { text: 'Key Events:', delay: 8200 },
    { text: '  • Factory expansion approved (2h ago)', delay: 8600 },
    { text: '  • Supply chain optimization detected', delay: 9000 },
    { text: '  • Institutional flow: +$142M (4h window)', delay: 9400 },
    { text: '', delay: 9800 },
    { text: '✓ Signal saved to dashboard', delay: 10200 },
    { text: '$ _', delay: 10600 },
  ];

  useEffect(() => {
    if (currentLineIndex >= terminalSequence.length) return;

    const currentLine = terminalSequence[currentLineIndex];
    const timeout = setTimeout(() => {
      setLines((prev) => [...prev, currentLine.text]);
      setCurrentLineIndex((prev) => prev + 1);
    }, currentLine.delay);

    return () => clearTimeout(timeout);
  }, [currentLineIndex]);

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-slate-500 font-light tracking-[0.3em] mb-6">
            DEVELOPER EXPERIENCE
          </p>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Intelligence at your fingertips
          </h2>
          <p className="text-base text-slate-400 font-light max-w-2xl mx-auto">
            Simple API. Powerful insights. Deploy in minutes.
          </p>
        </div>

        <div className="relative bg-black border border-white/[0.08] rounded-lg overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)`
          }}></div>

          <div className="relative flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <Terminal size={16} className="text-green-500" />
              <span className="text-sm text-slate-300 font-mono">nucigen-cli</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/60"></div>
            </div>
          </div>

          <div className="relative p-8 font-mono text-sm leading-loose min-h-[550px]">
            {lines.map((line, idx) => {
              if (line === '') {
                return <div key={idx} className="h-6"></div>;
              }

              if (line.startsWith('$')) {
                return (
                  <div key={idx} className="flex items-center gap-2 mb-1">
                    <span className="text-green-500">{line}</span>
                    {idx === lines.length - 1 && line.endsWith('_') && (
                      <span className="text-green-500 animate-pulse">▋</span>
                    )}
                  </div>
                );
              }

              if (line.startsWith('✓')) {
                return (
                  <div key={idx} className="text-green-500 mb-1">
                    {line}
                  </div>
                );
              }

              if (line.startsWith('⚡')) {
                return (
                  <div key={idx} className="text-blue-400 mb-1">
                    {line}
                  </div>
                );
              }

              if (line.startsWith('🧠')) {
                return (
                  <div key={idx} className="text-slate-400 mb-1">
                    {line}
                  </div>
                );
              }

              if (line.startsWith('📊')) {
                return (
                  <div key={idx} className="text-slate-400 mb-1">
                    {line}
                  </div>
                );
              }

              if (line.includes('━━━')) {
                return (
                  <div key={idx} className="my-6 py-3 border-y border-yellow-500/30">
                    <div className="text-center text-yellow-500 font-bold tracking-wider">
                      {line}
                    </div>
                  </div>
                );
              }

              if (line.includes('BULLISH ↗')) {
                return (
                  <div key={idx} className="mb-2">
                    <span className="text-slate-400">Direction: </span>
                    <span className="text-green-500 font-semibold">BULLISH ↗</span>
                  </div>
                );
              }

              if (line.startsWith('Asset:') || line.startsWith('Strength:') || line.startsWith('Confidence:') || line.startsWith('Time Horizon:')) {
                const [label, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                return (
                  <div key={idx} className="mb-2">
                    <span className="text-slate-400">{label}: </span>
                    <span className="text-white">{value}</span>
                  </div>
                );
              }

              if (line === 'Key Events:') {
                return (
                  <div key={idx} className="text-slate-300 font-semibold mb-3 mt-4">
                    {line}
                  </div>
                );
              }

              if (line.startsWith('  •')) {
                return (
                  <div key={idx} className="text-slate-400 mb-2">
                    {line}
                  </div>
                );
              }

              return (
                <div key={idx} className="text-slate-300 mb-1">
                  {line}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 hover:border-white/[0.1] transition-colors">
            <div className="text-2xl mb-4">⚡</div>
            <h3 className="text-lg text-white font-light mb-2">RESTful API</h3>
            <p className="text-sm text-slate-400 font-light">
              Simple HTTP endpoints. No complex setup. Full documentation.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 hover:border-white/[0.1] transition-colors">
            <div className="text-2xl mb-4">🔐</div>
            <h3 className="text-lg text-white font-light mb-2">Secure by Default</h3>
            <p className="text-sm text-slate-400 font-light">
              API keys, rate limiting, and encryption built-in.
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-6 hover:border-white/[0.1] transition-colors">
            <div className="text-2xl mb-4">📚</div>
            <h3 className="text-lg text-white font-light mb-2">SDKs Available</h3>
            <p className="text-sm text-slate-400 font-light">
              Python, JavaScript, Go. Install and start in 60 seconds.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
