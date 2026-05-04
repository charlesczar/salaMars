import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildExplainPrompt } from '../utils/gemini.prompts.js';
import { askGemini } from '../services/gemini.service.js';
import { normalizeInput } from '../utils/normalize.query.js';
import { languages, type Language } from '../constants/languages.js';

const currentFilePath = fileURLToPath(import.meta.url);
const filePath = path.join(path.dirname(currentFilePath), '../data/medicines.json');
const medicines = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const validLangs: Language[] = [...languages];

function resolveLanguagePreference(language: string | undefined): Language | undefined {
    if (!language) {
        return undefined;
    }

    const normalized = normalizeInput(language);

    if (validLangs.includes(normalized as Language)) {
        return normalized as Language;
    }

    if (normalized === 'en') {
        return 'english';
    }

    if (normalized === 'tl') {
        return 'filipino';
    }

    return undefined;
}

function levenshteinDistance(left: string, right: string): number {
    const rows = left.length + 1;
    const cols = right.length + 1;
    const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let row = 0; row < rows; row += 1) {
        matrix[row]![0] = row;
    }

    for (let col = 0; col < cols; col += 1) {
        matrix[0]![col] = col;
    }

    const m = (row: number, col: number): number => matrix[row]![col]!;

    for (let row = 1; row < rows; row += 1) {
        for (let col = 1; col < cols; col += 1) {
            const cost = left[row - 1] === right[col - 1] ? 0 : 1;
            matrix[row]![col] = Math.min(
                m(row - 1, col) + 1,
                m(row, col - 1) + 1,
                m(row - 1, col - 1) + cost
            );
        }
    }
    return m(left.length, right.length);
}

function getSearchTokens(medicine: any): string[] {
    return [
        medicine.name,
        medicine.genericName,
        ...(medicine.brandNames ?? []),
        ...(medicine.searchKeys ?? []),
        ...(medicine.activeIngredients ?? []),
    ]
        .filter(Boolean)
        .map((value) => normalizeInput(String(value)));
}

function getMatchContext(medicine: any, query: string): 'brand' | 'generic' | 'exact' | 'other' {
    const normalizedQuery = normalizeInput(query);

    if (normalizeInput(String(medicine.name)) === normalizedQuery) {
        return 'exact';
    }

    if (normalizeInput(String(medicine.genericName)) === normalizedQuery || (medicine.activeIngredients ?? []).some((value: string) => normalizeInput(value) === normalizedQuery)) {
        return 'generic';
    }

    if ((medicine.brandNames ?? []).some((value: string) => normalizeInput(value) === normalizedQuery)) {
        return 'brand';
    }

    return 'other';
}

function formatMedicineField(value: string[] | string | boolean | undefined): string {
    if (value === undefined || value === null) {
        return 'Not available in the database.';
    }

    if (typeof value === 'boolean') {
        return value ? 'Available over-the-counter.' : 'Requires prescription.';
    }

    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : 'Not available in the database.';
    }

    const normalized = String(value).replace(/\s+/g, ' ').trim();
    return normalized || 'Not available in the database.';
}

function buildMedicineResponse(medicine: any, matchedOn?: 'brand' | 'generic' | 'exact' | 'other') {
    const brandName = (medicine.brandNames ?? [])[0] as string | undefined;
    const genericName = formatMedicineField(medicine.genericName);
    const displayName = matchedOn === 'brand' && brandName ? brandName : formatMedicineField(medicine.name);
    const availability = medicine.otc ? 'Available over-the-counter.' : 'Requires prescription.';

    const summary = matchedOn === 'brand' && brandName
        ? `${displayName} is a brand name for ${genericName}. ${availability}`
        : matchedOn === 'generic'
            ? `${displayName} is the generic medicine name. ${brandName ? `Common brand name: ${brandName}. ` : ''}${availability}`
            : `${displayName}. ${availability}`;

    return {
        summary,
        uses: formatMedicineField(medicine.uses),
        warnings: formatMedicineField(medicine.warnings),
        sideEffects: formatMedicineField(medicine.sideEffects),
        whenToUse: formatMedicineField(medicine.uses),
        whenToAvoid: formatMedicineField(medicine.contraindications),
    };
}

function hasUsefulGeminiResponse(response: any): boolean {
    if (!response || typeof response !== 'object') {
        return false;
    }

    return ['summary', 'uses', 'warnings', 'sideEffects', 'whenToUse', 'whenToAvoid'].some((key) => {
        const value = response[key];
        return typeof value === 'string' && value !== 'Not available in the database.';
    });
}

function findBestMedicineMatch(query: string) {
    const normalizedQuery = normalizeInput(query);

    const exactMatch = medicines.find((medicine: any) => {
        const tokens = getSearchTokens(medicine);
        return tokens.includes(normalizedQuery);
    });

    if (exactMatch) {
        return { medicine: exactMatch, searchCorrection: undefined, matchedOn: getMatchContext(exactMatch, normalizedQuery) };
    }

    let bestMatch: any | undefined;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const medicine of medicines as any[]) {
        for (const token of getSearchTokens(medicine)) {
            const distance = levenshteinDistance(normalizedQuery, token);
            const score = distance / Math.max(normalizedQuery.length, token.length, 1);

            if (score < bestScore) {
                bestScore = score;
                bestMatch = medicine;
            }
        }
    }

    if (!bestMatch || bestScore > 0.35) {
        return { medicine: undefined, searchCorrection: undefined, matchedOn: undefined };
    }

    return {
        medicine: bestMatch,
        searchCorrection: bestMatch.name.toLowerCase() === normalizedQuery
            ? undefined
            : `Did you mean "${bestMatch.name}"?`,
        matchedOn: getMatchContext(bestMatch, normalizedQuery),
    };
}

export const searchMedicine = async (req: Request, res: Response) => {
    const { medicine, language } = req.query as { medicine?: string; language?: string };
    const resolvedLanguage = resolveLanguagePreference(language);

    if (!medicine || medicine.trim() === '' || !language) {
        return res.status(400).json({ error: 'Medicine and language are required.' });
    }

    if (!resolvedLanguage) {
        return res.status(400).json({ error: 'Invalid language specified.' });
    }

    const { medicine: matchedMedicine, searchCorrection, matchedOn } = findBestMedicineMatch(medicine);

    if (!matchedMedicine) {
        return res.status(200).json({
            success: true,
            message: `No medicine found for "${medicine}". Please check your spelling.`,
        });
    }

    let explanation = null;
    try {
        explanation = await askGemini(
            buildExplainPrompt(
                matchedMedicine,
                resolvedLanguage,
                matchedOn ? { query: medicine, matchedOn } : { query: medicine }
            )
        );
    } catch (error) {
        console.warn('Gemini unavailable, using offline fallback');
    }

    const geminiResponse = hasUsefulGeminiResponse(explanation)
        ? explanation
        : buildMedicineResponse(matchedMedicine, matchedOn);

    return res.status(200).json({
        geminiResponse,
        ...(searchCorrection && { searchCorrection }),
    });
};

export const scanMedicine = async (req: Request, res: Response) => {
    const medicine = req.body?.medicine as string | undefined;
    const language = req.body?.language as Language | undefined;
    const resolvedLanguage = resolveLanguagePreference(language);

    if (!resolvedLanguage) {
        return res.status(400).json({ error: 'Language preference is required.' });
    }

    if (!medicine || medicine.trim() === '') {
        return res.status(400).json({ error: 'Medicine name is required.' });
    }

    const { medicine: matchedMedicine } = findBestMedicineMatch(medicine);

    if (!matchedMedicine) {
        return res.status(404).json({
            error: `No medicine found for "${medicine}". Please check your spelling.`,
        });
    }

    let explanation = null;
    try {
        explanation = await askGemini(
            buildExplainPrompt(matchedMedicine, resolvedLanguage, { query: medicine, matchedOn: getMatchContext(matchedMedicine, medicine) })
        );
    } catch (error) {
        console.warn('Gemini unavailable, using offline fallback');
    }

    const geminiResponse = hasUsefulGeminiResponse(explanation)
        ? explanation
        : buildMedicineResponse(matchedMedicine);

    return res.status(200).json({ geminiResponse });
};