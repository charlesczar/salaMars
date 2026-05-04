import express from 'express';
import medicineRouter from './routes/medicine.routes.js';
import cors from 'cors';

const app = express();

app.use(express.json());

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));

app.use('/api/medicines', medicineRouter);

export default app;

