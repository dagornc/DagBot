import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const { resolvedTheme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors duration-200 hover:bg-[var(--color-surface-secondary)] cursor-pointer"
            aria-label={isDark ? t('sidebar.lightMode') : t('sidebar.darkMode')}
            type="button"
        >
            <div className={`toggle-track ${isDark ? 'active' : ''}`}>
                <div className="toggle-thumb" />
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                {isDark ? (
                    <>
                        <Moon size={14} />
                        <span>{t('sidebar.darkMode')}</span>
                    </>
                ) : (
                    <>
                        <Sun size={14} />
                        <span>{t('sidebar.lightMode')}</span>
                    </>
                )}
            </div>
        </button>
    );
}
