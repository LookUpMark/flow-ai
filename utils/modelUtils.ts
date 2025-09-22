import type { AppSettings } from '../types';

// Helper function to get the correct base URL for API calls
const getApiBaseUrl = (configuredBaseUrl: string): string => {
    // In development, use proxy to avoid CORS issues
    if (process.env.NODE_ENV === 'development' && configuredBaseUrl.includes('localhost:1234')) {
        return ''; // Use relative URLs which will be proxied by Vite
    }
    return configuredBaseUrl.replace(/\/$/, ''); // Remove trailing slash
};

// Function to fetch available models from LMStudio using native REST API
export const fetchLMStudioModels = async (baseUrl: string): Promise<string[]> => {
    try {
        // Get the correct API base URL (proxy-aware in development)
        const apiBaseUrl = getApiBaseUrl(baseUrl);
        
        // Try native API first (v0.3.6+), fallback to OpenAI compatible
        let url = `${apiBaseUrl}/api/v0/models`;
        let useNativeAPI = true;
        
        console.log(`Attempting to fetch LMStudio models from native API: ${url}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`Original baseUrl: ${baseUrl}`);
        console.log(`Using apiBaseUrl: ${apiBaseUrl}`);
        
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            // Add timeout to avoid hanging
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        // If native API fails, try OpenAI compatible API
        if (!response.ok) {
            console.log('Native API failed, trying OpenAI compatible API...');
            url = `${apiBaseUrl}/v1/models`;
            useNativeAPI = false;
            
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(10000)
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}. Assicurati che LMStudio sia in esecuzione e che il server API sia attivo.`);
        }
        
        const data = await response.json();
        console.log(`LMStudio models response (${useNativeAPI ? 'native' : 'openai'} API):`, data);
        
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Formato di risposta non valido da LMStudio. Verifica che il server sia configurato correttamente.');
        }
        
        let models: string[];
        
        if (useNativeAPI) {
            // Native API provides richer information
            models = data.data.map((model: any) => {
                const modelId = model.id;
                const state = model.state === 'loaded' ? ' 🟢' : ' ⚪';
                const type = model.type ? ` (${model.type})` : '';
                return `${modelId}${state}${type}`;
            }).filter(Boolean);
            
            console.log(`Found ${models.length} models via native API`);
        } else {
            // OpenAI compatible API
            models = data.data.map((model: any) => model.id).filter(Boolean);
            console.log(`Found ${models.length} models via OpenAI API`);
        }
        
        if (models.length === 0) {
            throw new Error('Nessun modello trovato in LMStudio. Carica un modello nell\'applicazione LMStudio prima di procedere.');
        }
        
        return models;
    } catch (error) {
        console.error('Error fetching LMStudio models:', error);
        
        // Provide more specific error messages
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(`Impossibile connettere a LMStudio su ${baseUrl}. Verifica che:\n1. LMStudio sia in esecuzione\n2. Il server API sia attivo (porta 1234 di default)\n3. L'URL sia corretto\n4. Non ci siano problemi di firewall`);
        }
        
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Timeout della connessione a LMStudio. Il server potrebbe essere lento o non rispondere.');
        }
        
        throw error;
    }
};

// Function to fetch available models from Ollama
export const fetchOllamaModels = async (baseUrl: string): Promise<string[]> => {
    try {
        const response = await fetch(`${baseUrl}/api/tags`);
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        throw error;
    }
};

// Generic function to test connection to a provider
export const testProviderConnection = async (settings: AppSettings): Promise<boolean> => {
    try {
        switch (settings.provider) {
            case 'lmstudio':
                await fetchLMStudioModels(settings.config.lmstudio.baseUrl);
                return true;
            case 'ollama':
                await fetchOllamaModels(settings.config.ollama.baseUrl);
                return true;
            default:
                return true; // For API-based providers, we'll test during actual usage
        }
    } catch (error) {
        return false;
    }
};

// Function to get detailed info about a specific model from LMStudio
export const getLMStudioModelInfo = async (baseUrl: string, modelId: string): Promise<any> => {
    try {
        const apiBaseUrl = getApiBaseUrl(baseUrl);
        const url = `${apiBaseUrl}/api/v0/models/${encodeURIComponent(modelId)}`;
        
        console.log(`Fetching LMStudio model info for: ${modelId}`);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('LMStudio model info:', data);
        
        return data;
    } catch (error) {
        console.error('Error fetching LMStudio model info:', error);
        throw error;
    }
};

// Function to generate text completions using LMStudio native API
export const generateLMStudioCompletion = async (
    baseUrl: string, 
    model: string, 
    prompt: string, 
    options: {
        temperature?: number;
        max_tokens?: number;
        stop?: string | string[];
        stream?: boolean;
    } = {}
): Promise<any> => {
    try {
        const apiBaseUrl = getApiBaseUrl(baseUrl);
        const url = `${apiBaseUrl}/api/v0/completions`;
        
        const requestBody = {
            model: model.replace(/ 🟢| ⚪| \([^)]*\)/g, ''), // Clean model name
            prompt,
            temperature: options.temperature || 0.7,
            max_tokens: options.max_tokens || -1,
            stream: options.stream || false,
            ...(options.stop && { stop: options.stop })
        };
        
        console.log(`LMStudio completion request:`, requestBody);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(30000)
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }
        
        const data = await response.json();
        console.log('LMStudio completion response:', data);
        
        return data;
    } catch (error) {
        console.error('Error generating LMStudio completion:', error);
        throw error;
    }
};

// Function to generate embeddings using LMStudio native API
export const generateLMStudioEmbeddings = async (
    baseUrl: string,
    model: string,
    input: string | string[]
): Promise<any> => {
    try {
        const apiBaseUrl = getApiBaseUrl(baseUrl);
        const url = `${apiBaseUrl}/api/v0/embeddings`;
        
        const requestBody = {
            model: model.replace(/ 🟢| ⚪| \([^)]*\)/g, ''), // Clean model name
            input
        };
        
        console.log(`LMStudio embeddings request:`, requestBody);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(30000)
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText}`);
        }
        
        const data = await response.json();
        console.log('LMStudio embeddings response:', data);
        
        return data;
    } catch (error) {
        console.error('Error generating LMStudio embeddings:', error);
        throw error;
    }
};