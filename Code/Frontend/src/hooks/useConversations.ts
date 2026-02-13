/** DagBot — Conversations hook for CRUD and state management. */

import { useState, useCallback, useEffect } from 'react';
import type { Conversation, ConversationDetail } from '../types';
import * as api from '../lib/api';

interface UseConversationsReturn {
    conversations: Conversation[];
    activeConversation: ConversationDetail | null;
    isLoading: boolean;
    loadConversations: () => Promise<void>;
    selectConversation: (id: string) => Promise<void>;
    createConversation: (title?: string, systemPrompt?: string) => Promise<Conversation>;
    renameConversation: (id: string, title: string) => Promise<void>;
    removeConversation: (id: string) => Promise<void>;
    setActiveConversation: React.Dispatch<React.SetStateAction<ConversationDetail | null>>;
}

export function useConversations(): UseConversationsReturn {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const loadConversations = useCallback(async () => {
        try {
            const data = await api.listConversations();
            setConversations(data);
        } catch (err) {
            console.error('Failed to load conversations:', err);
        }
    }, []);

    const selectConversation = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            const detail = await api.getConversation(id);
            setActiveConversation(detail);
        } catch (err) {
            console.error('Failed to load conversation:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createConversation = useCallback(async (title?: string, systemPrompt?: string) => {
        const conv = await api.createConversation(title, systemPrompt);
        await loadConversations();
        return conv;
    }, [loadConversations]);

    const renameConversation = useCallback(async (id: string, title: string) => {
        await api.updateConversation(id, { title });
        await loadConversations();
        if (activeConversation?.id === id) {
            setActiveConversation((prev) => prev ? { ...prev, title } : null);
        }
    }, [loadConversations, activeConversation]);

    const removeConversation = useCallback(async (id: string) => {
        await api.deleteConversation(id);
        if (activeConversation?.id === id) {
            setActiveConversation(null);
        }
        await loadConversations();
    }, [loadConversations, activeConversation]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    return {
        conversations,
        activeConversation,
        isLoading,
        loadConversations,
        selectConversation,
        createConversation,
        renameConversation,
        removeConversation,
        setActiveConversation,
    };
}
