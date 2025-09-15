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

const ModelManager: React.FC<{
    provider: 'openrouter' | 'ollama';
    localSettings: AppSettings;
    setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}> = ({ provider, localSettings, setLocalSettings }) => {
    const [newModel, setNewModel] = useState('');

    const handleAddModel = () => {
        const trimmedModel = newModel.trim();
        if (!trimmedModel) return;

        setLocalSettings(prev => {
            const currentConfig = prev.config[provider];
            const currentModels = currentConfig.models || [];
            if (currentModels.includes(trimmedModel)) {
                return prev;
            }
            const updatedModels = [...currentModels, trimmedModel];
            return {
                ...prev,
                config: {
                    ...prev.config,
                    [provider]: {
                        ...currentConfig,
                        models: updatedModels,
                        selectedModel: currentConfig.selectedModel || trimmedModel,
                    }
                }
            };
        });
        setNewModel('');
    };

    const handleRemoveModel = (modelToRemove: string) => {
        setLocalSettings(prev => {
            const currentConfig = prev.config[provider];
            const currentModels = currentConfig.models || [];
            const updatedModels = currentModels.filter(m => m !== modelToRemove);
            const currentSelected = currentConfig.selectedModel;
            let newSelectedModel = currentSelected;
            if (currentSelected === modelToRemove) {
                newSelectedModel = updatedModels.length > 0 ? updatedModels[0] : '';
            }
            return {
                ...prev,
                config: {
                    ...prev.config,
                    [provider]: {
                        ...currentConfig,
                        models: updatedModels,
                        selectedModel: newSelectedModel,
                    }
                }
            };
        });
    };

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Models</label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {(localSettings.config[provider].models || []).map(model => (
                    <div key={model} className="flex items-center justify-between bg-background/50 p-2 rounded-md border border-input">
                        <span className="text-sm truncate pr-2" title={model}>{model}</span>
                        <button
                            onClick={() => handleRemoveModel(model)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors rounded-md flex-shrink-0"
                            aria-label={`Remove ${model}`}
                            title={`Remove ${model}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>
                ))}
                {(localSettings.config[provider].models || []).length === 0 && <p className="text-xs text-muted-foreground px-2">No models added yet.</p>}
            </div>
            <div className="flex gap-2 items-end">
                <div className="flex-grow">
                    <label htmlFor={`${provider}-new-model`} className="text-xs font-medium text-muted-foreground">Add New Model</label>
                    <input
                        id={`${provider}-new-model`}
                        type="text"
                        value={newModel}
                        onChange={e => setNewModel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddModel(); } }}
                        placeholder={provider === 'openrouter' ? "e.g., google/gemma-7b-it" : "e.g., llama3:8b"}
                        className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-sm"
                    />
                </div>
                <button
                    onClick={handleAddModel}
                    className="h-9 px-4 inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors flex-shrink-0"
                >
                    Add
                </button>
            </div>
        </div>
    );
};


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
            <div className="modal-content bg-card border border-border rounded-lg shadow-2xl w-[90vw] max-w-lg flex flex-col animate-in fade-in-0 zoom-in-95 max-h-[90vh]">
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
                            <option value="zai">Z.ai</option>
                            <option value="ollama">Ollama (Local)</option>
                        </select>
                    </div>

                    <div className="border-b border-border -mx-6"></div>

                    {localSettings.provider === 'gemini' && (
                        <div className="space-y-4 animate-in fade-in-0">
                            <h3 className="font-semibold">Google Gemini</h3>
                            <p className="text-sm text-muted-foreground">
                                Enter your Google Gemini API key below. Image generation is only available with this provider.
                            </p>
                            <InputField
                                id="gemini-apikey"
                                label="Gemini API Key"
                                type="password"
                                value={localSettings.config.gemini.apiKey}
                                onChange={(e) => updateProviderConfig('gemini', 'apiKey', e.target.value)}
                                placeholder="AIza..."
                             />
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
                            <ModelManager provider="openrouter" localSettings={localSettings} setLocalSettings={setLocalSettings} />
                        </div>
                    )}

                    {localSettings.provider === 'zai' && (
                        <div className="space-y-4 animate-in fade-in-0">
                             <h3 className="font-semibold">Z.ai</h3>
                             <p className="text-sm text-muted-foreground">
                                Enter your Z.ai API key below. Z.ai provides access to various AI models through their unified API.
                             </p>
                             <InputField
                                id="zai-apikey"
                                label="Z.ai API Key"
                                type="password"
                                value={localSettings.config.zai.apiKey}
                                onChange={(e) => updateProviderConfig('zai', 'apiKey', e.target.value)}
                                placeholder="zai-..."
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
                            <ModelManager provider="ollama" localSettings={localSettings} setLocalSettings={setLocalSettings} />
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