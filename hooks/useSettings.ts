import { useState } from 'react';
import type { AppSettings } from '../types';

const DEFAULTS: AppSettings = {
    provider: 'gemini',
    config: {
        gemini: {},
        openrouter: {
            apiKey: '',
            model: 'mistralai/mistral-7b-instruct',
        },
        ollama: {
            baseUrl: 'http://localhost:11434',
            model: 'llama3',
        },
    },
};

const SETTINGS_KEY = 'obsidian-knowledge-architect-settings';

export const useSettings = (): [AppSettings, (settings: AppSettings) => void] => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings);
                // Merge with defaults to ensure new settings are included after an app update
                return {
                    ...DEFAULTS,
                    ...parsed,
                    config: {
                        ...DEFAULTS.config,
                        ...(parsed.config || {}),
                        openrouter: { ...DEFAULTS.config.openrouter, ...(parsed.config?.openrouter || {}) },
                        ollama: { ...DEFAULTS.config.ollama, ...(parsed.config?.ollama || {}) },
                    },
                };
            }
        } catch (error) {
            console.error("Failed to parse settings from localStorage", error);
        }
        return DEFAULTS;
    });

    const saveSettings = (newSettings: AppSettings) => {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    };

    return [settings, saveSettings];
};
