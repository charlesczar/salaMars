import express from 'express';
import { searchMedicine, scanMedicine } from '../controllers/medicine.controller.js';

const medicineRouter = express.Router();

// @desc Search medicines by query (with typo tolerance)
// GET /api/medicines?medicine=paracetamol&language=filipino
// GET  /api/medicines?medicine=generick&language=bisaya
medicineRouter.get('/', searchMedicine);

// @desc Search medicine from OCR text extracted
// POST /api/medicines/scan  body: { name: "paracetamol", language: "bisaya" }
medicineRouter.post('/scan', scanMedicine);

export default medicineRouter;