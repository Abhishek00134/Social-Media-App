import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getUserProfile,
    updateUserProfile,
    searchUsers,
    getAllUsers,
    updatePrivacy,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    unfriendUser,
    getFriends,
    getFriendRequests,
    getUserById,
    removeProfilePhoto
} from '../Controller/user.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

// Auth routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/refresh-token', refreshAccessToken);

// Profile and privacy
router.get('/profile', protectRoute, getUserProfile);
router.put('/profile', protectRoute, updateUserProfile);
router.delete('/profile-photo', protectRoute, removeProfilePhoto);
router.put('/privacy', protectRoute, updatePrivacy);

// User discovery & Friends (Static routes MUST precede /:userId)
router.get('/search', protectRoute, searchUsers);
router.get('/friends', protectRoute, getFriends);
router.get('/friend-requests', protectRoute, getFriendRequests);
router.get('/', protectRoute, getAllUsers);

// Friend Request Actions
router.post('/friend-request/:targetUserId', protectRoute, sendFriendRequest);
router.post('/friend-request/:senderUserId/accept', protectRoute, acceptFriendRequest);
router.post('/friend-request/:senderUserId/reject', protectRoute, rejectFriendRequest);
router.post('/friend-request/:targetUserId/cancel', protectRoute, cancelFriendRequest);
router.post('/unfriend/:friendId', protectRoute, unfriendUser);

// Parameterized user route (placed last so it doesn't intercept static routes)
router.get('/:userId', protectRoute, getUserById);

export default router;
