import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { AppSettings, ApiProvider } from '../types';
import { fetchLMStudioModels, fetchOllamaModels, testProviderConnection } from '../utils/modelUtils';

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

const ConnectionTester: React.FC<{
    provider: 'ollama' | 'lmstudio';
    baseUrl: string;
}> = ({ provider, baseUrl }) => {
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [connectionMessage, setConnectionMessage] = useState('');

    const testConnection = async () => {
        if (!baseUrl.trim()) {
            setConnectionStatus('error');
            setConnectionMessage('Inserisci un URL valido');
            return;
        }

        setIsTestingConnection(true);
        setConnectionStatus('idle');
        setConnectionMessage('');

        try {
            if (provider === 'lmstudio') {
                await fetchLMStudioModels(baseUrl);
                setConnectionStatus('success');
                setConnectionMessage('Connessione riuscita! LMStudio è raggiungibile.');
            } else if (provider === 'ollama') {
                await fetchOllamaModels(baseUrl);
                setConnectionStatus('success');
                setConnectionMessage('Connessione riuscita! Ollama è raggiungibile.');
            }
        } catch (error) {
            setConnectionStatus('error');
            setConnectionMessage(error instanceof Error ? error.message : 'Errore di connessione sconosciuto');
        } finally {
            setIsTestingConnection(false);
        }
    };

    return (
        <div className="space-y-2">
            <button
                onClick={testConnection}
                disabled={isTestingConnection || !baseUrl.trim()}
                className="w-full px-3 py-2 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 rounded-md transition-colors"
            >
                {isTestingConnection ? 'Test in corso...' : 'Testa Connessione'}
            </button>
            {connectionStatus !== 'idle' && (
                <div className={`text-sm p-2 rounded-md ${
                    connectionStatus === 'success' 
                        ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' 
                        : 'text-destructive bg-destructive/10'
                }`}>
                    {connectionMessage}
                </div>
            )}
        </div>
    );
};

const ModelManager: React.FC<{
    provider: 'openrouter' | 'ollama' | 'lmstudio';
    localSettings: AppSettings;
    setLocalSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}> = ({ provider, localSettings, setLocalSettings }) => {
    const [newModel, setNewModel] = useState('');
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [loadingError, setLoadingError] = useState('');

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

    const handleFetchModels = async () => {
        if (provider === 'openrouter') return; // OpenRouter doesn't support model fetching from local server
        
        setIsLoadingModels(true);
        setLoadingError('');

        try {
            let models: string[] = [];
            if (provider === 'lmstudio') {
                models = await fetchLMStudioModels(localSettings.config.lmstudio.baseUrl);
            } else if (provider === 'ollama') {
                models = await fetchOllamaModels(localSettings.config.ollama.baseUrl);
            }

            if (models.length === 0) {
                setLoadingError('No models found. Make sure your server is running and has models loaded.');
                return;
            }

            setLocalSettings(prev => {
                const currentConfig = prev.config[provider];
                const currentSelected = currentConfig.selectedModel;
                const newSelectedModel = currentSelected && models.includes(currentSelected) 
                    ? currentSelected 
                    : models[0];

                return {
                    ...prev,
                    config: {
                        ...prev.config,
                        [provider]: {
                            ...currentConfig,
                            models,
                            selectedModel: newSelectedModel,
                        }
                    }
                };
            });
        } catch (error) {
            setLoadingError(`Failed to fetch models: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoadingModels(false);
        }
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
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">Models</label>
                {(provider === 'ollama' || provider === 'lmstudio') && (
                    <button
                        onClick={handleFetchModels}
                        disabled={isLoadingModels}
                        className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50 rounded-md transition-colors"
                    >
                        {isLoadingModels ? 'Loading...' : 'Fetch Models'}
                    </button>
                )}
            </div>
            {loadingError && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
                    {loadingError}
                </div>
            )}
            {(localSettings.config[provider].models || []).length > 0 && (
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Selected Model</label>
                    <select
                        value={localSettings.config[provider].selectedModel}
                        onChange={(e) => setLocalSettings(prev => ({
                            ...prev,
                            config: {
                                ...prev.config,
                                [provider]: {
                                    ...prev.config[provider],
                                    selectedModel: e.target.value,
                                }
                            }
                        }))}
                        className="h-9 w-full rounded-md border border-input bg-background/50 px-2 py-1.5 text-sm"
                    >
                        {localSettings.config[provider].models.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>
            )}
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
                        placeholder={provider === 'openrouter' ? "e.g., google/gemma-7b-it" : provider === 'lmstudio' ? "e.g., gpt-4o-mini" : "e.g., llama3:8b"}
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
                            <option value="lmstudio">LMStudio (Local)</option>
                        </select>
                    </div>

                    {/* Global Settings */}
                    <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-muted-foreground">Opzioni Globali</h3>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label htmlFor="streaming-toggle" className="text-sm font-medium cursor-pointer">
                                    Abilita Streaming
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Mostra il testo mentre viene generato. Disabilita per modelli che non supportano lo streaming.
                                </p>
                            </div>
                            <button
                                id="streaming-toggle"
                                role="switch"
                                aria-checked={localSettings.streamingEnabled}
                                onClick={() => setLocalSettings(prev => ({ ...prev, streamingEnabled: !prev.streamingEnabled }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                    localSettings.streamingEnabled ? 'bg-primary' : 'bg-input'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                                        localSettings.streamingEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <label htmlFor="reasoning-toggle" className="text-sm font-medium cursor-pointer">
                                    Modalità Ragionamento
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Consente al modello di "pensare" prima di rispondere per risultati più accurati.
                                </p>
                            </div>
                            <button
                                id="reasoning-toggle"
                                role="switch"
                                aria-checked={localSettings.reasoningModeEnabled}
                                onClick={() => setLocalSettings(prev => ({ ...prev, reasoningModeEnabled: !prev.reasoningModeEnabled }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                                    localSettings.reasoningModeEnabled ? 'bg-primary' : 'bg-input'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                                        localSettings.reasoningModeEnabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
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
                            <ConnectionTester 
                                provider="ollama" 
                                baseUrl={localSettings.config.ollama.baseUrl} 
                            />
                            <ModelManager provider="ollama" localSettings={localSettings} setLocalSettings={setLocalSettings} />
                        </div>
                    )}

                    {localSettings.provider === 'lmstudio' && (
                        <div className="space-y-4 animate-in fade-in-0">
                             <h3 className="font-semibold">LMStudio</h3>
                             <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">🚀 Setup rapido</h4>
                                <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                                    <li>1. Apri LMStudio e carica un modello</li>
                                    <li>2. Vai alla scheda "Local Server" e avvia il server</li>
                                    <li>3. Testa la connessione qui sotto</li>
                                    <li>4. Usa "Fetch Models" per caricare i modelli disponibili</li>
                                </ul>
                             </div>
                            <InputField
                                id="lmstudio-baseurl"
                                label="LMStudio Server URL"
                                value={localSettings.config.lmstudio.baseUrl}
                                onChange={(e) => updateProviderConfig('lmstudio', 'baseUrl', e.target.value)}
                                placeholder="http://localhost:1234"
                                description="L'URL della tua istanza LMStudio in esecuzione (solitamente http://localhost:1234)."
                            />
                            <ConnectionTester 
                                provider="lmstudio" 
                                baseUrl={localSettings.config.lmstudio.baseUrl} 
                            />
                            <ModelManager provider="lmstudio" localSettings={localSettings} setLocalSettings={setLocalSettings} />
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