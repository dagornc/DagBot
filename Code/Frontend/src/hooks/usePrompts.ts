/** DagBot — Prompts hook for the Promptothèque. */

import { useState, useCallback, useEffect } from 'react';
import type { SavedPrompt, PromptCreate } from '../types';
import * as api from '../lib/api';

interface UsePromptsReturn {
    prompts: SavedPrompt[];
    isLoading: boolean;
    loadPrompts: () => Promise<void>;
    addPrompt: (data: PromptCreate) => Promise<void>;
    editPrompt: (id: string, data: Partial<PromptCreate>) => Promise<void>;
    removePrompt: (id: string) => Promise<void>;
    toggleFavorite: (id: string, current: boolean) => Promise<void>;
}

export function usePrompts(): UsePromptsReturn {
    const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadPrompts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.listPrompts();
            setPrompts(data);
        } catch (err) {
            console.error('Failed to load prompts:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addPrompt = useCallback(async (data: PromptCreate) => {
        await api.createPrompt(data);
        await loadPrompts();
    }, [loadPrompts]);

    const editPrompt = useCallback(async (id: string, data: Partial<PromptCreate>) => {
        await api.updatePrompt(id, data);
        await loadPrompts();
    }, [loadPrompts]);

    const removePrompt = useCallback(async (id: string) => {
        await api.deletePrompt(id);
        await loadPrompts();
    }, [loadPrompts]);

    const toggleFavorite = useCallback(async (id: string, current: boolean) => {
        await api.updatePrompt(id, { is_favorite: !current });
        await loadPrompts();
    }, [loadPrompts]);

    useEffect(() => {
        loadPrompts();
    }, [loadPrompts]);

    return { prompts, isLoading, loadPrompts, addPrompt, editPrompt, removePrompt, toggleFavorite };
}
