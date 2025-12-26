import { 
  Code, 
  Webhook, 
  FileSpreadsheet, 
  MessageSquare, 
  Terminal,
  Zap,
  Database,
  Globe
} from 'lucide-react';

export default function Integrations() {
  const integrations = [
    {
      name: 'Python API',
      icon: Code,
      description: 'Native Python SDK',
      color: 'from-blue-500/20 to-cyan-500/20',
      borderColor: 'border-blue-500/30',
    },
    {
      name: 'REST API',
      icon: Globe,
      description: 'Standard REST endpoints',
      color: 'from-green-500/20 to-emerald-500/20',
      borderColor: 'border-green-500/30',
    },
    {
      name: 'Webhooks',
      icon: Webhook,
      description: 'Real-time event notifications',
      color: 'from-purple-500/20 to-pink-500/20',
      borderColor: 'border-purple-500/30',
    },
    {
      name: 'Excel Export',
      icon: FileSpreadsheet,
      description: 'Direct spreadsheet integration',
      color: 'from-orange-500/20 to-red-500/20',
      borderColor: 'border-orange-500/30',
    },
    {
      name: 'Slack/Teams',
      icon: MessageSquare,
      description: 'Team notifications',
      color: 'from-indigo-500/20 to-blue-500/20',
      borderColor: 'border-indigo-500/30',
    },
    {
      name: 'CLI Tool',
      icon: Terminal,
      description: 'Command-line interface',
      color: 'from-gray-500/20 to-slate-500/20',
      borderColor: 'border-gray-500/30',
    },
    {
      name: 'TradingView',
      icon: Zap,
      description: 'Chart integration',
      color: 'from-yellow-500/20 to-orange-500/20',
      borderColor: 'border-yellow-500/30',
    },
    {
      name: 'Database',
      icon: Database,
      description: 'Direct DB connections',
      color: 'from-teal-500/20 to-cyan-500/20',
      borderColor: 'border-teal-500/30',
    },
    {
      name: 'Bloomberg',
      icon: Globe,
      description: 'Terminal integration',
      color: 'from-red-500/20 to-pink-500/20',
      borderColor: 'border-red-500/30',
    },
  ];

  return (
    <section className="relative px-6 py-32">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs text-slate-500 font-light tracking-[0.3em] mb-6">
            INTEGRATIONS
          </p>
          <h2 className="text-4xl md:text-6xl font-light mb-8 leading-tight text-white">
            Nucigen works with any platform
          </h2>
          <p className="text-lg text-slate-400 font-light max-w-3xl mx-auto">
            Seamless integration with your existing workflow. From Python scripts to enterprise platforms.
          </p>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {integrations.map((integration, idx) => {
            const Icon = integration.icon;
            return (
              <div
                key={idx}
                className={`backdrop-blur-xl bg-gradient-to-br ${integration.color} border ${integration.borderColor} rounded-xl p-6 hover:border-opacity-60 hover:scale-105 transition-all duration-300 group cursor-pointer`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${integration.color} border ${integration.borderColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-lg font-light text-white mb-2">{integration.name}</h3>
                  <p className="text-xs text-slate-400 font-light">{integration.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-sm text-slate-500 font-light mb-4">
            Need a custom integration?
          </p>
          <button className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/20 hover:border-white/30 text-white font-light rounded-md transition-all duration-300 text-sm tracking-wide">
            Contact Sales
          </button>
        </div>
      </div>
    </section>
  );
}

