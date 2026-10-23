import express from 'express';
import {
    getMyNotifications,
    markNotificationsAsRead,
    clearNotifications
} from '../Controller/notification.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', getMyNotifications);
router.put('/mark-read', markNotificationsAsRead);
router.delete('/clear', clearNotifications);

export default router;
