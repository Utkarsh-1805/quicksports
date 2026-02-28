'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ThemeToggle Component
 * A toggle button to switch between light and dark mode
 */
export function ThemeToggle({ className = '' }) {
    const { theme, toggleTheme, mounted } = useTheme();

    // Don't render toggle until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <div className={`w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 ${className}`} />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${className}`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {theme === 'light' ? (
                <Moon className="w-5 h-5" />
            ) : (
                <Sun className="w-5 h-5" />
            )}
        </button>
    );
}

/**
 * ThemeToggleSwitch Component
 * A switch-style toggle for theme selection
 */
export function ThemeToggleSwitch({ className = '' }) {
    const { theme, toggleTheme, mounted } = useTheme();

    if (!mounted) {
        return (
            <div className={`w-14 h-7 rounded-full bg-slate-200 ${className}`} />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-purple-600' : 'bg-slate-200'
            } ${className}`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center ${
                    theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
                }`}
            >
                {theme === 'light' ? (
                    <Sun className="w-3 h-3 text-yellow-500" />
                ) : (
                    <Moon className="w-3 h-3 text-purple-600" />
                )}
            </span>
        </button>
    );
}
