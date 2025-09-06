
import { GoogleGenAI } from "@google/genai";
import { STAGE_PROMPTS } from '../constants';
import type { Stage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const runStage = async (promptTemplate: string, previousOutput: string, topic: string, outputIsHtml: boolean = false): Promise<string> => {
    const fullPrompt = `
        CONTEXT TOPIC: "${topic}"
        ---
        ${promptTemplate}
        ---
        PREVIOUS STAGE CONTENT TO PROCESS:
        \`\`\`markdown
        ${previousOutput}
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                // Lower temperature for more precise HTML/CSS generation, higher for creative markdown tasks
                temperature: outputIsHtml ? 0.2 : 0.6,
            }
        });
        
        // Use the safe .text accessor
        const text = response.text;
        if (typeof text !== 'string' || !text.trim()) {
            throw new Error('Received an empty or invalid response from the API.');
        }

        if (outputIsHtml) {
            return text.replace(/^```html\s*/, '').replace(/```\s*$/, '').trim();
        }
        // Clean up potential markdown code block fences from the response
        return text.replace(/^```markdown\s*/, '').replace(/```\s*$/, '').trim();

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`API call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const generateTitle = async (content: string): Promise<string> => {
    if (!content.trim()) {
        throw new Error("Cannot generate a title from empty content.");
    }
    
    const prompt = `
        **Role:** You are a "Title Architect". Your task is to create a clear, concise, and descriptive title for a knowledge base note.
        **Input:** A body of raw text.
        **Directives:**
        1. Analyze the provided text to understand its main subject and key concepts.
        2. Generate a title that accurately summarizes the content.
        3. The title should be suitable for a system like Obsidian or a personal knowledge base.
        4. **Strict Output Format:** Your entire response must be *only* the raw text of the title. Do not include any conversational text, quotation marks, headings, or comments like "Here is the generated title".
        
        ---
        TEXT TO ANALYZE:
        \`\`\`
        ${content}
        \`\`\`
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.4, // Lower temperature for more deterministic/factual titling
            }
        });

        const text = response.text;
        if (typeof text !== 'string' || !text.trim()) {
            throw new Error('Received an empty or invalid response from the API.');
        }

        return text.trim();

    } catch (error) {
        console.error("Error calling Gemini API for title generation:", error);
        throw new Error(`Title generation API call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};


export const runKnowledgePipeline = async (
    rawInput: string,
    topic: string,
    updateCallback: (stage: Stage, data: string) => void
): Promise<void> => {
    let currentContent = rawInput;

    // Stage 1: Synthesizer
    updateCallback('synthesizer', ''); // Signal start
    currentContent = await runStage(STAGE_PROMPTS.synthesizer, currentContent, topic);
    updateCallback('synthesizer', currentContent);

    // Stage 2: Condenser
    updateCallback('condenser', ''); // Signal start
    currentContent = await runStage(STAGE_PROMPTS.condenser, currentContent, topic);
    updateCallback('condenser', currentContent);

    // Stage 3: Enhancer
    updateCallback('enhancer', ''); // Signal start
    currentContent = await runStage(STAGE_PROMPTS.enhancer, currentContent, topic);
    updateCallback('enhancer', currentContent);
    
    // Stage 4: Mermaid Validator
    updateCallback('mermaidValidator', ''); // Signal start
    currentContent = await runStage(STAGE_PROMPTS.mermaidValidator, currentContent, topic);
    updateCallback('mermaidValidator', currentContent);

    // Stage 5: Finalizer
    updateCallback('finalizer', ''); // Signal start
    currentContent = await runStage(STAGE_PROMPTS.finalizer, currentContent, topic);
    updateCallback('finalizer', currentContent);

    // Stage 6: HTML Translator
    updateCallback('htmlTranslator', ''); // Signal start
    const finalMarkdown = currentContent;
    currentContent = await runStage(STAGE_PROMPTS.htmlTranslator, finalMarkdown, topic, true);
    updateCallback('htmlTranslator', currentContent);
};