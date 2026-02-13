import React from 'react';
import { CheckCircle2, Sparkles, AlertCircle, AlertTriangle } from 'lucide-react';

export interface SelectionCardProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    selected?: boolean;
    onClick?: () => void;
    recommended?: boolean;
    badges?: string[];
    children?: React.ReactNode;
    className?: string;
    status?: 'success' | 'error' | 'warning' | 'neutral';
    statusMessage?: string;
}

export function SelectionCard({
    title,
    description,
    icon,
    selected,
    onClick,
    recommended,
    badges,
    children,
    className = '',
    status,
    statusMessage,
}: SelectionCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
                group relative flex flex-col p-4 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden
                ${selected
                    ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)] shadow-[0_0_15px_-5px_var(--color-accent)]'
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                }
                ${className}
            `}
        >
            {/* Recommended Badge */}
            {recommended && (
                <div className="absolute top-0 right-0 px-2 py-1 bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-wider rounded-bl-xl z-10 flex items-center gap-1">
                    <Sparkles size={10} className="text-yellow-200" />
                    Recommended
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Icon Area */}
                <div className={`
                    shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                    ${selected ? 'bg-[var(--color-accent)] text-white' : 'bg-white/5 text-[var(--color-text-secondary)] group-hover:bg-white/10'}
                `}>
                    {icon || <Sparkles size={20} />}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 pr-16 relative">
                        <h3 className={`font-semibold text-sm truncate ${selected ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                            {title}
                        </h3>
                    </div>

                    {description && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed mb-2">
                            {description}
                        </p>
                    )}

                    {/* Badges Row */}
                    {badges && badges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {badges.map((badge, index) => (
                                <span key={index} className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-[var(--color-text-tertiary)] border border-white/5 font-medium">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selection Indicator */}
                <div className="shrink-0 pt-1">
                    {selected ? (
                        <CheckCircle2 size={20} className="text-[var(--color-accent)]" />
                    ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white/10 group-hover:border-white/30 transition-colors" />
                    )}
                </div>
            </div>

            {/* Status Message */}
            {(status || statusMessage) && (
                <div className={`mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs font-medium
                    ${status === 'success' ? 'text-[var(--color-success)]' :
                        status === 'error' ? 'text-[var(--color-error)]' :
                            status === 'warning' ? 'text-yellow-400' : 'text-[var(--color-text-tertiary)]'}
                `}>
                    {status === 'success' && <CheckCircle2 size={12} />}
                    {status === 'error' && <AlertCircle size={12} />}
                    {status === 'warning' && <AlertTriangle size={12} />}
                    <span>{statusMessage}</span>
                </div>
            )}

            {children && <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">{children}</div>}
        </div>
    );
}

export function SelectionGroup({ children, columns = 1, className = '' }: { children: React.ReactNode, columns?: 1 | 2 | 3, className?: string }) {
    const gridCols = columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return (
        <div className={`grid ${gridCols} gap-3 ${className}`}>
            {children}
        </div>
    );
}
