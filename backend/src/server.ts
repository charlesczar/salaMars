import express from 'express';
import medicineRouter from './routes/medicine.routes.js';

const app = express();

app.use(express.json());

app.use('/api/medicines', medicineRouter);

export default app;