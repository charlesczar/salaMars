import ai from '../config/gemini.client.js';
import { SYSTEM_INSTRUCTION } from '../utils/gemini.prompts.js';

function extractJsonPayload(raw: string): string {
    const cleaned = raw.replace(/```json|```/g, '').trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return cleaned;
    }

    return cleaned.slice(firstBrace, lastBrace + 1);
}

function tryRepairJson(raw: string): string {
    const braceOpenCount = (raw.match(/\{/g) ?? []).length;
    const braceCloseCount = (raw.match(/\}/g) ?? []).length;

    let repaired = raw;

    if (braceCloseCount < braceOpenCount) {
        repaired += '}'.repeat(braceOpenCount - braceCloseCount);
    }

    const quoteCount = (repaired.match(/"/g) ?? []).length;
    if (quoteCount % 2 !== 0) {
        repaired += '"';
    }

    return repaired;
}

export async function askGemini(prompt: string): Promise<any> {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.3,
            maxOutputTokens: 800,
        },
    });

    const raw = response.text ?? "";
    const cleaned = extractJsonPayload(raw);

    try {
        return JSON.parse(cleaned);
    } catch {
        const repaired = tryRepairJson(cleaned);

        try {
            return JSON.parse(repaired);
        } catch {
            throw new Error(`Gemini returned invalid JSON: ${raw}`);
        }
    }
}