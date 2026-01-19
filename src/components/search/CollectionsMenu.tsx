/**
 * Collections Menu
 * 
 * Save search results to collections/bookmarks
 * Create and manage collections
 */

import { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCheck, FolderPlus, Folder, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@clerk/clerk-react';
import type { SearchResult } from '../../types/search';

interface Collection {
  id: string;
  name: string;
  description?: string;
  resultCount: number;
  createdAt: string;
}

interface CollectionsMenuProps {
  result: SearchResult;
  onSaved?: () => void;
}

export default function CollectionsMenu({ result, onSaved }: CollectionsMenuProps) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [savedInCollections, setSavedInCollections] = useState<string[]>([]);

  // Load user collections
  const loadCollections = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // For now, use localStorage. In production, this would be an API call
      const stored = localStorage.getItem(`collections-${user.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCollections(parsed.collections || []);
        setSavedInCollections(parsed.savedItems?.[result.id] || []);
      } else {
        // Initialize with default collections
        const defaultCollections: Collection[] = [
          {
            id: 'default-1',
            name: 'Favorites',
            description: 'My favorite results',
            resultCount: 0,
            createdAt: new Date().toISOString(),
          },
        ];
        setCollections(defaultCollections);
        localStorage.setItem(`collections-${user.id}`, JSON.stringify({
          collections: defaultCollections,
          savedItems: {},
        }));
      }
    } catch (error: any) {
      console.error('[CollectionsMenu] Error loading collections:', error);
      toast.error('Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, result.id]);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen, loadCollections]);

  // Create new collection
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !user?.id) return;

    setIsCreating(true);
    try {
      const newCollection: Collection = {
        id: `collection-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: newCollectionName.trim(),
        description: '',
        resultCount: 0,
        createdAt: new Date().toISOString(),
      };

      const stored = localStorage.getItem(`collections-${user.id}`);
      const data = stored ? JSON.parse(stored) : { collections: [], savedItems: {} };
      
      data.collections.push(newCollection);
      localStorage.setItem(`collections-${user.id}`, JSON.stringify(data));

      setCollections([...collections, newCollection]);
      setNewCollectionName('');
      toast.success('Collection created');
    } catch (error: any) {
      console.error('[CollectionsMenu] Error creating collection:', error);
      toast.error('Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle save in collection
  const handleToggleCollection = async (collectionId: string) => {
    if (!user?.id) {
      toast.error('Please sign in to save results');
      return;
    }

    try {
      const stored = localStorage.getItem(`collections-${user.id}`);
      const data = stored ? JSON.parse(stored) : { collections: [], savedItems: {} };

      if (!data.savedItems[result.id]) {
        data.savedItems[result.id] = [];
      }

      const isSaved = data.savedItems[result.id].includes(collectionId);

      if (isSaved) {
        // Remove from collection
        data.savedItems[result.id] = data.savedItems[result.id].filter(
          (id: string) => id !== collectionId
        );
        setSavedInCollections(savedInCollections.filter(id => id !== collectionId));
        
        // Update collection count
        const collection = data.collections.find((c: Collection) => c.id === collectionId);
        if (collection) {
          collection.resultCount = Math.max(0, collection.resultCount - 1);
        }
      } else {
        // Add to collection
        data.savedItems[result.id].push(collectionId);
        setSavedInCollections([...savedInCollections, collectionId]);
        
        // Update collection count
        const collection = data.collections.find((c: Collection) => c.id === collectionId);
        if (collection) {
          collection.resultCount = (collection.resultCount || 0) + 1;
        }
      }

      localStorage.setItem(`collections-${user.id}`, JSON.stringify(data));
      setCollections(data.collections);

      if (onSaved) {
        onSaved();
      }

      toast.success(
        isSaved ? 'Removed from collection' : 'Saved to collection'
      );
    } catch (error: any) {
      console.error('[CollectionsMenu] Error toggling collection:', error);
      toast.error('Failed to update collection');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-background-glass-subtle text-text-secondary hover:text-text-primary hover:bg-background-glass-medium transition-colors"
        title="Save to collection"
        aria-label="Save to collection"
      >
        {savedInCollections.length > 0 ? (
          <BookmarkCheck className="w-4 h-4 text-primary" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-background-elevated border border-borders-subtle rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-borders-subtle">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-text-primary">Save to Collection</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-background-glass-subtle rounded transition-colors"
                >
                  <X className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
              
              {/* Create new collection */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isCreating) {
                      handleCreateCollection();
                    }
                  }}
                  placeholder="New collection name..."
                  className="flex-1 px-2 py-1.5 text-xs bg-background-glass-subtle border border-borders-subtle rounded text-text-primary placeholder-text-tertiary focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={handleCreateCollection}
                  disabled={!newCollectionName.trim() || isCreating}
                  className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded text-xs text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <FolderPlus className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            {/* Collections list */}
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : collections.length === 0 ? (
                <div className="p-4 text-center text-sm text-text-tertiary">
                  No collections yet. Create one above.
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {collections.map((collection) => {
                    const isSaved = savedInCollections.includes(collection.id);
                    return (
                      <button
                        key={collection.id}
                        onClick={() => handleToggleCollection(collection.id)}
                        className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-background-glass-subtle rounded transition-colors flex items-center gap-2"
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-primary flex-shrink-0" />
                        ) : (
                          <Folder className="w-4 h-4 text-text-secondary flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{collection.name}</div>
                          {collection.description && (
                            <div className="text-xs text-text-tertiary truncate">
                              {collection.description}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-text-tertiary">
                          {collection.resultCount || 0}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
