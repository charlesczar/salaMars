import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    buildTypoCheckPrompt,
    buildExplainPrompt,
} from '../utils/gemini.prompts.js';
import { askGemini } from '../services/gemini.service.js';

const currentFilePath = fileURLToPath(import.meta.url);
const filePath = path.join(path.dirname(currentFilePath), '../data/medicines.json');
const medicines = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

export const searchMedicine = async (req: Request, res: Response) => {
    const query = req.query.search as string | undefined;

    if (!query || query.trim() === "") {
        return res.status(400).json({ error: "Search query is required." });
    }

    const medicineNames = medicines.map((m: any) => m.name);

    /** @returns 
        { 
            matched: boolean, 
            correctedName: string | null 
        }
    */
    const typoResult = await askGemini(buildTypoCheckPrompt(query, medicineNames));

    if (!typoResult.matched || !typoResult.correctedName) {
        return res.status(404).json({
            error: `No medicine found for "${query}". Please check your spelling.`,
        });
    }

    const medicine = medicines.find(
        (m: any) => m.name.toLowerCase() === typoResult.correctedName.toLowerCase()
    );

    if (!medicine) {
        return res.status(404).json({ error: "Medicine not found in database." });
    }

    /** @returns 
     *  {    
            "summary": "...",
            "uses": "...",
            "warnings": "...",
            "sideEffects": "...",
            "whenToUse": "...",
            "whenToAvoid": "..."
        } 
    */
    const explanation = await askGemini(buildExplainPrompt(medicine));

    const wasTypo = query.toLowerCase().trim() !== typoResult.correctedName.toLowerCase().trim();
    const searchCorrection = wasTypo
        ? `Did you mean "${typoResult.correctedName}"?`
        : undefined;

    return res.status(200).json({
        geminiResponse: explanation,
        ...(searchCorrection && { searchCorrection }),
    });
};