import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Bot, User, Settings } from 'lucide-react';

interface MessageBubbleProps {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
    timestamp?: string;
    isCode?: boolean; // Kept for compatibility but unused
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
    const isUser = role === 'user';
    const isSystem = role === 'system';

    // Helper to render content parts
    const renderContent = () => {
        if (typeof content === 'string') {
            return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{
                code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                        <pre className={`${className} bg-black/30 rounded-md p-2 my-2 overflow-x-auto`} style={props.style}>
                            <code className={className} {...props}>
                                {children}
                            </code>
                        </pre>
                    ) : (
                        <code className={`${className} bg-black/20 rounded px-1 py-0.5 font-mono text-sm`} {...props}>
                            {children}
                        </code>
                    )
                }
            }}>{content}</ReactMarkdown>;
        }

        return (
            <div className="flex flex-col gap-2">
                {content.map((part, idx) => {
                    if (part.type === 'text' && part.text) {
                        return <ReactMarkdown key={idx} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{
                            code({ node, className, children, ...props }) {
                                const match = /language-(\w+)/.exec(className || '')
                                return match ? (
                                    <pre className={`${className} bg-black/30 rounded-md p-2 my-2 overflow-x-auto`} style={props.style}>
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    </pre>
                                ) : (
                                    <code className={`${className} bg-black/20 rounded px-1 py-0.5 font-mono text-sm`} {...props}>
                                        {children}
                                    </code>
                                )
                            }
                        }}>{part.text}</ReactMarkdown>;
                    }
                    if (part.type === 'image_url' && part.image_url) {
                        return <img key={idx} src={part.image_url.url} alt="attached media" className="max-w-full rounded-lg my-2" />;
                    }
                    return null;
                })}
            </div>
        );
    };

    if (isSystem) {
        return (
            <div className="flex justify-center mb-4 animate-fade-in opacity-70">
                <div className="bg-[var(--color-surface-secondary)] border border-[var(--color-border)] px-4 py-2 rounded-lg text-xs flex items-center gap-2">
                    <Settings size={12} />
                    <span className="font-mono">{typeof content === 'string' ? content : 'System Message'}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex gap-3 mb-4 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-secondary)] border border-[var(--color-border)]'
                    }`}
            >
                {isUser ? (
                    <User size={16} className="text-white" />
                ) : (
                    <Bot size={16} className="text-[var(--color-primary)]" />
                )}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed overflow-hidden ${isUser
                        ? 'bg-[var(--color-bubble-user)] text-[var(--color-bubble-user-text)] rounded-br-md'
                        : 'bg-[var(--color-bubble-assistant)] text-[var(--color-bubble-assistant-text)] rounded-bl-md'
                        }`}
                >
                    <div className="markdown-body">
                        {renderContent()}
                    </div>
                </div>
                {timestamp && (
                    <span
                        className={`text-[11px] text-[var(--color-text-tertiary)] mt-1 px-1 block ${isUser ? 'text-right' : 'text-left'
                            }`}
                    >
                        {timestamp}
                    </span>
                )}
            </div>
        </div>
    );
}

export function TypingIndicator() {
    return (
        <div className="flex gap-3 mb-4 animate-fade-in">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--color-surface-secondary)] border border-[var(--color-border)]">
                <Bot size={16} className="text-[var(--color-primary)]" />
            </div>
            <div className="bg-[var(--color-bubble-assistant)] px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] typing-dot" />
                    <div className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] typing-dot" />
                </div>
            </div>
        </div>
    );
}
