import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { normalizeInput } from '../utils/normalize.query.js';

export const getMedicines = (req: Request, res: Response) => {
    const searchQuery = req.query.search as string | undefined;

    const normalizedQuery = searchQuery ? normalizeInput(searchQuery) : undefined;

    const filePath = path.join(__dirname, '../data/medicines.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const medicines = JSON.parse(raw);

    if (normalizedQuery) {
        const filtered = medicines.find((med: any) =>
            med.searchKeys.some((key: string) => key.includes(normalizedQuery))
        );
        return res.json(filtered);
    }

    return res.json(medicines);
};