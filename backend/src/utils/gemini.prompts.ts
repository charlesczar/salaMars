import type { Language } from "../constants/languages.js";

// @desc System instruction for Gemini to act as a medicine information assistant
export const SYSTEM_INSTRUCTION = `
You are a medicine information assistant for a Philippine pharmacy app.

STRICT RULES:
- ONLY use the medicine data provided. Nothing else.
- Do NOT add outside medical knowledge.
- Do NOT diagnose or recommend prescriptions.
- Do NOT modify or omit warnings.
- If a field is missing, respond with: "Not available in the database."

`.trim();

// @desc Build prompt for Gemini to explain medicine info based on database context
function formatValue(value: string | string[] | boolean | undefined): string {
    if (value === undefined || value === null) {
        return "Not available in the database.";
    }

    if (typeof value === "boolean") {
        return value ? "Available over-the-counter." : "Requires prescription.";
    }

    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(", ") : "Not available in the database.";
    }

    const normalized = value.replace(/\s+/g, ' ').trim();
    return normalized ? normalized : "Not available in the database.";
}

function describeLanguagePreference(language: Language): string {
    switch (language) {
        case 'english':
            return 'English';
        case 'filipino':
            return 'Filipino';
        case 'taglish':
            return 'Taglish (mixed Filipino and English)';
        case 'bisaya':
            return 'Bisaya';
    }
}

// TO DO: Add a param for custom language preference of the user (Taglish, Filipino, English)
export function buildExplainPrompt(med: any, language: Language, searchContext?: { query: string; matchedOn?: 'brand' | 'generic' | 'exact' | 'other' }): string {
    const queryLine = searchContext?.query ? `User searched for: ${searchContext.query}` : '';
    const matchLine = searchContext?.matchedOn === 'brand'
        ? 'The user searched using a brand name. Mention that clearly and also state the generic/active medicine name.'
        : searchContext?.matchedOn === 'generic'
            ? 'The user searched using a generic name. Mention that clearly and also state any common brand name if available.'
            : 'If the search term differs from the medicine record name, clarify the relationship in plain language.';
    const languageLine = describeLanguagePreference(language);

    return `
        MEDICINE DATA:
        Name: ${formatValue(med.name)}
        Generic Name: ${formatValue(med.genericName)}
        Uses: ${formatValue(med.uses)}            
        Side Effects: ${formatValue(med.sideEffects)}
        Warnings: ${formatValue(med.warnings)}
        Contraindications: ${formatValue(med.contraindications)}
        OTC: ${formatValue(med.otc)}

        Note: Strictly follow the language preference set by the user.
        LANGUAGE PREFERENCE: Respond in ${languageLine}.
        AUDIENCE: Ordinary Filipinos with no medical background.
        ${queryLine}
        MATCH CONTEXT: ${matchLine}

        FORMAT:
        Return ONLY a raw JSON object (no markdown, no code fences, no extra text):
        {    
            "summary": "...",
            "uses": "...",
            "warnings": "...",
            "sideEffects": "...",
            "whenToUse": "...",
            "whenToAvoid": "..."
        }

        Rules:
        - Keep each value to one sentence or short paragraph.
        - Do not use markdown, bullets, or code fences.
        - Do not add newline characters inside any string.
        - State the medicine availability clearly inside "summary" only.
        - When the user searched a brand name, say that it is the brand name for the generic medicine, instead of presenting the generic name as if it were the search term.
        - When the user searched a generic name, keep the generic name as the main term and mention brand names only as helpful context.
        - If OTC, say "Available over-the-counter." If prescription-only, say "Requires prescription."
    `;
}