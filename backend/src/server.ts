import express from 'express';
import type { Request, Response } from 'express';
import medicineRouter from './routes/medicine.routes.js';
import gemini from './config/gemini.client.js';

const app = express();

app.get('/', async (req: Request, res: Response) => {
    try {
        const geminiResponse = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Hello, Gemini! Can you tell me a joke?"
        });
        res.send('TEST ROUTE: ' + JSON.stringify(geminiResponse));
    } catch (error) {
        res.status(500).send({ error: (error as Error).message });
    }
});

app.use('/api/medicines', medicineRouter);

export default app;


