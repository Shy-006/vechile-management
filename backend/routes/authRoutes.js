import express from 'express';
import { register, login, logout, changePassword, checkSession } from '../controller/authController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateJWT, checkSession);
router.post('/change-password', authenticateJWT, changePassword);

export default router;
