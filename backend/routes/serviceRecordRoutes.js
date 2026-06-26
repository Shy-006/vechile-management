import express from 'express';
import { createServiceRecord, getVehicleHistory, getAllServiceRecords } from '../controller/serviceRecordController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, requireAdmin, createServiceRecord);
router.get('/', authenticateJWT, requireAdmin, getAllServiceRecords);
router.get('/:vehicleId', authenticateJWT, getVehicleHistory);

export default router;
