/**
 * Investigations List Page — Intelligence Detective
 * Lists active investigation threads and allows creating a new one.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { Search, Plus, Loader2, X, FileSearch } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import { getThreads, createThread } from '../lib/api/investigation-api';
import type { InvestigationThread } from '../types/investigation';
import type { InvestigationScope } from '../types/investigation';

const SCOPE_LABELS: Record<InvestigationScope, string> = {
  geopolitics: 'Géopolitique',
  commodities: 'Matières premières',
  security: 'Sécurité',
  finance: 'Finance',
};

function InvestigationsPageContent() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [threads, setThreads] = useState<InvestigationThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    initial_hypothesis: '',
    title: '',
    scope: 'geopolitics' as InvestigationScope,
  });

  const apiOpts = { clerkUserId: user?.id ?? undefined };

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getThreads(apiOpts)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.threads) setThreads(res.threads);
        else if (res.error) toast.error(res.error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const hypothesis = form.initial_hypothesis.trim();
    if (!hypothesis) {
      toast.error('Indiquez une hypothèse de départ');
      return;
    }
    setCreating(true);
    try {
      const res = await createThread(
        {
          initial_hypothesis: hypothesis,
          title: form.title.trim() || undefined,
          scope: form.scope,
        },
        apiOpts
      );
      if (res.success && res.thread) {
        toast.success('Enquête créée');
        setModalOpen(false);
        setForm({ initial_hypothesis: '', title: '', scope: 'geopolitics' });
        navigate(`/investigations/${res.thread.id}`);
      } else {
        toast.error(res.error || 'Erreur à la création');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <SEO title="Enquêtes | Intelligence Detective | Nucigen Labs" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary flex items-center gap-2">
              <FileSearch className="w-7 h-7 text-[#E1463E]" />
              Intelligence Detective
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Pistes d'enquête : hypothèses, preuves et synthèse.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle enquête
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-text-secondary">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-xl border border-borders-subtle bg-borders-subtle/20 p-12 text-center">
            <Search className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-primary font-medium mb-1">Aucune enquête</p>
            <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">
              Créez une piste en posant une hypothèse. Le detective collectera des preuves et mettra à jour la synthèse.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvelle enquête
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id}>
                <Link
                  to={`/investigations/${t.id}`}
                  className="block rounded-xl border border-borders-subtle bg-background-base p-4 hover:border-[#E1463E]/40 hover:bg-borders-subtle/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-text-primary font-medium truncate">{t.title}</h2>
                      <p className="text-text-secondary text-sm mt-0.5 line-clamp-2">{t.initial_hypothesis}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-text-muted">{SCOPE_LABELS[t.scope]}</span>
                        <span className="text-xs text-text-muted">•</span>
                        <span className="text-xs text-text-muted capitalize">{t.status}</span>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted shrink-0">
                      {new Date(t.updated_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal Nouvelle enquête */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background-overlay" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-borders-subtle bg-background-base shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Nouvelle enquête</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-text-secondary hover:bg-borders-subtle hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Hypothèse de départ *</label>
                <textarea
                  value={form.initial_hypothesis}
                  onChange={(e) => setForm((f) => ({ ...f, initial_hypothesis: e.target.value }))}
                  placeholder="Ex. : Les livraisons de blé russe vers l'Afrique passent par des sociétés écrans."
                  className="w-full px-3 py-2 rounded-lg border border-borders-subtle bg-background-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Titre (optionnel)</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Court résumé de la piste"
                  className="w-full px-3 py-2 rounded-lg border border-borders-subtle bg-background-base text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Périmètre</label>
                <select
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as InvestigationScope }))}
                  className="w-full px-3 py-2 rounded-lg border border-borders-subtle bg-background-base text-text-primary focus:outline-none focus:ring-2 focus:ring-[#E1463E]/50"
                >
                  {(Object.keys(SCOPE_LABELS) as InvestigationScope[]).map((s) => (
                    <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-borders-subtle text-text-secondary hover:bg-borders-subtle"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating || !form.initial_hypothesis.trim()}
                  className="px-4 py-2 rounded-lg bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer l'enquête
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function InvestigationsPage() {
  return (
    <ProtectedRoute>
      <InvestigationsPageContent />
    </ProtectedRoute>
  );
}
