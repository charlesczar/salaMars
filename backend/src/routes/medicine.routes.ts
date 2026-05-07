import express from 'express';
import { searchMedicine, getAllMedicines } from '../controllers/medicine.controller.js';

const medicineRouter = express.Router();

// @desc Get all medicines
// GET /api/medicines/all
medicineRouter.get('/all', getAllMedicines);

// @desc Search medicines by query (with typo tolerance)
// GET /api/medicines?medicine=paracetamol&language=filipino
// GET  /api/medicines?medicine=generick&language=bisaya
medicineRouter.get('/', searchMedicine);

export default medicineRouter;