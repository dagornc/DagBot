/** DagBot — Prompt Library (Promptothèque) component. */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Star, Pencil, Trash2, X, BookMarked } from 'lucide-react';
import type { SavedPrompt, PromptCreate } from '../types';
import emptyPromptsImage from '../assets/empty-prompts.png';

interface PromptLibraryProps {
    prompts: SavedPrompt[];
    onAdd: (data: PromptCreate) => Promise<void>;
    onEdit: (id: string, data: Partial<PromptCreate>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onToggleFavorite: (id: string, current: boolean) => Promise<void>;
    onUsePrompt: (content: string) => void;
    onClose: () => void;
}

const CATEGORIES = ['General', 'Technical', 'Creative', 'Analysis', 'Business', 'Education'];
const CAT_COLORS: Record<string, string> = {
    Technical: 'bg-blue-500/20 text-blue-400', Creative: 'bg-purple-500/20 text-purple-400',
    Analysis: 'bg-green-500/20 text-green-400', Business: 'bg-amber-500/20 text-amber-400',
    Education: 'bg-teal-500/20 text-teal-400', General: 'bg-gray-500/20 text-gray-400',
};

export function PromptLibrary({ prompts, onAdd, onEdit, onDelete, onToggleFavorite, onUsePrompt, onClose }: PromptLibraryProps) {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<SavedPrompt | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<PromptCreate>({ title: '', content: '', category: 'General', tags: [] });

    const filtered = prompts.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.content.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async () => {
        if (!form.title.trim() || !form.content.trim()) return;
        if (editing) {
            await onEdit(editing.id, form);
            setEditing(null);
        } else {
            await onAdd(form);
            setCreating(false);
        }
        setForm({ title: '', content: '', category: 'General', tags: [] });
    };

    const startEdit = (p: SavedPrompt) => {
        setEditing(p);
        setForm({ title: p.title, content: p.content, category: p.category, tags: p.tags });
        setCreating(true);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookMarked size={20} className="text-[var(--color-accent)]" />
                    <div><h2 className="text-xl font-semibold">{t('prompts.title')}</h2><p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{t('prompts.subtitle')}</p></div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { setCreating(true); setEditing(null); setForm({ title: '', content: '', category: 'General', tags: [] }); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-sm font-medium transition-colors"><Plus size={14} />{t('prompts.newPrompt')}</button>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors"><X size={18} /></button>
                </div>
            </div>

            {/* Search */}
            <div className="px-6 py-3"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('prompts.searchPlaceholder')} className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50" /></div></div>

            <div className="flex-1 overflow-y-auto">
                {creating ? (
                    /* Editor */
                    <div className="px-6 py-4 space-y-4 animate-slide-in-up">
                        <h3 className="text-sm font-semibold">{editing ? t('prompts.editPrompt') : t('prompts.newPrompt')}</h3>
                        <div><label className="text-xs text-[var(--color-text-secondary)] mb-1 block">{t('prompts.promptTitle')}</label><input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('prompts.promptTitlePlaceholder')} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[var(--color-accent)]/50" /></div>
                        <div><label className="text-xs text-[var(--color-text-secondary)] mb-1 block">{t('prompts.category')}</label>
                            <div className="flex flex-wrap gap-2">{CATEGORIES.map(c => (<button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${form.category === c ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10'}`}>{c}</button>))}</div>
                        </div>
                        <div><label className="text-xs text-[var(--color-text-secondary)] mb-1 block">{t('prompts.systemPrompt')}</label><textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder={t('prompts.systemPromptPlaceholder')} rows={8} className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-[family-name:var(--font-mono)] focus:outline-none focus:border-[var(--color-accent)]/50 resize-none" /></div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-sm font-medium transition-colors">{t('settings.save')}</button>
                            <button onClick={() => { setCreating(false); setEditing(null); }} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm transition-colors">{t('settings.cancel')}</button>
                        </div>
                    </div>
                ) : (
                    /* Grid */
                    <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">


                        {filtered.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-[var(--color-text-tertiary)]">
                                <img
                                    src={emptyPromptsImage}
                                    alt="No prompts"
                                    className="w-40 h-40 object-contain mb-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
                                />
                                <p className="text-base font-medium">{search ? t('prompts.noMatchingPrompts') : t('prompts.noPromptsYet')}</p>
                            </div>
                        ) : filtered.map(p => (
                            <div key={p.id} className="glass rounded-2xl p-4 group hover:bg-[var(--color-glass-hover)] transition-all hover:shadow-lg hover:shadow-[var(--color-accent)]/5 hover:-translate-y-0.5">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-sm font-semibold truncate flex-1">{p.title}</h4>
                                    <button onClick={() => onToggleFavorite(p.id, p.is_favorite)} className="p-1 rounded-md hover:bg-white/10"><Star size={14} className={p.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--color-text-tertiary)]'} /></button>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[p.category] || CAT_COLORS.General}`}>{p.category}</span>
                                <p className="text-xs text-[var(--color-text-tertiary)] mt-2 line-clamp-3 font-[family-name:var(--font-mono)]">{p.content}</p>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                    <button onClick={() => onUsePrompt(p.content)} className="px-3 py-1.5 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-xs font-medium hover:bg-[var(--color-accent)]/20 transition-colors">{t('prompts.use')}</button>
                                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"><Pencil size={12} className="text-[var(--color-text-secondary)]" /></button>
                                    <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={12} className="text-red-400" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
