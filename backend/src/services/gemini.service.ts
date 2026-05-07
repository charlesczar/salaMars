import ai from '../config/gemini.client.js';
import { SYSTEM_INSTRUCTION } from '../utils/gemini.prompts.js';

export class GeminiRequestError extends Error {
    status?: string;
    code?: number | string;
    raw?: unknown;

    constructor(message: string, details?: { status?: string; code?: number | string; raw?: unknown }) {
        super(message);
        this.name = 'GeminiRequestError';

        if (details?.status !== undefined) {
            this.status = details.status;
        }

        if (details?.code !== undefined) {
            this.code = details.code;
        }

        if (details?.raw !== undefined) {
            this.raw = details.raw;
        }
    }
}

function formatGeminiError(error: unknown): GeminiRequestError {
    if (error instanceof GeminiRequestError) {
        return error;
    }

    if (error instanceof Error) {
        try {
            const parsed = JSON.parse(error.message);
            const apiError = parsed?.error ?? parsed;
            const code = apiError?.code ?? apiError?.statusCode;
            const status = apiError?.status ?? apiError?.statusText;
            const message = apiError?.message ?? error.message;
            const label = [code, status].filter((value) => value !== undefined && value !== null && String(value).trim() !== '').join(' ');

            return new GeminiRequestError(
                `Gemini API error${label ? ` [${label}]` : ''}: ${message}`,
                { code, status, raw: parsed }
            );
        } catch {
            return new GeminiRequestError(error.message || 'Unknown Gemini error', { raw: error });
        }
    }

    return new GeminiRequestError('Unknown Gemini error', { raw: error });
}

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
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.3,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json',
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
                throw new GeminiRequestError(`Gemini returned invalid JSON: ${raw}`, { raw });
            }
        }

    } catch (error: any) {
        throw formatGeminiError(error);
    }
}