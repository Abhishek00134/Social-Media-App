import express from 'express';
import {
    createStory,
    getAllStories,
    deleteStory,
    viewStory,
    reactToStory
} from '../Controller/story.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', getAllStories);
router.post('/', createStory);
router.delete('/:id', deleteStory);
router.post('/:id/view', viewStory);
router.post('/:id/react', reactToStory);

export default router;
