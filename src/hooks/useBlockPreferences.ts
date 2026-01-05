/**
 * useBlockPreferences Hook
 * 
 * Manages block preferences state with Supabase synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import { Block, PageType } from '../types/blocks';
import { getUserBlockPreferences, saveUserBlockPreferences, resetUserBlockPreferences } from '../lib/supabase';
import { getDefaultBlocks } from '../config/default-blocks';
import { useClerkAuth } from './useClerkAuth';

interface UseBlockPreferencesReturn {
  blocks: Block[];
  loading: boolean;
  error: string | null;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  toggleBlockVisibility: (blockId: string) => void;
  reorderBlocks: (blockIds: string[]) => void;
  savePreferences: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isDirty: boolean;
}

export function useBlockPreferences(pageType: PageType): UseBlockPreferencesReturn {
  const { user } = useClerkAuth();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [originalBlocks, setOriginalBlocks] = useState<Block[]>([]);

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      if (!user?.id) {
        // Use defaults if not authenticated
        const defaults = getDefaultBlocks(pageType);
        setBlocks(defaults);
        setOriginalBlocks(defaults);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Try to load user preferences
        const savedBlocks = await getUserBlockPreferences(user.id, pageType);

        if (savedBlocks && Array.isArray(savedBlocks) && savedBlocks.length > 0) {
          setBlocks(savedBlocks);
          setOriginalBlocks(savedBlocks);
        } else {
          // Use defaults if no preferences saved
          const defaults = getDefaultBlocks(pageType);
          setBlocks(defaults);
          setOriginalBlocks(defaults);
        }
      } catch (err: any) {
        console.error('Error loading block preferences:', err);
        setError(err.message || 'Failed to load block preferences');
        // Fallback to defaults on error
        const defaults = getDefaultBlocks(pageType);
        setBlocks(defaults);
        setOriginalBlocks(defaults);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user?.id, pageType]);

  // Update a specific block
  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setBlocks(prev => {
      const updated = prev.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      );
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Toggle block visibility
  const toggleBlockVisibility = useCallback((blockId: string) => {
    setBlocks(prev => {
      const updated = prev.map(block => 
        block.id === blockId ? { ...block, visible: !block.visible } : block
      );
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Reorder blocks
  const reorderBlocks = useCallback((blockIds: string[]) => {
    setBlocks(prev => {
      const blockMap = new Map(prev.map(b => [b.id, b]));
      const reordered = blockIds
        .map(id => blockMap.get(id))
        .filter((b): b is Block => b !== undefined);
      
      // Update order values
      const updated = reordered.map((block, index) => ({
        ...block,
        order: index + 1,
      }));
      
      setIsDirty(true);
      return updated;
    });
  }, []);

  // Save preferences to Supabase
  const savePreferences = useCallback(async () => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);
      await saveUserBlockPreferences(user.id, pageType, blocks);
      setOriginalBlocks(blocks);
      setIsDirty(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save block preferences');
      throw err;
    }
  }, [user?.id, pageType, blocks]);

  // Reset to defaults
  const resetToDefaults = useCallback(async () => {
    if (!user?.id) {
      // Just reset locally if not authenticated
      const defaults = getDefaultBlocks(pageType);
      setBlocks(defaults);
      setOriginalBlocks(defaults);
      setIsDirty(false);
      return;
    }

    try {
      setError(null);
      await resetUserBlockPreferences(user.id, pageType);
      const defaults = getDefaultBlocks(pageType);
      setBlocks(defaults);
      setOriginalBlocks(defaults);
      setIsDirty(false);
    } catch (err: any) {
      setError(err.message || 'Failed to reset block preferences');
      throw err;
    }
  }, [user?.id, pageType]);

  return {
    blocks,
    loading,
    error,
    updateBlock,
    toggleBlockVisibility,
    reorderBlocks,
    savePreferences,
    resetToDefaults,
    isDirty,
  };
}

