// @desc System instruction for Gemini to act as a medicine information assistant
export const SYSTEM_INSTRUCTION = `
You are a medicine information assistant for a Philippine pharmacy app.

STRICT RULES:
- ONLY use the medicine data provided. Nothing else.
- Do NOT add outside medical knowledge.
- Do NOT diagnose or recommend prescriptions.
- Do NOT modify or omit warnings.
- If a field is missing, respond with: "Not available in the database."

LANGUAGE: Taglish (Filipino-English mix) — simple, clear, easy to understand.
AUDIENCE: Ordinary Filipinos with no medical background.
`.trim();

// @desc Check for typos
export function buildTypoCheckPrompt(query: string, medicineNames: string[]): string {
    return `
        You are a spell-checker for medicine names.

        MEDICINE LIST:
        ${medicineNames.join("\n")}

        USER QUERY: "${query}"

        TASK:
        - Check if the query matches or closely resembles any medicine in the list.
        - A match includes exact matches, typos, alternate spellings, or brand/generic name variations.

        Return ONLY valid JSON (no markdown, no extra text):
        {
            "matched": true or false,
            "correctedName": "exact name from the list, or null if no match"
        }
            `.trim();
}

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

// TO DO: Add a param for custom language preference of the user (Taglish, Filipino, English)
export function buildExplainPrompt(med: any): string {
    return `
        MEDICINE DATA:
        Name: ${formatValue(med.name)}
        Generic Name: ${formatValue(med.genericName)}
        Uses: ${formatValue(med.uses)}            Side Effects: ${formatValue(med.sideEffects)}
        Warnings: ${formatValue(med.warnings)}
        Contraindications: ${formatValue(med.contraindications)}
        OTC: ${formatValue(med.otc)}

        FORMAT:
        Return ONLY valid JSON on a single line for each string value:
        {    
            "summary": "...",
            "uses": "...",
            "warnings": "...",
            "sideEffects": "...",
            "whenToUse": "...",
            "whenToAvoid": "..."
        }

        example JSON:
        {
            "summary": "Ang Paracetamol ay gamot para sa lagnat at pananakit.",
            "uses": "Para sa lagnat at mild na sakit tulad ng headache.",
            "warnings": "Huwag sosobra sa dose at iwasan ang alak.",
            "sideEffects": "Maaaring makaranas ng rash o pagsusuka.",
            "whenToUse": "Kung may lagnat o mild na sakit ng katawan.",
            "whenToAvoid": "Iwasan kung ikaw ay allergic sa paracetamol o may problema sa atay."
        }

        Note: State the medicine availability clearly. If the medicine is OTC, say "Available over-the-counter." If it requires a prescription, say "Requires prescription."
    `;
}