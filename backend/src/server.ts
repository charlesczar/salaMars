import express from 'express';
import cors from 'cors';
import medicineRouter from './routes/medicine.routes.js';
import { getFrontendUrl } from './config/env.js';

const app = express();

app.use(cors({
	origin: getFrontendUrl(),
	credentials: true,
}));

app.use(express.json());

app.get('/', (_req, res) => {
	res.status(200).json({ ok: true, service: 'backend', message: 'Backend is running.' });
});

app.get('/health', (_req, res) => {
	res.status(200).json({ ok: true });
});

app.use('/api/medicines', medicineRouter);

export default app;