import express from 'express';
import { searchMedicine } from '../controllers/medicine.controller.js';

const medicineRouter = express.Router();

// @desc Search medicines by query (with typo tolerance)
// GET /api/medicines?search=paracetamol
// GET /api/medicines?search=paracelamot
medicineRouter.get('/', searchMedicine);

export default medicineRouter;