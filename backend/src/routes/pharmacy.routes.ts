import express from 'express';
import { fetchPharmacies } from '../controllers/pharmacy.controller.js';

const pharmacyRouter = express.Router();

// @desc Fetch pharmacies near coordinates (proxied from Overpass API)
// GET /api/pharmacies?latitude=14.5920&longitude=121.0067&radius=2000
pharmacyRouter.get('/', fetchPharmacies);

export default pharmacyRouter;
