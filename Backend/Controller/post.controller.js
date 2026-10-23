import postModel from '../models/post.js';
import userModel from '../models/user.js';
import { uploadToCloudinary } from '../config/cloudinary.js';

export const createPost = async (req, res) => {
    try {
        const { content, mediaUrl, mediaType, feeling } = req.body;

        if (!content?.trim() && !mediaUrl && !feeling?.text) {
            return res.status(400).json({ message: 'Post content, feeling, or media is required' });
        }

        let uploadedMedia = mediaUrl || '';
        if (mediaUrl && mediaUrl.startsWith('data:')) {
            uploadedMedia = await uploadToCloudinary(mediaUrl, 'pulsechat/posts');
        }

        const newPost = await postModel.create({
            author: req.user._id,
            content: content?.trim() || '',
            mediaUrl: uploadedMedia,
            mediaType: uploadedMedia ? mediaType || 'image' : null,
            feeling: feeling && feeling.text ? { emoji: feeling.emoji || '😊', text: feeling.text } : undefined
        });

        const populatedPost = await postModel
            .findById(newPost._id)
            .populate('author', 'FullName email profilePic isPrivate');

        return res.status(201).json({
            message: 'Post published successfully',
            post: populatedPost
        });
    } catch (error) {
        console.error('Error in createPost:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const myId = req.user?._id;
        let myFriends = [];

        if (myId) {
            const me = await userModel.findById(myId).select('friends').lean();
            if (me && me.friends) {
                myFriends = me.friends.map((f) => String(f));
            }
        }

        const posts = await postModel
            .find()
            .sort({ createdAt: -1 })
            .populate('author', 'FullName email profilePic isPrivate')
            .populate('comments.author', 'FullName email profilePic isPrivate')
            .lean();

        // Privacy rule:
        // Visible if author is me, OR author is public, OR author is my accepted friend
        const visiblePosts = posts.filter((post) => {
            if (!post.author) return false;
            const authorId = String(post.author._id || post.author);
            if (myId && authorId === String(myId)) return true;
            if (!post.author.isPrivate) return true;
            if (myFriends.includes(authorId)) return true;
            return false;
        });

        return res.status(200).json({ posts: visiblePosts });
    } catch (error) {
        console.error('Error in getAllPosts:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, mediaUrl, mediaType } = req.body;

        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to edit this post' });
        }

        if (content !== undefined) post.content = content.trim();

        if (mediaUrl) {
            if (mediaUrl.startsWith('data:')) {
                post.mediaUrl = await uploadToCloudinary(mediaUrl, 'pulsechat/posts');
            } else {
                post.mediaUrl = mediaUrl;
            }
            post.mediaType = mediaType || 'image';
        }

        await post.save();

        const updated = await postModel
            .findById(id)
            .populate('author', 'FullName email profilePic')
            .populate('comments.author', 'FullName email profilePic');

        return res.status(200).json({
            message: 'Post updated successfully',
            post: updated
        });
    } catch (error) {
        console.error('Error in updatePost:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await postModel.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this post' });
        }

        await postModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: 'Post deleted successfully',
            deletedId: id
        });
    } catch (error) {
        console.error('Error in deletePost:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const likePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isLiked = post.likes.includes(userId);
        if (isLiked) {
            // Remove like
            post.likes = post.likes.filter((uid) => uid.toString() !== userId.toString());
        } else {
            // Add like and remove dislike if present
            post.likes.push(userId);
            post.dislikes = post.dislikes.filter((uid) => uid.toString() !== userId.toString());
        }

        await post.save();

        const updated = await postModel
            .findById(id)
            .populate('author', 'FullName email profilePic')
            .populate('comments.author', 'FullName email profilePic');

        return res.status(200).json({ post: updated });
    } catch (error) {
        console.error('Error in likePost:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const dislikePost = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const isDisliked = post.dislikes.includes(userId);
        if (isDisliked) {
            // Remove dislike
            post.dislikes = post.dislikes.filter((uid) => uid.toString() !== userId.toString());
        } else {
            // Add dislike and remove like if present
            post.dislikes.push(userId);
            post.likes = post.likes.filter((uid) => uid.toString() !== userId.toString());
        }

        await post.save();

        const updated = await postModel
            .findById(id)
            .populate('author', 'FullName email profilePic')
            .populate('comments.author', 'FullName email profilePic');

        return res.status(200).json({ post: updated });
    } catch (error) {
        console.error('Error in dislikePost:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const sharePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await postModel
            .findByIdAndUpdate(id, { $inc: { shares: 1 } }, { new: true })
            .populate('author', 'FullName email profilePic')
            .populate('comments.author', 'FullName email profilePic');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        return res.status(200).json({
            message: 'Post shared successfully',
            post
        });
    } catch (error) {
        console.error('Error in sharePost:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await postModel.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.comments.push({
            author: req.user._id,
            text: text.trim()
        });

        await post.save();

        const updated = await postModel
            .findById(id)
            .populate('author', 'FullName email profilePic')
            .populate('comments.author', 'FullName email profilePic');

        return res.status(201).json({
            message: 'Comment added',
            post: updated
        });
    } catch (error) {
        console.error('Error in addComment:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all posts by a specific user (for Instagram profile viewing)
export const getUserPosts = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;

        const targetUser = await userModel.findById(userId).lean();
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMe = String(myId) === String(userId);
        const isFriend = targetUser.friends && targetUser.friends.some((f) => String(f) === String(myId));
        const canView = isMe || !targetUser.isPrivate || isFriend;

        if (!canView) {
            return res.status(200).json({
                posts: [],
                isPrivateRestricted: true,
                message: 'This account is private. Follow or be friends to see their photos and videos.'
            });
        }

        const posts = await postModel
            .find({ author: userId })
            .sort({ createdAt: -1 })
            .populate('author', 'FullName email profilePic isPrivate')
            .populate('comments.author', 'FullName email profilePic isPrivate')
            .lean();

        return res.status(200).json({
            posts,
            isPrivateRestricted: false
        });
    } catch (error) {
        console.error('Error in getUserPosts:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

