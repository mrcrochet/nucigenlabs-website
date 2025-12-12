export default function Footer() {
  return (
    <footer className="relative px-6 py-12 border-t border-white/[0.05]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm text-slate-600 font-light">
            Nucigen Labs © 2025
          </div>

          <div className="flex items-center gap-8">
            <a href="#terms" className="text-sm text-slate-600 hover:text-slate-400 transition-colors font-light">
              Terms
            </a>
            <a href="#privacy" className="text-sm text-slate-600 hover:text-slate-400 transition-colors font-light">
              Privacy
            </a>
            <a href="#contact" className="text-sm text-slate-600 hover:text-slate-400 transition-colors font-light">
              Contact
            </a>
            <a href="#support" className="text-sm text-slate-600 hover:text-slate-400 transition-colors font-light">
              Support
            </a>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-slate-700 font-light tracking-wide leading-relaxed">
            Not a trading app. Not a sentiment model. Not a news aggregator.<br />
            A causal intelligence platform.
          </p>
        </div>
      </div>
    </footer>
  );
}
