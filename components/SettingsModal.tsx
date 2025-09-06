import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { AppSettings, ApiProvider } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSave: (settings: AppSettings) => void;
}

const InputField: React.FC<{ id: string; label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string; description?: string; }> = 
({ id, label, value, onChange, placeholder, type = 'text', description }) => (
    <div className="flex flex-col gap-2">
        <label htmlFor={id} className="text-sm font-medium text-muted-foreground">{label}</label>
        <input
            id={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localSettings);
    };

    const updateProviderConfig = <T extends ApiProvider>(provider: T, key: keyof AppSettings['config'][T], value: string) => {
        setLocalSettings(prev => ({
            ...prev,
            config: {
                ...prev.config,
                [provider]: {
                    ...prev.config[provider],
                    [key]: value,
                }
            }
        }));
    };
    
    return ReactDOM.createPortal(
        <>
            <div className="modal-backdrop animate-in fade-in-0" onClick={onClose}></div>
            <div className="modal-content bg-card border border-border rounded-lg shadow-2xl w-[90vw] max-w-lg flex flex-col animate-in fade-in-0 zoom-in-95">
                <header className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-semibold">API Provider Settings</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-accent">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="provider-select" className="text-sm font-medium text-muted-foreground">AI Provider</label>
                        <select
                            id="provider-select"
                            value={localSettings.provider}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, provider: e.target.value as ApiProvider }))}
                            className="h-9 w-full rounded-md border border-input bg-background/50 px-2 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="gemini">Google Gemini</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="ollama">Ollama (Local)</option>
                        </select>
                    </div>

                    <div className="border-b border-border -mx-6"></div>

                    {localSettings.provider === 'gemini' && (
                        <div className="space-y-2 animate-in fade-in-0">
                            <h3 className="font-semibold">Google Gemini</h3>
                            <p className="text-sm text-muted-foreground">
                                Uses the API key provided in the application's environment. Image generation is only available with this provider.
                            </p>
                        </div>
                    )}

                    {localSettings.provider === 'openrouter' && (
                        <div className="space-y-4 animate-in fade-in-0">
                             <h3 className="font-semibold">OpenRouter</h3>
                             <InputField
                                id="openrouter-apikey"
                                label="OpenRouter API Key"
                                type="password"
                                value={localSettings.config.openrouter.apiKey}
                                onChange={(e) => updateProviderConfig('openrouter', 'apiKey', e.target.value)}
                                placeholder="sk-or-..."
                             />
                             <InputField
                                id="openrouter-model"
                                label="Model Name"
                                value={localSettings.config.openrouter.model}
                                onChange={(e) => updateProviderConfig('openrouter', 'model', e.target.value)}
                                placeholder="e.g., mistralai/mistral-7b-instruct"
                                description="Find model names on the OpenRouter website."
                             />
                        </div>
                    )}

                    {localSettings.provider === 'ollama' && (
                        <div className="space-y-4 animate-in fade-in-0">
                             <h3 className="font-semibold">Ollama</h3>
                            <InputField
                                id="ollama-baseurl"
                                label="Ollama Server URL"
                                value={localSettings.config.ollama.baseUrl}
                                onChange={(e) => updateProviderConfig('ollama', 'baseUrl', e.target.value)}
                                placeholder="http://localhost:11434"
                                description="The URL of your running Ollama instance."
                            />
                             <InputField
                                id="ollama-model"
                                label="Model Name"
                                value={localSettings.config.ollama.model}
                                onChange={(e) => updateProviderConfig('ollama', 'model', e.target.value)}
                                placeholder="e.g., llama3"
                                description="The name of the model you have pulled in Ollama."
                            />
                        </div>
                    )}
                </main>
                
                <footer className="p-4 border-t border-border mt-auto flex justify-end">
                     <button
                        onClick={handleSave}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Save and Close
                    </button>
                </footer>
            </div>
        </>,
        document.body
    );
};
