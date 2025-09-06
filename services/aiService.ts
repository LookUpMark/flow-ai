import { GoogleGenAI } from "@google/genai";
import { STAGE_PROMPTS } from '../constants';
import type { Stage, ModelConfigType, AppSettings } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Gemini provider will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

const generateWithGemini = async (prompt: string, modelConfig: ModelConfigType, temperature: number): Promise<string> => {
    const genAIConfig: { temperature: number; thinkingConfig?: { thinkingBudget: number } } = { temperature };
    if (modelConfig === 'flash') {
        genAIConfig.thinkingConfig = { thinkingBudget: 0 };
    }
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: genAIConfig
    });
    return response.text;
};

const generateWithOpenRouter = async (prompt: string, settings: AppSettings, temperature: number): Promise<string> => {
    const { apiKey, model } = settings.config.openrouter;
    if (!apiKey || !model) throw new Error("OpenRouter API key and model must be configured in settings.");
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://obsidian-knowledge-architect.web.app', // Required by OpenRouter
            'X-Title': 'Obsidian Knowledge Architect', // Required by OpenRouter
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: temperature,
        })
    });
    if (!response.ok) throw response;
    const data = await response.json();
    return data.choices[0].message.content;
};

const generateWithOllama = async (prompt: string, settings: AppSettings, temperature: number): Promise<string> => {
    const { baseUrl, model } = settings.config.ollama;
    if (!baseUrl || !model) throw new Error("Ollama Base URL and model must be configured in settings.");

    const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false,
            options: { temperature },
        })
    });
    if (!response.ok) throw response;
    const data = await response.json();
    return data.response;
};

const generateText = async (prompt: string, settings: AppSettings, modelConfig: ModelConfigType, temperature: number): Promise<string> => {
    const apiCall = () => {
        switch (settings.provider) {
            case 'gemini':
                return generateWithGemini(prompt, modelConfig, temperature);
            case 'openrouter':
                return generateWithOpenRouter(prompt, settings, temperature);
            case 'ollama':
                return generateWithOllama(prompt, settings, temperature);
            default:
                throw new Error(`Unsupported provider: ${settings.provider}`);
        }
    };
    return withRetry(apiCall, `generateText(provider=${settings.provider})`);
};

const runStage = async (promptTemplate: string, previousOutput: string, topic: string, outputIsHtml: boolean, modelConfig: ModelConfigType, settings: AppSettings): Promise<string> => {
    const fullPrompt = `CONTEXT TOPIC: "${topic}"\n---\n${promptTemplate}\n---\nPREVIOUS STAGE CONTENT TO PROCESS:\n\`\`\`markdown\n${previousOutput}\n\`\`\``;
    const temperature = outputIsHtml ? 0.2 : 0.6;
    const text = await generateText(fullPrompt, settings, modelConfig, temperature);

    if (typeof text !== 'string' || !text.trim()) {
        throw new Error('Received an empty or invalid response from the API.');
    }
    if (outputIsHtml) {
        return text.replace(/^```html\s*/, '').replace(/```\s*$/, '').trim();
    }
    return text.replace(/^```markdown\s*/, '').replace(/```\s*$/, '').trim();
};

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
    
    const apiCall = () => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
    });
    
    const response = await withRetry(apiCall, 'generateDiagramImage');
    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error("Image generation returned no data.");
    return base64ImageBytes;
};

const runDiagramGeneratorStage = async (markdownContent: string, modelConfig: ModelConfigType, settings: AppSettings): Promise<string> => {
    const mermaidRegex = /```mermaid\r?\n([\s\S]*?)\r?\n```/g;
    const parts = markdownContent.split(mermaidRegex);
    if (parts.length <= 1) return markdownContent;

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
    return result;
};

export const generateTitle = async (content: string, modelConfig: ModelConfigType, settings: AppSettings): Promise<string> => {
    if (!content.trim()) throw new Error("Cannot generate a title from empty content.");
    const prompt = `**Role:** You are a "Title Architect". Your task is to create a clear, concise, and descriptive title for a knowledge base note.\n**Input:** A body of raw text.\n**Directives:**\n1. Analyze the provided text to understand its main subject and key concepts.\n2. Generate a title that accurately summarizes the content.\n3. The title should be suitable for a system like Obsidian or a personal knowledge base.\n4. **Strict Output Format:** Your entire response must be *only* the raw text of the title.\n---\nTEXT TO ANALYZE:\n\`\`\`\n${content}\n\`\`\``;
    const text = await generateText(prompt, settings, modelConfig, 0.4);
    if (typeof text !== 'string' || !text.trim()) throw new Error('Received an empty or invalid response from the API.');
    return text.trim();
};

export const runKnowledgePipeline = async (
    rawInput: string,
    topic: string,
    updateCallback: (stage: Stage, data: string) => void,
    generateDiagrams: boolean,
    generateHtmlPreview: boolean,
    modelConfig: ModelConfigType,
    settings: AppSettings
): Promise<void> => {
    let currentContent = rawInput;

    // FIX: Explicitly type the pipeline stages to ensure `stage` is of type `Stage`, not `string`.
    const pipelineStages: { stage: Stage; prompt: string }[] = [
        { stage: 'synthesizer', prompt: STAGE_PROMPTS.synthesizer },
        { stage: 'condenser', prompt: STAGE_PROMPTS.condenser },
        { stage: 'enhancer', prompt: STAGE_PROMPTS.enhancer },
        { stage: 'mermaidValidator', prompt: STAGE_PROMPTS.mermaidValidator },
        { stage: 'finalizer', prompt: STAGE_PROMPTS.finalizer },
    ];
    
    for (const { stage, prompt } of pipelineStages) {
        try {
            updateCallback(stage, '');
            currentContent = await runStage(prompt, currentContent, topic, false, modelConfig, settings);
            updateCallback(stage, currentContent);
        } catch (error) {
            throw new PipelineError(`Error during the '${stage}' stage`, stage, error);
        }
    }

    if (generateDiagrams) {
        try {
            updateCallback('diagramGenerator', '');
            const finalMarkdownWithDiagrams = await runDiagramGeneratorStage(currentContent, modelConfig, settings);
            updateCallback('diagramGenerator', finalMarkdownWithDiagrams);
            currentContent = finalMarkdownWithDiagrams;
        } catch (error) {
            throw new PipelineError("Error generating diagram images", 'diagramGenerator', error);
        }
    } else {
        updateCallback('diagramGenerator', 'Skipped');
    }

    if (generateHtmlPreview) {
        try {
            updateCallback('htmlTranslator', '');
            const finalHtml = await runStage(STAGE_PROMPTS.htmlTranslator, currentContent, topic, true, modelConfig, settings);
            updateCallback('htmlTranslator', finalHtml);
        } catch (error) {
            throw new PipelineError("Error generating HTML preview", 'htmlTranslator', error);
        }
    } else {
        updateCallback('htmlTranslator', 'Skipped');
    }
};