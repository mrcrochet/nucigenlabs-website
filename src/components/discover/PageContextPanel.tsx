/**
 * Panneau droit : affiche le contexte IA de la page (Actualité / Globe).
 * Bouton Fermer pour refermer et retrouver la carte en plein écran.
 */

import { Loader2, RefreshCw, Sparkles, X } from 'lucide-react';

export interface PageContextPanelProps {
  context: string | null;
  loading: boolean;
  onRegenerate: () => void;
  onClose: () => void;
}

export default function PageContextPanel({
  context,
  loading,
  onRegenerate,
  onClose,
}: PageContextPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* En-tête avec titre + fermer */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-[#2A2A2A]">
        <h2 className="text-base font-semibold text-white inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400/90" aria-hidden />
          Contexte de la page
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Fermer le panneau"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" aria-hidden />
            <p className="text-sm text-slate-400">Génération du contexte…</p>
          </div>
        )}
        {!loading && context && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {context}
            </p>
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-[#2A2A2A] text-slate-300 hover:bg-white/10 hover:text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              Régénérer le contexte
            </button>
          </div>
        )}
        {!loading && !context && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <p className="text-sm text-slate-400">
              Aucun contexte généré. Cliquez sur « Générer le contexte » sur la carte pour afficher un résumé stratégique ici.
            </p>
            <button
              type="button"
              onClick={onRegenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E1463E]/20 border border-[#E1463E]/40 text-[#E1463E] hover:bg-[#E1463E]/30 text-sm transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" aria-hidden />
              Générer le contexte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
