'use client';

import { useEffect } from 'react';

interface ThemeProps {
    primary: string;
    secondary: string;
}

export const ThemeProvider = ({ theme }: { theme?: ThemeProps }) => {
    useEffect(() => {
        if (theme) {
            document.documentElement.style.setProperty('--primary-color', theme.primary);
            document.documentElement.style.setProperty('--secondary-color', theme.secondary);
        } else {
            // Default colors if no theme provided (Super Admin or Guest)
            document.documentElement.style.setProperty('--primary-color', '#3b82f6');
            document.documentElement.style.setProperty('--secondary-color', '#1e40af');
        }
    }, [theme]);

    return null;
};
