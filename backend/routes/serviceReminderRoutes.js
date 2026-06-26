import express from 'express';
import { 
  getReminders, 
  dismissReminder, 
  getAdminReminders, 
  triggerAdminNotifications 
} from '../controller/serviceReminderController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Customer endpoints
router.get('/', authenticateJWT, getReminders);
router.put('/:id/dismiss', authenticateJWT, dismissReminder);

// Admin endpoints
router.get('/admin', authenticateJWT, requireAdmin, getAdminReminders);
router.post('/admin/trigger', authenticateJWT, requireAdmin, triggerAdminNotifications);

export default router;
