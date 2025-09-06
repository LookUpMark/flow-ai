import { useState } from 'react';
import type { AppSettings } from '../types';

const DEFAULTS: AppSettings = {
    provider: 'gemini',
    config: {
        gemini: {},
        openrouter: {
            apiKey: '',
            models: ['deepseek/deepseek-chat-v3.1:free', 'mistralai/mistral-7b-instruct'],
            selectedModel: 'deepseek/deepseek-chat-v3.1:free',
        },
        ollama: {
            baseUrl: 'http://localhost:11434',
            models: ['llama3', 'gemma:2b'],
            selectedModel: 'llama3',
        },
    },
    reasoningModeEnabled: true,
};

const SETTINGS_KEY = 'obsidian-knowledge-architect-settings';

export const useSettings = (): [AppSettings, (settings: AppSettings) => void] => {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_KEY);
            if (storedSettings) {
                const parsed = JSON.parse(storedSettings) as any; // Use any to handle old structure

                // Backwards compatibility migration for model settings
                if (parsed.config?.openrouter?.model && !parsed.config.openrouter.models) {
                    const model = parsed.config.openrouter.model;
                    parsed.config.openrouter.models = [model];
                    parsed.config.openrouter.selectedModel = model;
                    delete parsed.config.openrouter.model;
                }
                if (parsed.config?.ollama?.model && !parsed.config.ollama.models) {
                    const model = parsed.config.ollama.model;
                    parsed.config.ollama.models = [model];
                    parsed.config.ollama.selectedModel = model;
                    delete parsed.config.ollama.model;
                }

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