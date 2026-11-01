import { useEffect, useState, useCallback } from "react";

const applyDocumentTheme = (darkMode) => {
    document.documentElement.dataset.b25Theme = darkMode ? 'dark' : 'light';
};

const THEME_MORPH_MS = 160;
const REDUCED_THEME_MORPH_MS = 90;
let themeMorphTimer;

const beginThemeMorph = () => {
    document.documentElement.dataset.b25ThemeTransition = 'material';
    if (themeMorphTimer) clearTimeout(themeMorphTimer);

    const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        ? REDUCED_THEME_MORPH_MS
        : THEME_MORPH_MS;

    themeMorphTimer = window.setTimeout(() => {
        delete document.documentElement.dataset.b25ThemeTransition;
        themeMorphTimer = undefined;
    }, duration);
};

export const useDarkMode = () => {
    const [ darkMode, setDarkMode ] = useState(() => {
        const savedState = localStorage.getItem('darkMode');
        return savedState ? JSON.parse(savedState) : false;
    });

    const toggleDarkMode = useCallback(() => {
        const savedState = localStorage.getItem('darkMode');
        const currentState = savedState ? JSON.parse(savedState) : false;
        const newState = !currentState;

        beginThemeMorph();
        localStorage.setItem('darkMode', JSON.stringify(newState));
        applyDocumentTheme(newState);
        setDarkMode(newState);
        window.dispatchEvent(new Event('darkModeChanged'));
    }, []);

    useEffect(() => {
        const syncDarkMode = () => {
            const savedState = localStorage.getItem('darkMode');
            if (savedState !== null)
            {
                const nextMode = JSON.parse(savedState);
                applyDocumentTheme(nextMode);
                setDarkMode(nextMode);
            }
        };

        window.addEventListener('storage', syncDarkMode);
        window.addEventListener('darkModeChanged', syncDarkMode);

        return () => {
            window.removeEventListener('storage', syncDarkMode);
            window.removeEventListener('darkModeChanged', syncDarkMode);
        };
    }, []);

    useEffect(() => {
        applyDocumentTheme(darkMode);
    }, [darkMode]);

    return [darkMode, toggleDarkMode, setDarkMode];
};
