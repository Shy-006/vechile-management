import express from 'express';
import { addService, getServices } from '../controller/serviceController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', authenticateJWT, requireAdmin, addService);
router.get('/', authenticateJWT, getServices);

export default router;
