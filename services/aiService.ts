// FIX: Import GenerateImagesResponse to correctly type the response from the image generation API.
import { GoogleGenAI, GenerateImagesResponse } from "@google/genai";
import { STAGE_PROMPTS } from '../constants';
import type { Stage, ModelConfigType, AppSettings } from '../types';

const getGeminiClient = (settings: AppSettings) => {
    const apiKey = settings.config.gemini.apiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not configured. Please set it in the application settings.");
    }
    return new GoogleGenAI({ apiKey });
};

export class PipelineError extends Error {
    constructor(
        message: string,
        public readonly stage: Stage,
        public readonly originalError?: any
    ) {
        super(message);
        this.name = 'PipelineError';
    }
}

const parseApiError = async (error: unknown): Promise<string> => {
    if (error instanceof Error) {
        try {
            const match = error.message.match(/{.*}/s);
            if (match && match[0]) {
                const errorJson = JSON.parse(match[0]);
                return errorJson.error?.message || error.message;
            }
        } catch (e) { /* Fallback to original message */ }
        return error.message;
    }
    if (error instanceof Response) {
        try {
            const errorBody = await error.json();
            return errorBody.error?.message || errorBody.error || `Request failed with status ${error.status}`;
        } catch (e) {
            return `Request failed with status ${error.status}: ${error.statusText}`;
        }
    }
    return String(error);
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(apiCall: () => Promise<T>, operationName: string): Promise<T> => {
    const MAX_RETRIES = 3;
    let lastError: Error | Response | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            const errorMessage = await parseApiError(error);
            lastError = error instanceof Response ? error : new Error(errorMessage);
            console.error(`Attempt ${attempt + 1} failed for ${operationName}:`, errorMessage);

            const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('RESOURCE_EXHAUSTED');
            
            if (isRateLimitError && attempt < MAX_RETRIES - 1) {
                const backoffTime = 2000 * Math.pow(2, attempt); // 2s, 4s, 8s
                console.log(`Rate limit hit for ${operationName}. Retrying in ${backoffTime / 1000}s...`);
                await delay(backoffTime);
            } else {
                break;
            }
        }
    }
    throw lastError!;
};

// Non-streaming version for single-shot generations like titles.
const generateText = async (prompt: string, settings: AppSettings, modelConfig: ModelConfigType, baseTemperature: number): Promise<string> => {
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
                const ai = getGeminiClient(settings);
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: genAIConfig });
                return response.text;
            }
            case 'openrouter': {
                const { apiKey, selectedModel: model } = settings.config.openrouter;
                if (!apiKey || !model) throw new Error("OpenRouter API key and model must be configured in settings.");
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://obsidian-knowledge-architect.web.app', 'X-Title': 'Obsidian Knowledge Architect' },
                    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: effectiveTemperature, stream: false })
                });
                if (!response.ok) throw response;
                const data = await response.json();
                return data.choices[0].message.content;
            }
            case 'ollama': {
                const { baseUrl, selectedModel: model } = settings.config.ollama;
                if (!baseUrl || !model) throw new Error("Ollama Base URL and model must be configured in settings.");
                const response = await fetch(`${baseUrl}/api/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model, prompt, stream: false, options: { temperature: effectiveTemperature } })
                });
                if (!response.ok) throw response;
                const data = await response.json();
                return data.response;
            }
            default:
                throw new Error(`Unsupported provider: ${settings.provider}`);
        }
    };
    return withRetry(apiCall, `generateText(provider=${settings.provider})`);
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
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://obsidian-knowledge-architect.web.app', 'X-Title': 'Obsidian Knowledge Architect' },
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
        default:
            throw new Error(`Unsupported provider for streaming: ${settings.provider}`);
    }
}

const createDiagramPrompt = async (mermaidCode: string, modelConfig: ModelConfigType, settings: AppSettings): Promise<string> => {
    const prompt = `**Role:** You are a "Diagram Describer". Your task is to convert Mermaid.js code into a detailed, descriptive text prompt that an image generation AI can understand.\n**Directives:**\n1. Analyze the provided Mermaid.js code to understand the structure, components, and relationships of the diagram.\n2. Describe the diagram in natural language. Be specific about the shapes, text, arrows, and layout.\n3. The description should be a single, coherent paragraph.\n4. Focus on the visual representation.\n5. The final output should be a prompt that starts with "A diagram of...".\n6. **Strict Output Format:** Your entire response must be *only* the raw text of the prompt. Do not include any conversational text or comments.\n---\nMERMAID CODE TO DESCRIBE:\n\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
    const text = await generateText(prompt, settings, modelConfig, 0.2);
    if (typeof text !== 'string' || !text.trim()) {
        throw new Error('Received an empty response when creating diagram prompt.');
    }
    return text.trim();
};

const generateDiagramImage = async (mermaidCode: string, modelConfig: ModelConfigType, settings: AppSettings): Promise<string> => {
    const descriptivePrompt = await createDiagramPrompt(mermaidCode, modelConfig, settings);
    const finalPrompt = `${descriptivePrompt}. Minimalist vector art style. Clean lines, simple shapes, and a light, neutral background. High-contrast, easy-to-read text.`;
    
    const apiCall = (): Promise<GenerateImagesResponse> => {
        const ai = getGeminiClient(settings);
        return ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
    };
    
    const response = await withRetry(apiCall, 'generateDiagramImage');
    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error("Image generation returned no data.");
    return base64ImageBytes;
};

export const generateTitle = async (content: string, modelConfig: ModelConfigType, settings: AppSettings): Promise<string> => {
    if (!content.trim()) throw new Error("Cannot generate a title from empty content.");
    const prompt = `**Role:** You are a "Title Architect". Your task is to create a clear, concise, and descriptive title for a knowledge base note.\n**Input:** A body of raw text.\n**Directives:**\n1. Analyze the provided text to understand its main subject and key concepts.\n2. Generate a title that accurately summarizes the content.\n3. The title should be suitable for a system like Obsidian or a personal knowledge base.\n4. **Strict Output Format:** Your entire response must be *only* the raw text of the title.\n---\nTEXT TO ANALYZE:\n\`\`\`\n${content}\n\`\`\``;
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
    generateDiagrams: boolean,
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

    if (generateDiagrams) {
        try {
            yield { type: 'stage_start', stage: 'diagramGenerator' };
            const mermaidRegex = /```mermaid\r?\n([\s\S]*?)\r?\n```/g;
            const parts = currentContent.split(mermaidRegex);
            if (parts.length > 1) {
                const mermaidCodes = parts.filter((_, i) => i % 2 === 1);
                const textParts = parts.filter((_, i) => i % 2 === 0);
                const base64Images: string[] = [];

                for (const code of mermaidCodes) {
                    const image = await generateDiagramImage(code, modelConfig, settings);
                    base64Images.push(image);
                    if (mermaidCodes.length > 1) await delay(1500);
                }
                let result = textParts[0];
                for (let i = 0; i < base64Images.length; i++) {
                    result += `![Mermaid Diagram](data:image/jpeg;base64,${base64Images[i]})` + textParts[i + 1];
                }
                currentContent = result;
            }
            yield { type: 'chunk', stage: 'diagramGenerator', content: currentContent };
            yield { type: 'stage_end', stage: 'diagramGenerator', fullContent: currentContent };
        } catch (error) {
            throw new PipelineError("Error generating diagram images", 'diagramGenerator', error);
        }
    } else {
        yield { type: 'skipped', stage: 'diagramGenerator' };
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