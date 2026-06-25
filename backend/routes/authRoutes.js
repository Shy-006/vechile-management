import express from 'express';
import { register, login, resetPassword, changePassword } from '../controller/authController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', resetPassword);
router.post('/change-password', authenticateJWT, changePassword);

export default router;
