import express from 'express';
import { getMedicines } from '../controllers/medicine.controller.js';

const medicineRouter = express.Router();

// @desc Get all medicines or search by name
// @route GET api/medicines
// @route GET /medicines?search=medicineName
// @access Public
medicineRouter.get('/', getMedicines);

export default medicineRouter;