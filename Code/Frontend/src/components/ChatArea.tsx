import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Paperclip, Settings, X, FileText } from 'lucide-react';
import { MessageBubble, TypingIndicator } from './MessageBubble';
import type { ChatMessage, ChatSettings, Provider } from '../types';
import emptyChatImage from '../assets/empty-chat.png';

interface ChatAreaProps {
    messages: ChatMessage[];
    isStreaming: boolean;
    error: string | null;
    settings: ChatSettings;
    providers: Provider[];
    systemPrompt: string;
    input: string;
    onInputChange: (value: string) => void;
    onSend: (content: string, attachments: File[]) => Promise<string | void>;
    onStop: () => void;
    onSettingsChange: (settings: Partial<ChatSettings>) => void;
    onSystemPromptChange: (prompt: string) => void;
}

export function ChatArea({
    messages,
    isStreaming,
    error,
    settings,
    providers,
    onSend,
    onStop,
    systemPrompt,
    onSystemPromptChange,
    input,
    onInputChange,
}: ChatAreaProps) {
    const { t } = useTranslation();
    const [attachments, setAttachments] = useState<File[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeProvider = providers.find(p => p.name === settings.provider);
    const providerLabel = activeProvider?.display_name || settings.provider;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isStreaming]);

    function handleSend() {
        if (!input.trim() && attachments.length === 0) return;
        onSend(input, attachments);
        onInputChange('');
        setAttachments([]);
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files || [])]);
        }
        // Reset input value to allow selecting the same file again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function removeAttachment(index: number) {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    }

    // Helper to format timestamp from ISO string or use current time if missing
    const getTimestamp = (isoDate?: string) => {
        if (!isoDate) return '';
        try {
            return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Sticky Header with System Context */}
            <div className="sticky top-0 z-20 bg-[var(--color-bg)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-6 py-3 transition-all duration-300">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <details className="group flex-1">
                        <summary className="list-none flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-primary)] transition-colors select-none py-1">
                            <Settings size={14} className="group-open:rotate-90 transition-transform duration-200" />
                            <span>{t('chat.systemContext', 'System Context')}</span>
                        </summary>
                        <div className="mt-3 animate-fade-in pb-2">
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => onSystemPromptChange(e.target.value)}
                                placeholder={t('chat.systemPromptPlaceholder')}
                                className="w-full h-24 p-3 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none transition-all"
                            />
                        </div>
                    </details>

                    {/* Active AI Indicator */}
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface-secondary)] border border-[var(--color-border)] shadow-sm animate-fade-in">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                            <span className="text-[var(--color-text-primary)]">{providerLabel}</span>
                            <span className="mx-1 opacity-50">•</span>
                            <span className="opacity-80">{settings.model}</span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="max-w-3xl mx-auto">




                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-secondary)] opacity-80 mt-10">
                            <img
                                src={emptyChatImage}
                                alt="Welcome"
                                className="w-48 h-48 object-contain mb-4 animate-fade-in drop-shadow-2xl"
                            />
                            <p className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                                {t('chat.welcome')}
                            </p>
                            <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
                                {t('app.subtitle')}
                            </p>
                        </div>
                    )}
                    {messages.map((msg, idx) => (
                        <MessageBubble
                            key={msg.id || idx}
                            role={msg.role}
                            content={msg.content}
                            timestamp={getTimestamp(msg.created_at)}
                        />
                    ))}
                    {isStreaming && <TypingIndicator />}
                    {error && (
                        <div className="text-red-500 bg-red-500/10 p-4 rounded-lg mt-4 text-center">
                            {error}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="border-t border-[var(--color-border)] px-6 py-4">
                <div className="max-w-3xl mx-auto">
                    {/* Attachment Previews */}
                    {attachments.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto py-1 custom-scrollbar">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="relative group flex-shrink-0 bg-[var(--color-surface-secondary)] rounded-lg border border-[var(--color-border)] p-2 w-24 h-24 flex flex-col items-center justify-center overflow-hidden">
                                    <button
                                        onClick={() => removeAttachment(idx)}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    >
                                        <X size={12} />
                                    </button>
                                    {file.type.startsWith('image/') ? (
                                        <img
                                            src={URL.createObjectURL(file)}
                                            alt="preview"
                                            className="w-full h-full object-cover rounded"
                                            onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                                        />
                                    ) : (
                                        <>
                                            <FileText size={24} className="text-[var(--color-text-secondary)] mb-1" />
                                            <span className="text-[10px] text-[var(--color-text-primary)] w-full text-center truncate px-1">{file.name}</span>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="glass-input flex items-end gap-3 rounded-2xl px-4 py-3">
                        <input
                            type="file"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-1 cursor-pointer"
                            aria-label="Attach file"
                        >
                            <Paperclip size={20} />
                        </button>

                        <textarea
                            value={input}
                            onChange={(e) => onInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t('app.inputPlaceholder')}
                            rows={1}
                            className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] leading-relaxed max-h-32"
                        />

                        {isStreaming ? (
                            <button
                                type="button"
                                onClick={onStop}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer bg-red-500 text-white shadow-md shadow-red-500/20"
                            >
                                <span className="w-2 h-2 bg-white rounded-sm" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={!input.trim() && attachments.length === 0}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 cursor-pointer ${input.trim() || attachments.length > 0
                                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-blue-500/20'
                                    : 'bg-[var(--color-text-tertiary)] text-[var(--color-surface)] opacity-50'
                                    }`}
                                aria-label={t('app.send')}
                            >
                                <Send size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}



