/** DagBot — Settings panel with provider configuration. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2, Loader2, Server, Database, Key, RefreshCw, Search } from 'lucide-react';
import type { Provider, ProviderCreate, ChatSettings, ProviderTestResult } from '../types';
import { SelectionCard, SelectionGroup } from './design-system/GuidedSelection';

interface SettingsPanelProps {
    providers: Provider[];
    settings: ChatSettings;
    onSettingsChange: (s: Partial<ChatSettings>) => void;
    onAddProvider: (d: ProviderCreate) => Promise<void>;
    onDeleteProvider: (n: string) => Promise<void>;
    onTestProvider: (n: string) => Promise<ProviderTestResult>;
    onClose: () => void;
}

function Slider({ label, value, min, max, step, onChange }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex justify-between mb-1"><span className="text-xs text-[var(--color-text-secondary)]">{label}</span><span className="text-xs font-mono text-[var(--color-accent)]">{value.toFixed(2)}</span></div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-black/20 dark:bg-white/20 accent-[var(--color-accent)] cursor-pointer" />
        </div>
    );
}

export function SettingsPanel({ providers, settings, onSettingsChange, onAddProvider, onDeleteProvider, onTestProvider, onClose }: SettingsPanelProps) {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, ProviderTestResult>>({});
    const [testing, setTesting] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [np, setNp] = useState<ProviderCreate>({ name: '', display_name: '', base_url: '', api_key: '', default_model: '' });
    const [mi, setMi] = useState('');
    const [modelSearch, setModelSearch] = useState('');
    const [fetchingModels, setFetchingModels] = useState<string | null>(null);
    const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});

    const handleRefreshModels = async (providerName: string) => {
        setFetchingModels(providerName);
        try {
            const response = await fetch(`/api/providers/${providerName}/models`);
            if (response.ok) {
                const models = await response.json();
                setDynamicModels(prev => ({ ...prev, [providerName]: models }));
            }
        } catch (error) {
            console.error("Failed to fetch models:", error);
        } finally {
            setFetchingModels(null);
        }
    };

    const test = async (n: string) => { setTesting(n); try { const r = await onTestProvider(n); setResults(p => ({ ...p, [n]: r })); } catch { setResults(p => ({ ...p, [n]: { success: false, message: 'Failed' } })); } finally { setTesting(null); } };
    const add = async () => { if (!np.name || !np.display_name || !np.base_url) return; await onAddProvider(np); setNp({ name: '', display_name: '', base_url: '', api_key: '', default_model: '' }); setShowAdd(false); };

    // Persistence helpers
    const getOption = (providerName: string, key: 'free_only' | 'auto_choose') => {
        return settings.provider_options?.[providerName]?.[key] ?? false;
    };

    const updateOption = (providerName: string, key: 'free_only' | 'auto_choose', val: boolean) => {
        const options = { ...(settings.provider_options || {}) };
        options[providerName] = { ...(options[providerName] || {}), [key]: val };
        onSettingsChange({ provider_options: options });
    };

    return (
        <div className="flex flex-col h-full animate-fade-in bg-[var(--color-surface)]">
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[var(--color-surface)]/80 backdrop-blur-xl z-20">
                <div><h2 className="text-xl font-semibold">{t('settings.title')}</h2><p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{t('settings.subtitle')}</p></div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">

                {/* Providers Selection */}
                <div className="px-6 py-6 border-b border-white/5">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
                        <Server size={14} /> {t('settings.providersTitle')}
                    </h3>

                    <SelectionGroup columns={1}>
                        {providers.map(p => {
                            const isSelected = settings.provider === p.name;
                            const isExpanded = expanded === p.name;
                            const testResult = results[p.name];
                            const isAutoChoose = getOption(p.name, 'auto_choose');
                            const isFreeOnly = getOption(p.name, 'free_only');

                            return (
                                <SelectionCard
                                    key={p.name}
                                    title={p.display_name}
                                    description={p.base_url}
                                    selected={isSelected}
                                    onClick={() => {
                                        if (!isSelected) {
                                            const model = getOption(p.name, 'auto_choose') ? 'openrouter/auto' : p.default_model;
                                            onSettingsChange({ provider: p.name, model });
                                        }
                                        setExpanded(isExpanded ? null : p.name);
                                    }}
                                    recommended={!p.is_custom && p.name === 'openrouter'}
                                    badges={p.is_custom ? ['Custom'] : ['Managed']}
                                    status={testResult?.success ? 'success' : testResult?.success === false ? 'error' : undefined}
                                    statusMessage={testResult?.message}
                                >
                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="space-y-4 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-xs text-[var(--color-text-tertiary)] mb-1 flex items-center gap-1"><Server size={10} /> {t('settings.baseUrl')}</label>
                                                    <input
                                                        value={p.base_url}
                                                        onChange={() => { }}
                                                        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--color-text-secondary)] focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-[var(--color-text-tertiary)] mb-1 flex items-center gap-1"><Key size={10} /> {t('settings.apiKey')}</label>
                                                    <input value={p.api_key} readOnly type="password" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--color-text-secondary)] focus:outline-none" />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1"><Database size={10} /> {t('settings.model')}</label>
                                                        <button
                                                            onClick={() => handleRefreshModels(p.name)}
                                                            disabled={fetchingModels === p.name}
                                                            className={`p-1 rounded-md hover:bg-white/10 transition-colors ${fetchingModels === p.name ? 'animate-spin opacity-50' : 'opacity-60 hover:opacity-100'}`}
                                                            title="Refresh models"
                                                        >
                                                            <RefreshCw size={12} />
                                                        </button>
                                                    </div>

                                                    {/* Provider Options */}
                                                    <div className="flex gap-4">
                                                        {(p.models?.length > 0 || dynamicModels[p.name]?.length > 0) && (
                                                            <label className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isFreeOnly}
                                                                    onChange={(e) => updateOption(p.name, 'free_only', e.target.checked)}
                                                                    className="rounded border-white/10 bg-white/5 text-[var(--color-accent)] focus:ring-0"
                                                                />
                                                                {t('settings.freeOnly')}
                                                            </label>
                                                        )}
                                                        {p.name === 'openrouter' && (
                                                            <label className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isAutoChoose}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        updateOption(p.name, 'auto_choose', checked);
                                                                        if (isSelected) {
                                                                            onSettingsChange({ model: checked ? 'openrouter/auto' : p.default_model });
                                                                        }
                                                                    }}
                                                                    className="rounded border-white/10 bg-white/5 text-[var(--color-accent)] focus:ring-0"
                                                                />
                                                                {t('settings.autoChoose')}
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Model Selection Area */}
                                                <div className={`rounded-xl border border-white/10 bg-black/20 overflow-hidden transition-all duration-300 ${isAutoChoose && isSelected ? 'opacity-40 pointer-events-none' : ''}`}>
                                                    {/* Search Bar */}
                                                    <div className="px-2 pt-2 pb-1 border-b border-white/5">
                                                        <div className="relative">
                                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search models..."
                                                                value={modelSearch}
                                                                onChange={(e) => setModelSearch(e.target.value)}
                                                                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                                                        {(() => {
                                                            const baseModels = p.models || [];
                                                            const currentDynamicModels = dynamicModels[p.name] || [];
                                                            // Avoid duplicates if a model is in both lists
                                                            const combinedModels = Array.from(new Set([...baseModels, ...currentDynamicModels]));

                                                            if (combinedModels.length === 0) {
                                                                return (
                                                                    <div className="p-1">
                                                                        <input
                                                                            value={isSelected ? settings.model : p.default_model}
                                                                            onChange={(e) => isSelected && onSettingsChange({ model: e.target.value })}
                                                                            placeholder="Enter model name..."
                                                                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)]/50 transition-colors"
                                                                        />
                                                                    </div>
                                                                );
                                                            }

                                                            let filtered = combinedModels;
                                                            if (isFreeOnly) {
                                                                filtered = filtered.filter(m =>
                                                                    m.toLowerCase().includes('free') ||
                                                                    m.toLowerCase().endsWith(':free')
                                                                );
                                                            }
                                                            if (modelSearch) {
                                                                const q = modelSearch.toLowerCase();
                                                                filtered = filtered.filter(m => m.toLowerCase().includes(q));
                                                            }

                                                            return filtered.map(m => {
                                                                const isModelSelected = (isSelected ? settings.model : p.default_model) === m;
                                                                return (
                                                                    <button
                                                                        key={m}
                                                                        onClick={() => isSelected && onSettingsChange({ model: m })}
                                                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200 mb-0.5 last:mb-0 flex items-center justify-between group ${isModelSelected
                                                                            ? 'bg-[var(--color-accent)] text-white shadow-lg shadow-[var(--color-accent)]/20'
                                                                            : 'text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-[var(--color-text-primary)]'
                                                                            }`}
                                                                    >
                                                                        <span className="truncate">{m}</span>
                                                                        {isModelSelected && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                                                    </button>
                                                                );
                                                            });
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                {!isSelected && (
                                                    <button onClick={() => onSettingsChange({ provider: p.name, model: p.default_model })} className="px-3 py-1.5 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium hover:bg-[var(--color-accent)]/20 transition-colors">
                                                        {t('settings.useProvider')}
                                                    </button>
                                                )}
                                                <button onClick={() => test(p.name)} disabled={testing === p.name} className="px-3 py-1.5 rounded-xl bg-white/5 text-xs font-medium hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                                                    {testing === p.name ? <Loader2 size={12} className="animate-spin" /> : null}
                                                    {t('settings.test')}
                                                </button>
                                                {p.is_custom && (
                                                    <button onClick={() => onDeleteProvider(p.name)} className="ml-auto p-1.5 rounded-xl hover:bg-red-500/20 text-red-400 opacity-60 hover:opacity-100 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                    }
                                </SelectionCard>
                            );
                        })}

                        {/* Add Provider Button/Form */}
                        {showAdd ? (
                            <div className="glass rounded-2xl p-4 space-y-3 animate-slide-in-up border border-white/10">
                                <h4 className="text-sm font-medium">{t('settings.addProvider')}</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{t('settings.providerNameKey')}</label><input value={np.name} onChange={e => setNp(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s/g, '_') }))} placeholder="my_provider" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50" /></div>
                                    <div><label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{t('settings.displayName')}</label><input value={np.display_name} onChange={e => setNp(p => ({ ...p, display_name: e.target.value }))} placeholder="My Provider" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50" /></div>
                                </div>
                                <div><label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{t('settings.baseUrl')}</label><input value={np.base_url} onChange={e => setNp(p => ({ ...p, base_url: e.target.value }))} placeholder="https://api.example.com/v1" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50" /></div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div><label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{t('settings.apiKey')}</label><input value={np.api_key} onChange={e => setNp(p => ({ ...p, api_key: e.target.value }))} type="password" placeholder="sk-..." className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50" /></div>
                                    <div><label className="text-xs text-[var(--color-text-tertiary)] mb-1 block">{t('settings.defaultModel')}</label><input value={np.default_model} onChange={e => setNp(p => ({ ...p, default_model: e.target.value }))} placeholder="model-name" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50" /></div>
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={add} className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-sm font-medium transition-colors text-white shadow-lg shadow-[var(--color-accent)]/20">{t('settings.addProviderBtn')}</button>
                                    <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors text-[var(--color-text-secondary)]">{t('settings.cancel')}</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setShowAdd(true)} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-dashed border-white/10 hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-accent)]/5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-all group">
                                <span className="p-1 rounded-lg bg-white/5 group-hover:bg-[var(--color-accent)]/20 group-hover:text-[var(--color-accent)] transition-colors"><Plus size={16} /></span>
                                {t('settings.addProviderBtn')}
                            </button>
                        )}
                    </SelectionGroup>
                </div>

                {/* Model Parameters - below providers now? Or keep above? User might want to config provider first. Kept order similar but maybe improved hierarchy? 
                   Let's keep existing order of sections, oh wait, original had Params first. I put Providers first in the code above (line 49 starts providers). 
                   Let's check if I should swap them back. Usually you select a provider THEN config params. So Providers first makes more sense logically. 
                   But I'll check user preference. Actually, let's keep it consistent with the "Selection" flow: Pick provider -> Config it. 
                   So Providers first is good.
                   Wait, I see I put Model Params *after* Providers in the code above? No, I haven't added Model Params yet in the ReplacementContent. 
                   I need to add the Model Params section below the Providers section.
                */}

                {/* Parameters */}
                <div className="px-6 py-6 pb-20">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4 flex items-center gap-2">
                        <Database size={14} /> {t('settings.modelParams')}
                    </h3>
                    <div className="space-y-6">
                        <div><label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">{t('settings.modelName')}</label>
                            <input value={mi || settings.model} onChange={e => setMi(e.target.value)} onBlur={() => { if (mi.trim()) onSettingsChange({ model: mi.trim() }); }} onKeyDown={e => { if (e.key === 'Enter' && mi.trim()) onSettingsChange({ model: mi.trim() }); }} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50 placeholder-white/20" placeholder="e.g. gpt-4" />
                        </div>
                        <Slider label={t('settings.temperature')} value={settings.temperature} min={0} max={2} step={0.05} onChange={v => onSettingsChange({ temperature: v })} />
                        <Slider label={t('settings.topP')} value={settings.top_p} min={0} max={1} step={0.05} onChange={v => onSettingsChange({ top_p: v })} />
                        <div><label className="text-xs text-[var(--color-text-secondary)] mb-1.5 block">{t('settings.maxTokens')}</label>
                            <input type="number" value={settings.max_tokens} onChange={e => onSettingsChange({ max_tokens: parseInt(e.target.value) || 4096 })} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50" />
                        </div>
                        <Slider label={t('settings.presencePenalty')} value={settings.presence_penalty} min={-2} max={2} step={0.1} onChange={v => onSettingsChange({ presence_penalty: v })} />
                        <Slider label={t('settings.frequencyPenalty')} value={settings.frequency_penalty} min={-2} max={2} step={0.1} onChange={v => onSettingsChange({ frequency_penalty: v })} />
                    </div>
                </div>
            </div>
        </div >
    );
}
