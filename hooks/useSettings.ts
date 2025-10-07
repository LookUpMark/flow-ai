import { useState } from 'react';
import type { AppSettings } from '../types';

const DEFAULTS: AppSettings = {
    provider: 'gemini',
    config: {
        gemini: {
            apiKey: '',
        },
        openrouter: {
            apiKey: '',
            models: ['deepseek/deepseek-chat-v3-0324:free', 'deepseek/deepseek-r1-0528-qwen3-8b:free', 'deepseek/deepseek-r1-0528:free', 'z-ai/glm-4.5-air:free'],
            selectedModel: 'deepseek/deepseek-chat-v3-0324:free',
        },
        ollama: {
            baseUrl: 'http://localhost:11434',
            models: ['llama3', 'gemma:2b'],
            selectedModel: 'llama3',
        },
        zai: {
            apiKey: '',
        },
        lmstudio: {
            baseUrl: 'http://localhost:1234',
            models: [],
            selectedModel: '',
        },
    },
    reasoningModeEnabled: false,
    streamingEnabled: false,
};

const SETTINGS_KEY = 'flowai-settings';

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
                        lmstudio: { ...DEFAULTS.config.lmstudio, ...(parsed.config?.lmstudio || {}) },
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