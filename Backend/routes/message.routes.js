import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import {
    getMessages,
    sendMessage,
    getRecentConversations,
    markAsRead
} from '../Controller/message.controller.js';

const router = express.Router();

router.get('/conversations/recent', protectRoute, getRecentConversations);
router.get('/:receiverId', protectRoute, getMessages);
router.post('/:receiverId', protectRoute, sendMessage);
router.put('/read/:senderId', protectRoute, markAsRead);

export default router;
