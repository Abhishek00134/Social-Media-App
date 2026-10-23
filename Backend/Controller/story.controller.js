import storyModel from '../models/story.js';
import userModel from '../models/user.js';
import notificationModel from '../models/notification.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

export const createStory = async (req, res) => {
    try {
        const { mediaUrl, mediaType, caption, backgroundColor } = req.body;

        if (!mediaUrl) {
            return res.status(400).json({ message: 'Media content is required for a story' });
        }

        let uploadedMedia = mediaUrl;
        if (mediaUrl.startsWith('data:')) {
            uploadedMedia = await uploadToCloudinary(mediaUrl, 'pulsechat/stories');
        }

        const newStory = await storyModel.create({
            author: req.user._id,
            mediaUrl: uploadedMedia,
            mediaType: mediaType || 'image',
            caption: caption?.trim() || '',
            backgroundColor: backgroundColor || ''
        });

        const populatedStory = await storyModel
            .findById(newStory._id)
            .populate('author', 'FullName email profilePic')
            .populate('reactions.user', 'FullName email profilePic')
            .populate('viewers', 'FullName email profilePic');

        return res.status(201).json({
            message: 'Story published successfully',
            story: populatedStory
        });
    } catch (error) {
        console.error('Error in createStory:', error);
        return res.status(500).json({ message: 'Internal server error creating story' });
    }
};

export const getAllStories = async (req, res) => {
    try {
        const myId = req.user?._id;
        let myFriends = [];

        if (myId) {
            const me = await userModel.findById(myId).select('friends').lean();
            if (me && me.friends) {
                myFriends = me.friends.map((f) => String(f));
            }
        }

        const now = new Date();
        const stories = await storyModel
            .find({ expiresAt: { $gt: now } })
            .sort({ createdAt: -1 })
            .populate('author', 'FullName email profilePic isPrivate')
            .populate('reactions.user', 'FullName email profilePic')
            .populate('viewers', 'FullName email profilePic')
            .lean();

        // Privacy rule:
        // Visible if author is me, OR author is public, OR author is my accepted friend
        const visibleStories = stories.filter((story) => {
            if (!story.author) return false;
            const authorId = String(story.author._id || story.author);
            if (myId && authorId === String(myId)) return true;
            if (!story.author.isPrivate) return true;
            if (myFriends.includes(authorId)) return true;
            return false;
        });

        return res.status(200).json({ stories: visibleStories });
    } catch (error) {
        console.error('Error in getAllStories:', error);
        return res.status(500).json({ message: 'Internal server error fetching stories' });
    }
};

export const deleteStory = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await storyModel.findById(id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found or expired' });
        }

        if (story.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this story' });
        }

        await storyModel.findByIdAndDelete(id);

        return res.status(200).json({ message: 'Story deleted successfully' });
    } catch (error) {
        console.error('Error in deleteStory:', error);
        return res.status(500).json({ message: 'Internal server error deleting story' });
    }
};

export const viewStory = async (req, res) => {
    try {
        const { id } = req.params;
        const story = await storyModel.findById(id);

        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }

        if (!story.viewers.includes(req.user._id)) {
            story.viewers.push(req.user._id);
            await story.save();
        }

        return res.status(200).json({ message: 'Story marked as viewed' });
    } catch (error) {
        console.error('Error in viewStory:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const reactToStory = async (req, res) => {
    try {
        const { id } = req.params;
        const { emoji } = req.body;

        if (!emoji) {
            return res.status(400).json({ message: 'Emoji is required' });
        }

        const story = await storyModel.findById(id);
        if (!story) {
            return res.status(404).json({ message: 'Story not found or expired' });
        }

        // Add reaction to story
        story.reactions.push({
            user: req.user._id,
            emoji: emoji.trim(),
            createdAt: new Date()
        });

        // Also ensure user is in viewers list
        if (!story.viewers.some((v) => v.toString() === req.user._id.toString())) {
            story.viewers.push(req.user._id);
        }

        await story.save();

        // Create notification for story author if sender is not the author
        if (story.author.toString() !== req.user._id.toString()) {
            await notificationModel.create({
                recipient: story.author,
                sender: req.user._id,
                type: 'story_reaction',
                story: story._id,
                reactionEmoji: emoji.trim(),
                message: `${req.user.FullName} reacted ${emoji.trim()} to your story`
            });
        }

        const updatedStory = await storyModel
            .findById(id)
            .populate('author', 'FullName email profilePic')
            .populate('reactions.user', 'FullName email profilePic')
            .populate('viewers', 'FullName email profilePic');

        return res.status(200).json({
            message: 'Reaction recorded successfully',
            story: updatedStory
        });
    } catch (error) {
        console.error('Error in reactToStory:', error);
        return res.status(500).json({ message: 'Internal server error recording reaction' });
    }
};

