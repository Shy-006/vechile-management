import express from 'express';
import { register, login, requestPasswordReset, resetPassword } from '../controller/authController.js';

const router = express.Router();

router.post('/register', register);



export default router;
