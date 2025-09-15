// FIX: Import GenerateImagesResponse to correctly type the response from the image generation API.
import { GoogleGenAI, GenerateImagesResponse } from "@google/genai";
import { STAGE_PROMPTS } from '../constants';
import type { Stage, ModelConfigType, AppSettings } from '../types';
import { errorManager, createApiError, createProcessingError, ERROR_CODES } from './errorService';
import { loggingService, logApiCall, logPerformanceMetric } from './loggingService';

// Utility function for delays in retry logic
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

const getGeminiClient = (settings: AppSettings) => {
    const apiKey = settings.config.gemini.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        const error = createApiError(
            "Gemini API key is not configured. Please set it in the application settings.",
            undefined,
            { provider: 'gemini', configPath: 'config.gemini.apiKey' }
        );
        throw new Error(error.message);
    }
    
    loggingService.debug('Gemini client initialized', 'api', 'initialization', {
        provider: 'gemini',
        hasApiKey: !!apiKey
    });
    
    return new GoogleGenAI({ apiKey });
};

export class PipelineError extends Error {
    constructor(
        message: string,
        public readonly stage: Stage,
        public readonly originalError?: any,
        public readonly enhancedError?: any
    ) {
        super(message);
        this.name = 'PipelineError';
        
        // Create enhanced error for better tracking
        if (!enhancedError) {
            this.enhancedError = createProcessingError(
                message,
                stage,
                originalError,
                { pipelineStage: stage }
            );
        }
    }
}

const parseApiError = async (error: unknown, context: { provider?: string; endpoint?: string; operation?: string } = {}): Promise<{ message: string; enhancedError: any }> => {
    let message = 'Unknown error occurred';
    let enhancedError;
    
    if (error instanceof Error) {
        try {
            const match = error.message.match(/{.*}/s);
            if (match && match[0]) {
                const errorJson = JSON.parse(match[0]);
                message = errorJson.error?.message || error.message;
            } else {
                message = error.message;
            }
        } catch (e) {
            message = error.message;
        }
        
        enhancedError = createApiError(message, error, {
            provider: context.provider,
            endpoint: context.endpoint,
            operation: context.operation,
            originalErrorType: error.constructor.name
        });
    } else if (error instanceof Response) {
        try {
            const errorBody = await error.json();
            message = errorBody.error?.message || errorBody.error || `Request failed with status ${error.status}`;
        } catch (e) {
            message = `Request failed with status ${error.status}: ${error.statusText}`;
        }
        
        enhancedError = createApiError(message, error, {
            provider: context.provider,
            endpoint: context.endpoint,
            operation: context.operation,
            httpStatus: error.status,
            httpStatusText: error.statusText
        });
    } else {
        message = String(error);
        enhancedError = createApiError(message, error, context);
    }
    
    return { message, enhancedError };
};



const withRetry = async <T>(apiCall: () => Promise<T>, operationName: string, context: { provider?: string; stage?: Stage } = {}): Promise<T> => {
    const MAX_RETRIES = 3;
    let lastError: Error | Response | null = null;
    let lastEnhancedError: any = null;
    
    const startTime = performance.now();
    loggingService.startPerformanceTracking(`retry_${operationName}`, {
        operation: operationName,
        maxRetries: MAX_RETRIES,
        provider: context.provider
    });

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const result = await apiCall();
            
            // Log successful completion
            const duration = performance.now() - startTime;
            logApiCall(operationName, 'POST', duration, 200, {
                attempt: attempt + 1,
                provider: context.provider,
                stage: context.stage
            });
            
            loggingService.endPerformanceTracking(`retry_${operationName}`, {
                success: true,
                attempts: attempt + 1
            });
            
            return result;
        } catch (error) {
            const { message: errorMessage, enhancedError } = await parseApiError(error, {
                provider: context.provider,
                operation: operationName
            });
            
            lastError = error instanceof Response ? error : new Error(errorMessage);
            lastEnhancedError = enhancedError;
            
            loggingService.warn(
                `Attempt ${attempt + 1} failed for ${operationName}: ${errorMessage}`,
                'api',
                'retry',
                {
                    attempt: attempt + 1,
                    maxRetries: MAX_RETRIES,
                    operation: operationName,
                    provider: context.provider,
                    stage: context.stage,
                    errorCode: enhancedError.code
                }
            );

            const isRetryableError = errorMessage.includes('429') || 
                                    errorMessage.includes('rate limit') || 
                                    errorMessage.includes('RESOURCE_EXHAUSTED') ||
                                    errorMessage.includes('503') ||
                                    errorMessage.includes('UNAVAILABLE') ||
                                    errorMessage.includes('overloaded') ||
                                    errorMessage.includes('temporarily unavailable');
            
            if (isRetryableError && attempt < MAX_RETRIES - 1) {
                const backoffTime = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
                const errorType = errorMessage.includes('429') || errorMessage.includes('rate limit') ? 'rate_limit' : 'service_unavailable';
                const logMessage = errorType === 'rate_limit' 
                    ? `Rate limit hit for ${operationName}. Retrying in ${backoffTime / 1000}s...`
                    : `Service temporarily unavailable for ${operationName}. Retrying in ${backoffTime / 1000}s...`;
                
                loggingService.info(
                    logMessage,
                    'api',
                    errorType,
                    {
                        operation: operationName,
                        backoffTime,
                        attempt: attempt + 1,
                        provider: context.provider,
                        errorType
                    }
                );
                await delay(backoffTime);
            } else {
                break;
            }
        }
    }
    
    // Log final failure
    const duration = performance.now() - startTime;
    logApiCall(operationName, 'POST', duration, 500, {
        failed: true,
        attempts: MAX_RETRIES,
        provider: context.provider,
        stage: context.stage,
        finalError: lastEnhancedError?.code
    });
    
    loggingService.endPerformanceTracking(`retry_${operationName}`, {
        success: false,
        attempts: MAX_RETRIES,
        finalErrorCode: lastEnhancedError?.code
    });
    
    throw lastError!;
};

// Non-streaming version for single-shot generations like titles.
const generateText = async (prompt: string, settings: AppSettings, modelConfig: ModelConfigType, baseTemperature: number): Promise<string> => {
    const operationId = `generateText_${Date.now()}`;
    loggingService.startPerformanceTracking(operationId, {
        provider: settings.provider,
        modelConfig,
        promptLength: prompt.length,
        temperature: baseTemperature
    });
    
    let effectiveTemperature = baseTemperature;
    const genAIConfig: { temperature: number; thinkingConfig?: { thinkingBudget: number } } = { temperature: effectiveTemperature };
    
    if (!settings.reasoningModeEnabled) {
        if (settings.provider === 'gemini' && modelConfig === 'flash') {
            genAIConfig.thinkingConfig = { thinkingBudget: 0 };
        } else if (settings.provider === 'openrouter') {
            effectiveTemperature = 0.1;
        }
    }
    
    const apiCall = async (): Promise<string> => {
        switch (settings.provider) {
            case 'gemini': {
                try {
                    const ai = getGeminiClient(settings);
                    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: genAIConfig });
                    
                    loggingService.info('Gemini API call successful', 'api', 'generation', {
                        model: 'gemini-2.5-flash',
                        responseLength: response.text?.length || 0,
                        temperature: genAIConfig.temperature
                    });
                    
                    return response.text;
                } catch (error) {
                    const enhancedError = createApiError(
                        'Failed to generate text with Gemini',
                        error,
                        {
                            provider: 'gemini',
                            model: 'gemini-2.5-flash',
                            operation: 'generateContent',
                            promptLength: prompt.length
                        }
                    );
                    throw error;
                }
            }
            case 'openrouter': {
                const { apiKey, selectedModel: model } = settings.config.openrouter;
                if (!apiKey || !model) {
                    const error = createApiError(
                        "OpenRouter API key and model must be configured in settings.",
                        undefined,
                        { provider: 'openrouter', missingConfig: !apiKey ? 'apiKey' : 'selectedModel' }
                    );
                    throw new Error(error.message);
                }
                
                try {
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://flowai.web.app', 'X-Title': 'FlowAI' },
                        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: effectiveTemperature, stream: false })
                    });
                    
                    if (!response.ok) throw response;
                    const data = await response.json();
                    
                    loggingService.info('OpenRouter API call successful', 'api', 'generation', {
                        model,
                        responseLength: data.choices[0]?.message?.content?.length || 0,
                        temperature: effectiveTemperature,
                        usage: data.usage
                    });
                    
                    return data.choices[0].message.content;
                } catch (error) {
                    const enhancedError = createApiError(
                        'Failed to generate text with OpenRouter',
                        error,
                        {
                            provider: 'openrouter',
                            model,
                            endpoint: 'chat/completions',
                            promptLength: prompt.length
                        }
                    );
                    throw error;
                }
            }
            case 'ollama': {
                const { baseUrl, selectedModel: model } = settings.config.ollama;
                if (!baseUrl || !model) {
                    const error = createApiError(
                        "Ollama Base URL and model must be configured in settings.",
                        undefined,
                        { provider: 'ollama', missingConfig: !baseUrl ? 'baseUrl' : 'selectedModel' }
                    );
                    throw new Error(error.message);
                }
                
                try {
                    const response = await fetch(`${baseUrl}/api/generate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model, prompt, stream: false, options: { temperature: effectiveTemperature } })
                    });
                    
                    if (!response.ok) throw response;
                    const data = await response.json();
                    
                    loggingService.info('Ollama API call successful', 'api', 'generation', {
                        model,
                        baseUrl,
                        responseLength: data.response?.length || 0,
                        temperature: effectiveTemperature
                    });
                    
                    return data.response;
                } catch (error) {
                    const enhancedError = createApiError(
                        'Failed to generate text with Ollama',
                        error,
                        {
                            provider: 'ollama',
                            model,
                            baseUrl,
                            endpoint: '/api/generate',
                            promptLength: prompt.length
                        }
                    );
                    throw error;
                }
            }
            case 'zai': {
                const apiKey = settings.config.zai.apiKey;
                if (!apiKey) {
                    const error = createApiError(
                        "Z.ai API key is not configured. Please set it in the application settings.",
                        undefined,
                        { provider: 'zai', configPath: 'config.zai.apiKey' }
                    );
                    throw new Error(error.message);
                }

                try {
                    const model = 'gpt-4o'; // Fixed model for Z.ai
                    const response = await fetch("https://api.z.ai/v1/chat/completions", {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: effectiveTemperature, stream: false })
                    });

                    if (!response.ok) throw response;
                    const data = await response.json();

                    loggingService.info('Z.ai API call successful', 'api', 'generation', {
                        model,
                        responseLength: data.choices[0]?.message?.content?.length || 0,
                        temperature: effectiveTemperature,
                        usage: data.usage
                    });

                    return data.choices[0].message.content;
                } catch (error) {
                    const enhancedError = createApiError(
                        'Failed to generate text with Z.ai',
                        error,
                        {
                            provider: 'zai',
                            model: 'gpt-4o',
                            endpoint: 'chat/completions',
                            promptLength: prompt.length
                        }
                    );
                    throw error;
                }
            }
            default:
                const error = createApiError(
                    `Unsupported provider: ${settings.provider}`,
                    undefined,
                    { provider: settings.provider, supportedProviders: ['gemini', 'openrouter', 'ollama', 'zai'] }
                );
                throw new Error(error.message);
        }
    };
    
    try {
        const result = await withRetry(apiCall, `generateText(provider=${settings.provider})`, {
            provider: settings.provider
        });
        
        loggingService.endPerformanceTracking(operationId, {
            success: true,
            provider: settings.provider,
            resultLength: result.length
        });
        
        return result;
    } catch (error) {
        loggingService.endPerformanceTracking(operationId, {
            success: false,
            provider: settings.provider,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
};

async function* generateTextStream(prompt: string, settings: AppSettings, modelConfig: ModelConfigType, baseTemperature: number): AsyncGenerator<string> {
    let effectiveTemperature = baseTemperature;
    const genAIConfig: { temperature: number; thinkingConfig?: { thinkingBudget: number } } = { temperature: effectiveTemperature };
    
    if (!settings.reasoningModeEnabled) {
        if (settings.provider === 'gemini' && modelConfig === 'flash') {
            genAIConfig.thinkingConfig = { thinkingBudget: 0 };
        } else if (settings.provider === 'openrouter') {
            effectiveTemperature = 0.1;
        }
    }

    switch (settings.provider) {
        case 'gemini': {
            const ai = getGeminiClient(settings);
            const response = await ai.models.generateContentStream({ model: 'gemini-2.5-flash', contents: prompt, config: genAIConfig });
            for await (const chunk of response) {
                yield chunk.text;
            }
            break;
        }
        case 'openrouter': {
            const { apiKey, selectedModel: model } = settings.config.openrouter;
            if (!apiKey || !model) throw new Error("OpenRouter API key and model must be configured in settings.");
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://flowai.web.app', 'X-Title': 'FlowAI' },
                body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: effectiveTemperature, stream: true })
            });
            if (!response.ok || !response.body) throw response;
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
                for (const line of lines) {
                    const jsonStr = line.replace('data: ', '');
                    if (jsonStr === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        yield parsed.choices[0]?.delta?.content || '';
                    } catch (e) {
                        console.error("Failed to parse stream chunk:", jsonStr);
                    }
                }
            }
            break;
        }
        case 'ollama': {
            const { baseUrl, selectedModel: model } = settings.config.ollama;
            if (!baseUrl || !model) throw new Error("Ollama Base URL and model must be configured in settings.");
            const response = await fetch(`${baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt, stream: true, options: { temperature: effectiveTemperature } })
            });
            if (!response.ok || !response.body) throw response;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        yield parsed.response || '';
                    } catch (e) {
                         console.error("Failed to parse stream chunk:", line);
                    }
                }
            }
            break;
        }
        case 'zai': {
            const apiKey = settings.config.zai.apiKey;
            if (!apiKey) throw new Error("Z.ai API key is not configured. Please set it in the application settings.");
            const model = 'gpt-4o'; // Fixed model for Z.ai
            const response = await fetch("https://api.z.ai/v1/chat/completions", {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: effectiveTemperature, stream: true })
            });
            if (!response.ok || !response.body) throw response;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
                for (const line of lines) {
                    const jsonStr = line.replace('data: ', '');
                    if (jsonStr === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(jsonStr);
                        yield parsed.choices[0]?.delta?.content || '';
                    } catch (e) {
                        console.error("Failed to parse stream chunk:", jsonStr);
                    }
                }
            }
            break;
        }
        default:
            throw new Error(`Unsupported provider for streaming: ${settings.provider}`);
    }
}





export const generateTitle = async (content: string, modelConfig: ModelConfigType, settings: AppSettings): Promise<string> => {
    if (!content.trim()) throw new Error("Cannot generate a title from empty content.");
    const prompt = `**Role:** You are a "Title Architect". Your task is to create a clear, concise, and descriptive title for a knowledge base note.\n**Input:** A body of raw text.\n**CRITICAL LANGUAGE INSTRUCTION:** Detect the primary language of the input content and generate the title in that EXACT same language. If the input is in Italian, create an Italian title. If in English, create an English title. If in Spanish, create a Spanish title, etc. Maintain absolute linguistic consistency.\n**Directives:**\n1. Analyze the provided text to understand its main subject and key concepts.\n2. Generate a title that accurately summarizes the content.\n3. The title should be suitable for a system like Obsidian or a personal knowledge base.\n4. **Strict Output Format:** Your entire response must be *only* the raw text of the title.\n---\nTEXT TO ANALYZE:\n\`\`\`\n${content}\n\`\`\``;
    const text = await generateText(prompt, settings, modelConfig, 0.4);
    if (typeof text !== 'string' || !text.trim()) throw new Error('Received an empty or invalid response from the API.');
    return text.trim();
};

export type PipelineUpdate = 
    | { type: 'stage_start', stage: Stage }
    | { type: 'chunk', stage: Stage, content: string }
    | { type: 'stage_end', stage: Stage, fullContent: string }
    | { type: 'skipped', stage: Stage };

export async function* runKnowledgePipeline(
    rawInput: string,
    topic: string,

    generateHtmlPreview: boolean,
    modelConfig: ModelConfigType,
    settings: AppSettings
): AsyncGenerator<PipelineUpdate> {
    let currentContent = rawInput;
    const pipelineStages: { stage: Stage; prompt: string }[] = [
        { stage: 'synthesizer', prompt: STAGE_PROMPTS.synthesizer },
        { stage: 'condenser', prompt: STAGE_PROMPTS.condenser },
        { stage: 'enhancer', prompt: STAGE_PROMPTS.enhancer },
        { stage: 'mermaidValidator', prompt: STAGE_PROMPTS.mermaidValidator },
        { stage: 'finalizer', prompt: STAGE_PROMPTS.finalizer },
    ];
    
    for (const { stage, prompt } of pipelineStages) {
        try {
            yield { type: 'stage_start', stage };
            let stageOutput = '';
            const fullPrompt = `CONTEXT TOPIC: "${topic}"\n---\n${prompt}\n---\nPREVIOUS STAGE CONTENT TO PROCESS:\n\`\`\`markdown\n${currentContent}\n\`\`\``;
            const stream = generateTextStream(fullPrompt, settings, modelConfig, 0.6);
            for await (const chunk of stream) {
                const sanitizedChunk = chunk.replace(/^```(markdown|html)\s*|```\s*$/g, '');
                stageOutput += sanitizedChunk;
                yield { type: 'chunk', stage, content: sanitizedChunk };
            }
            currentContent = stageOutput.trim();
            yield { type: 'stage_end', stage, fullContent: currentContent };
        } catch (error) {
            throw new PipelineError(`Error during the '${stage}' stage`, stage, error);
        }
    }



    if (generateHtmlPreview) {
        try {
            yield { type: 'stage_start', stage: 'htmlTranslator' };
            let htmlOutput = '';
            const fullPrompt = `CONTEXT TOPIC: "${topic}"\n---\n${STAGE_PROMPTS.htmlTranslator}\n---\nPREVIOUS STAGE CONTENT TO PROCESS:\n\`\`\`markdown\n${currentContent}\n\`\`\``;
            const stream = generateTextStream(fullPrompt, settings, modelConfig, 0.2);
            for await (const chunk of stream) {
                const sanitizedChunk = chunk.replace(/^```(markdown|html)\s*|```\s*$/g, '');
                htmlOutput += sanitizedChunk;
                yield { type: 'chunk', stage: 'htmlTranslator', content: sanitizedChunk };
            }
            currentContent = htmlOutput.trim();
            yield { type: 'stage_end', stage: 'htmlTranslator', fullContent: currentContent };
        } catch (error) {
            throw new PipelineError("Error generating HTML preview", 'htmlTranslator', error);
        }
    } else {
        yield { type: 'skipped', stage: 'htmlTranslator' };
    }
}