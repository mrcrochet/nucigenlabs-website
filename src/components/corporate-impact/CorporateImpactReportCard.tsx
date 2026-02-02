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
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-[#E1463E]" aria-hidden />
        <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium">Rapport Corporate Impact</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Filtre : <span className="text-gray-300 font-medium">{industries.join(', ')}</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Signaux</p>
          <p className="text-lg font-semibold text-gray-200 font-mono">{totalSignals}</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" aria-hidden />
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Opportunités</p>
          </div>
          <p className="text-lg font-semibold text-green-400 font-mono">{opportunities}</p>
        </div>
        <div className="p-3 rounded-lg bg-[#E1463E]/10 border border-[#E1463E]/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-[#E1463E]" aria-hidden />
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Risques</p>
          </div>
          <p className="text-lg font-semibold text-[#E1463E] font-mono">{risks}</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-800 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-gray-500" aria-hidden />
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Industries</p>
          </div>
          <p className="text-lg font-semibold text-gray-200 font-mono">{industries.length}</p>
        </div>
      </div>
      {topCompanies.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Entreprises concernées (aperçu)</p>
          <p className="text-sm text-gray-400">{topCompanies.slice(0, 8).join(', ')}{topCompanies.length > 8 ? '…' : ''}</p>
        </div>
      )}
    </div>
  );
}
