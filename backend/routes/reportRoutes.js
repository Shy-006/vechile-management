import express from 'express';
import { getRevenueReport } from '../controller/reportController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/revenue', authenticateJWT, requireAdmin, getRevenueReport);

export default router;
