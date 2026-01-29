/**
 * Summary report card for Corporate Impact filtered by industries.
 * Shown when one or more industries are selected.
 */

import { FileText, TrendingUp, TrendingDown, Building2 } from 'lucide-react';

interface CorporateImpactReportCardProps {
  industries: string[];
  totalSignals: number;
  opportunities: number;
  risks: number;
  topCompanies?: string[];
}

export default function CorporateImpactReportCard({
  industries,
  totalSignals,
  opportunities,
  risks,
  topCompanies = [],
}: CorporateImpactReportCardProps) {
  if (industries.length === 0) return null;

  return (
    <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] rounded-xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-[#E1463E]" />
        <h3 className="font-semibold text-white text-sm">Rapport Corporate Impact</h3>
      </div>
      <p className="text-slate-400 text-xs font-light mb-4">
        Filtre : <span className="text-slate-300 font-medium">{industries.join(', ')}</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Signaux</p>
          <p className="text-lg font-semibold text-white">{totalSignals}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Opportunités</p>
          </div>
          <p className="text-lg font-semibold text-green-400">{opportunities}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#E1463E]/10 border border-[#E1463E]/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-[#E1463E]" />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Risques</p>
          </div>
          <p className="text-lg font-semibold text-[#E1463E]">{risks}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500 uppercase tracking-wide">Industries</p>
          </div>
          <p className="text-lg font-semibold text-white">{industries.length}</p>
        </div>
      </div>
      {topCompanies.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Entreprises concernées (aperçu)</p>
          <p className="text-sm text-slate-400 font-light">{topCompanies.slice(0, 8).join(', ')}{topCompanies.length > 8 ? '…' : ''}</p>
        </div>
      )}
    </div>
  );
}
