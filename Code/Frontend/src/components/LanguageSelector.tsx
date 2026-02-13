import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

interface LanguageOption {
    code: string;
    flag: string;
    label: string;
}

const LANGUAGES: LanguageOption[] = [
    { code: 'fr', flag: '🇫🇷', label: 'Français' },
    { code: 'en', flag: '🇬🇧', label: 'English' },
    { code: 'es', flag: '🇪🇸', label: 'Español' },
    { code: 'de', flag: '🇩🇪', label: 'Deutsch' },
];

export function LanguageSelector() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSelect(code: string) {
        i18n.changeLanguage(code);
        setIsOpen(false);
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl transition-colors duration-200 hover:bg-[var(--color-surface-secondary)] text-sm text-[var(--color-text-secondary)] cursor-pointer"
                type="button"
            >
                <Globe size={16} />
                <span className="text-base">{currentLang.flag}</span>
                <span>{currentLang.label}</span>
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-full glass rounded-xl overflow-hidden shadow-lg z-50 animate-fade-in">
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => handleSelect(lang.code)}
                            className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors duration-150 cursor-pointer
                ${lang.code === i18n.language
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]'
                                }`}
                            type="button"
                        >
                            <span className="text-base">{lang.flag}</span>
                            <span>{lang.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
