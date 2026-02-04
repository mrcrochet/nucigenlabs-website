/**
 * SearchHistoryMenu — Historique de recherche dans un menu hamburger
 * Bouton qui ouvre un tiroir latéral pour économiser l'espace.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { History, X } from 'lucide-react';
import SearchHistorySidebar from './SearchHistorySidebar';

interface SearchHistoryMenuProps {
  currentSessionId?: string | null;
  compact?: boolean;
  /** Position du bouton pour le style (inline = dans la barre, floating = fixe) */
  variant?: 'inline' | 'floating';
  className?: string;
}

export default function SearchHistoryMenu({
  currentSessionId = null,
  compact = false,
  variant = 'inline',
  className = '',
}: SearchHistoryMenuProps) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Fermer le tiroir à la navigation (ex. clic sur une recherche)
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Fermer au clic sur le backdrop ou Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Ouvrir les recherches récentes"
        className={
          variant === 'floating'
            ? `fixed left-4 top-20 z-30 flex items-center justify-center w-10 h-10 rounded-lg bg-background-glass-subtle border border-borders-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-medium transition-colors ${className}`
            : `flex items-center justify-center w-9 h-9 rounded-lg bg-background-glass-subtle border border-borders-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-medium transition-colors shrink-0 ${className}`
        }
      >
        <History className="w-4 h-4" aria-hidden />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      <div
        role="dialog"
        aria-label="Recherches récentes"
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-background-base border-r border-borders-subtle shadow-xl transform transition-transform duration-200 ease-out flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between shrink-0 p-3 border-b border-borders-subtle">
          <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <History className="w-4 h-4 text-text-secondary" />
            Recherches récentes
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-glass-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SearchHistorySidebar
            currentSessionId={currentSessionId}
            compact={compact}
            className="!mb-0"
          />
        </div>
      </div>
    </>
  );
}
