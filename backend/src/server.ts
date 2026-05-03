import express from 'express';
import type { Request, Response } from 'express';
import medicineRouter from './routes/medicine.routes.js';

const app = express();

app.get('/', (req: Request, res: Response) => {
    res.send('TEST ROUTE');
});

app.use('/api/medicines', medicineRouter);

export default app;


