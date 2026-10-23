import express from 'express';
import {
    createPost,
    getAllPosts,
    updatePost,
    deletePost,
    likePost,
    dislikePost,
    sharePost,
    addComment,
    getUserPosts
} from '../Controller/post.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', getAllPosts);
router.get('/user/:userId', getUserPosts);
router.post('/', createPost);
router.put('/:id', updatePost);
router.delete('/:id', deletePost);
router.post('/:id/like', likePost);
router.post('/:id/dislike', dislikePost);
router.post('/:id/share', sharePost);
router.post('/:id/comment', addComment);

export default router;
