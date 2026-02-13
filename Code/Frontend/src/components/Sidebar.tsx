import { useTranslation } from 'react-i18next';
import { Plus, MessageSquare, Bot, Trash2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import type { Conversation, ViewMode } from '../types';

interface SidebarProps {
    conversations: Conversation[];
    activeId: string | null;
    onSelect: (id: string) => void;
    onNew: () => void;
    onDelete: (id: string) => void;
    onRename: (id: string, title: string) => void;
    onViewChange: (view: ViewMode) => void;
    currentView: ViewMode;
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({
    conversations,
    activeId,
    onSelect,
    onNew,
    onDelete,

    onViewChange,
    currentView,
    isOpen,
    onClose
}: SidebarProps) {
    const { t } = useTranslation();

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('fr-FR', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            return '';
        }
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col glass border-r border-[var(--color-border)] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--color-border)]">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-md shadow-blue-500/20">
                        <Bot size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-[var(--color-text-primary)] m-0">
                            {t('app.title')}
                        </h1>
                        <p className="text-[11px] text-[var(--color-text-secondary)] m-0">
                            {t('app.subtitle')}
                        </p>
                    </div>
                </div>

                {/* New Chat Button */}
                <div className="px-4 py-3">
                    <button
                        type="button"
                        onClick={onNew}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors duration-200 shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                        <Plus size={16} />
                        {t('app.newChat')}
                    </button>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto px-3 py-1">
                    <p className="text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wider px-2 mb-2">
                        {t('app.conversations')}
                    </p>
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`group relative w-full flex items-start gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-colors duration-150 text-left cursor-pointer ${activeId === conv.id
                                ? 'bg-[var(--color-surface-secondary)]'
                                : 'hover:bg-[var(--color-surface-secondary)]'
                                }`}
                            onClick={() => onSelect(conv.id)}
                        >
                            <MessageSquare
                                size={16}
                                className="text-[var(--color-text-secondary)] mt-0.5 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                        {conv.title || t('chat.newConversation')}
                                    </span>
                                    {conv.updated_at && (
                                        <span className="text-[10px] text-[var(--color-text-tertiary)] flex-shrink-0 ml-2">
                                            {formatDate(conv.updated_at)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12px] text-[var(--color-text-secondary)] truncate mt-0.5 m-0">
                                    {conv.preview || '...'}
                                </p>
                            </div>

                            {/* Actions (visible on hover) */}
                            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-[var(--color-surface-secondary)] rounded">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                                    className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom section */}
                <div className="border-t border-[var(--color-border)] px-3 py-3 space-y-1">
                    <button
                        onClick={() => onViewChange('settings')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer text-sm text-[var(--color-text-primary)] ${currentView === 'settings' ? 'bg-[var(--color-surface-secondary)]' : ''}`}
                    >
                        <span>⚙️ {t('settings.title')}</span>
                    </button>
                    <button
                        onClick={() => onViewChange('prompts')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer text-sm text-[var(--color-text-primary)] ${currentView === 'prompts' ? 'bg-[var(--color-surface-secondary)]' : ''}`}
                    >
                        <span>📚 {t('prompts.title')}</span>
                    </button>

                    <LanguageSelector />
                    <ThemeToggle />

                    {/* User */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer mt-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                            CD
                        </div>
                        <span className="text-sm text-[var(--color-text-primary)]">
                            cdagorn
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
}

