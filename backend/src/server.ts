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

app.use('/api/medicines', medicineRouter);

export default app;