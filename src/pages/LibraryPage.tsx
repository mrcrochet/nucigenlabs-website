/**
 * Library Page (Ma bibliothèque)
 *
 * Displays Discover items saved by the user. Unsave removes from library.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import AppShell from '../components/layout/AppShell';
import SEO from '../components/SEO';
import ProtectedRoute from '../components/ProtectedRoute';
import DiscoverCard, { type DiscoverItem } from '../components/discover/DiscoverCard';
import DiscoverDetailModal from '../components/discover/DiscoverDetailModal';
import SkeletonCard from '../components/ui/SkeletonCard';
import { getOrCreateSupabaseUserId } from '../lib/supabase';
import { Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';

function LibraryContent() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [selectedItem, setSelectedItem] = useState<DiscoverItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getOrCreateSupabaseUserId(user.id).then(setUserId);
    }
  }, [user?.id]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['discover-saved', userId],
    queryFn: async () => {
      if (!userId) return { items: [] };
      const res = await fetch(`/api/discover/saved?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to load saved items');
      const json = await res.json();
      return { items: json.items || [] };
    },
    enabled: !!userId,
  });

  const unsaveMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!userId) throw new Error('User ID required');
      const res = await fetch(`/api/discover/${itemId}/save?userId=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove from library');
      return res.json();
    },
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: ['discover-saved'] });
      toast.success('Retiré de la bibliothèque');
      if (selectedItem?.id === itemId) {
        setIsModalOpen(false);
        setSelectedItem(null);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erreur');
    },
  });

  const handleUnsave = async (itemId: string) => {
    await unsaveMutation.mutateAsync(itemId);
  };

  const handleView = (itemId: string) => {
    const item = data?.items?.find((i: DiscoverItem) => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setIsModalOpen(true);
    }
  };

  const items: DiscoverItem[] = data?.items ?? [];

  if (isLoading || !userId) {
    return (
      <AppShell>
        <SEO title="Ma bibliothèque — Nucigen" description="Vos actualités sauvegardées" />
        <div className="col-span-1 sm:col-span-12">
          <h1 className="text-3xl font-light text-white mb-6">Ma bibliothèque</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} tier="strategic" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <SEO title="Ma bibliothèque — Nucigen" description="Vos actualités sauvegardées" />
        <div className="col-span-1 sm:col-span-12 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-sm text-red-400 mb-4">{error instanceof Error ? error.message : 'Erreur'}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 text-sm font-light"
          >
            Réessayer
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SEO title="Ma bibliothèque — Nucigen" description="Vos actualités sauvegardées" />
      <div className="col-span-1 sm:col-span-12">
        <h1 className="text-3xl font-light text-white mb-2">Ma bibliothèque</h1>
        <p className="text-slate-400 text-sm font-light mb-6">
          Vos actualités sauvegardées depuis Discover. Cliquez sur le signet pour retirer.
        </p>

        {items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-light text-white mb-2">Aucun article sauvegardé</h3>
            <p className="text-sm text-slate-400 font-light">
              Sauvegardez des articles depuis la page Discover pour les retrouver ici.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gap: '1.75rem' }}>
            {items.map((item) => (
              <DiscoverCard
                key={item.id}
                item={item}
                onSave={handleUnsave}
                onView={handleView}
                onShare={async () => {}}
                initialSaved={true}
              />
            ))}
          </div>
        )}
      </div>

      {selectedItem && (
        <DiscoverDetailModal
          item={selectedItem}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          onSave={handleUnsave}
          allItems={items}
          onItemClick={(item) => {
            setSelectedItem(item);
            handleView(item.id);
          }}
          userId={userId}
        />
      )}
    </AppShell>
  );
}

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryContent />
    </ProtectedRoute>
  );
}
