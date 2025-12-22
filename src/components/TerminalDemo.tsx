import { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';

export default function TerminalDemo() {
  const [copied, setCopied] = useState<string | null>(null);

  const codeExamples = [
    {
      language: 'TypeScript',
      filename: 'nucigen-client.ts',
      code: `import { NucigenClient } from '@nucigen/sdk';

const client = new NucigenClient({
  apiKey: process.env.NUCIGEN_API_KEY,
});

async function analyzeAsset() {
  const signal = await client.signals.analyze({
    asset: 'TSLA',
    horizon: '5d',
    includeEvents: true,
  });

  console.log('Signal:', signal.direction);
  console.log('Confidence:', signal.confidence);
  console.log('Key Events:', signal.events);
}

analyzeAsset();`
    },
    {
      language: 'Python',
      filename: 'analyze.py',
      code: `from nucigen import Client

client = Client(api_key=os.getenv('NUCIGEN_API_KEY'))

signal = client.signals.analyze(
    asset='TSLA',
    horizon='5d',
    include_events=True
)

print(f"Direction: {signal.direction}")
print(f"Confidence: {signal.confidence}%")
print(f"Events: {len(signal.events)} detected")`
    },
    {
      language: 'JavaScript',
      filename: 'index.js',
      code: `const { NucigenClient } = require('@nucigen/sdk');

const client = new NucigenClient({
  apiKey: process.env.NUCIGEN_API_KEY,
});

async function getSignal() {
  const { data } = await client.signals.analyze({
    asset: 'TSLA',
    horizon: '5d',
  });

  return {
    direction: data.direction,
    confidence: data.confidence,
    events: data.events,
  };
}

getSignal().then(console.log);`
    }
  ];

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopied(index.toString());
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section className="relative px-6 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs text-slate-500 font-light tracking-[0.3em] mb-6">
            DEVELOPER EXPERIENCE
          </p>
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Simple integration. Real code.
          </h2>
          <p className="text-base text-slate-400 font-light max-w-2xl mx-auto">
            Get started in minutes with our SDK. No complex setup required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {codeExamples.map((example, index) => (
            <div
              key={index}
              className="relative bg-black border border-white/[0.08] rounded-lg overflow-hidden shadow-2xl"
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <Code2 size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-400 font-mono">{example.filename}</span>
            </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60"></div>
            </div>
          </div>

              {/* Code Content */}
              <div className="relative p-6">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleCopy(example.code, index)}
                    className="p-2 hover:bg-white/[0.05] rounded transition-colors group"
                    aria-label="Copy code"
                  >
                    {copied === index.toString() ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="text-slate-400 group-hover:text-white transition-colors" />
                    )}
                  </button>
                  </div>

                <div className="mb-3">
                  <span className="text-xs text-slate-500 font-mono px-2 py-1 bg-slate-900/50 rounded border border-white/[0.05]">
                    {example.language}
                  </span>
                  </div>

                <pre className="font-mono text-xs leading-relaxed overflow-x-auto">
                  <code className="text-slate-300">
                    {example.code.split('\n').map((line, lineIdx) => {
                      // Syntax highlighting
                      if (line.trim().startsWith('import') || line.trim().startsWith('from') || line.trim().startsWith('const') || line.trim().startsWith('async')) {
                return (
                          <div key={lineIdx} className="mb-1">
                            <span className="text-blue-400">{line.match(/^(import|from|const|async|function|await|return)/)?.[0]}</span>
                            <span className="text-slate-300">{line.replace(/^(import|from|const|async|function|await|return)/, '')}</span>
                  </div>
                );
              }
                      if (line.includes('console.log') || line.includes('print')) {
                return (
                          <div key={lineIdx} className="mb-1">
                            <span className="text-slate-300">{line.substring(0, line.indexOf('console.log') || line.indexOf('print'))}</span>
                            <span className="text-yellow-400">{line.match(/(console\.log|print)/)?.[0]}</span>
                            <span className="text-slate-300">{line.substring((line.indexOf('console.log') || line.indexOf('print')) + (line.includes('console.log') ? 11 : 5))}</span>
                  </div>
                );
              }
                      if (line.includes("'") || line.includes('"')) {
                return (
                          <div key={lineIdx} className="mb-1">
                            <span className="text-slate-300">{line.substring(0, line.indexOf("'") || line.indexOf('"'))}</span>
                            <span className="text-green-400">{line.match(/['"](.*?)['"]/)?.[0]}</span>
                            <span className="text-slate-300">{line.substring((line.indexOf("'") || line.indexOf('"')) + (line.match(/['"](.*?)['"]/)?.[0]?.length || 0))}</span>
                  </div>
                );
              }
                return (
                        <div key={lineIdx} className="mb-1 text-slate-300">
                          {line || '\u00A0'}
                </div>
              );
            })}
                  </code>
                </pre>
          </div>
        </div>
          ))}
        </div>
      </div>
    </section>
  );
}
