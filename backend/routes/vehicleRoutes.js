import express from 'express';
import { addVehicle, getVehicles, getCustomers } from '../controller/vehicleController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, addVehicle);
router.get('/', authenticateJWT, getVehicles);
router.get('/my', authenticateJWT, getVehicles);
router.get('/customers', authenticateJWT, requireAdmin, getCustomers);

export default router;
