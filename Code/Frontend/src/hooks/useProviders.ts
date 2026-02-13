/** DagBot — Providers hook for state management. */

import { useState, useCallback, useEffect } from 'react';
import type { Provider, ProviderCreate, ProviderTestResult } from '../types';
import * as api from '../lib/api';

interface UseProvidersReturn {
    providers: Provider[];
    isLoading: boolean;
    loadProviders: () => Promise<void>;
    addProvider: (data: ProviderCreate) => Promise<void>;
    removeProvider: (name: string) => Promise<void>;
    testConnection: (name: string) => Promise<ProviderTestResult>;
}

export function useProviders(): UseProvidersReturn {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadProviders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.listProviders();
            setProviders(data);
        } catch (err) {
            console.error('Failed to load providers:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addProvider = useCallback(async (data: ProviderCreate) => {
        await api.addProvider(data);
        await loadProviders();
    }, [loadProviders]);

    const removeProvider = useCallback(async (name: string) => {
        await api.deleteProvider(name);
        await loadProviders();
    }, [loadProviders]);

    const testConnection = useCallback(async (name: string) => {
        return api.testProvider(name);
    }, []);

    useEffect(() => {
        loadProviders();
    }, [loadProviders]);

    return { providers, isLoading, loadProviders, addProvider, removeProvider, testConnection };
}
