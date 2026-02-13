/** DagBot — Chat hook for SSE streaming and message management. */

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, ChatSettings } from '../types';
import { streamChat } from '../lib/api';

interface UseChatReturn {
    messages: ChatMessage[];
    isStreaming: boolean;
    error: string | null;
    sendMessage: (content: string, settings: ChatSettings, conversationId?: string, systemPrompt?: string, attachments?: File[]) => Promise<string | undefined>;
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    clearMessages: () => void;
    stopStreaming: () => void;
}

export function useChat(): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef(false);
    const convIdRef = useRef<string | undefined>(undefined);

    const stopStreaming = useCallback(() => {
        abortRef.current = true;
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setError(null);
    }, []);

    const sendMessage = useCallback(
        async (content: string, settings: ChatSettings, conversationId?: string, systemPrompt?: string, attachments?: File[]): Promise<string | undefined> => {
            setError(null);
            abortRef.current = false;
            convIdRef.current = conversationId;

            let messageContent: ChatMessage['content'] = content;

            if (attachments && attachments.length > 0) {
                const parts: any[] = [];
                if (content.trim()) {
                    parts.push({ type: 'text', text: content });
                }

                for (const file of attachments) {
                    if (file.type.startsWith('image/')) {
                        const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(file);
                        });
                        parts.push({
                            type: 'image_url',
                            image_url: { url: base64 }
                        });
                    }
                    // TODO: Handle other file types as text or specific format if supported
                    else if (file.type.startsWith('text/') || file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js') || file.name.endsWith('.json') || file.name.endsWith('.md')) {
                        const text = await file.text();
                        parts.push({ type: 'text', text: `File: ${file.name}\n\n${text}` });
                    }
                }
                messageContent = parts;
            }

            const userMessage: ChatMessage = { role: 'user', content: messageContent };
            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);

            const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsStreaming(true);

            try {
                await streamChat({
                    provider: settings.provider,
                    model: settings.model,
                    messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
                    system_prompt: systemPrompt,
                    conversation_id: conversationId,
                    temperature: settings.temperature,
                    top_p: settings.top_p,
                    max_tokens: settings.max_tokens,
                    presence_penalty: settings.presence_penalty,
                    frequency_penalty: settings.frequency_penalty,
                    onToken: (token) => {
                        if (abortRef.current) return;
                        setMessages((prev) => {
                            const updated = [...prev];
                            const last = updated[updated.length - 1];
                            if (last && last.role === 'assistant') {
                                // Provide fallback if content is not string (though assistant stream usually is)
                                const currentContent = typeof last.content === 'string' ? last.content : '';
                                updated[updated.length - 1] = { ...last, content: currentContent + token };
                            }
                            return updated;
                        });
                    },
                    onConversationId: (id) => {
                        convIdRef.current = id;
                    },
                    onDone: () => {
                        setIsStreaming(false);
                    },
                    onError: (errMsg) => {
                        setError(errMsg);
                        setIsStreaming(false);
                    },
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error');
                setIsStreaming(false);
            }

            return convIdRef.current;
        },
        [messages],
    );

    return { messages, isStreaming, error, sendMessage, setMessages, clearMessages, stopStreaming };
}
