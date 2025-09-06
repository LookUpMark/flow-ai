
import { GoogleGenAI } from "@google/genai";
import { STAGE_PROMPTS } from '../constants';
import type { Stage } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const runStage = async (promptTemplate: string, previousOutput: string, topic: string): Promise<string> => {
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
                // A higher temperature can be good for creative/transformative tasks like this
                temperature: 0.6,
            }
        });
        
        // Use the safe .text accessor
        const text = response.text;
        if (typeof text !== 'string' || !text.trim()) {
            throw new Error('Received an empty or invalid response from the API.');
        }

        // Clean up potential markdown code block fences from the response
        return text.replace(/^```markdown\s*/, '').replace(/```\s*$/, '').trim();

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error(`API call failed: ${error instanceof Error ? error.message : String(error)}`);
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
};
