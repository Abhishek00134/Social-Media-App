import mongoose from 'mongoose';
import userModel from '../models/user.js';
import notificationModel from '../models/notification.js';
import postModel from '../models/post.js';
import storyModel from '../models/story.js';
import messageModel from '../models/message.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { getIO, getReceiverSocketIds } from '../socket/socket.js';
import { sanitizeUser } from '../utils/helpers.js';

const getAccessSecret = () =>
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'pulsechat_jwt_secret_fallback_key';

const getRefreshSecret = () =>
    process.env.REFRESH_TOKEN_SECRET || `${process.env.JWT_SECRET || 'pulsechat_jwt_refresh'}_refresh`;

const generateAccessAndRefreshTokens = async (userId, res) => {
    const accessToken = jwt.sign({ id: userId }, getAccessSecret(), { expiresIn: '1d' });
    const refreshToken = jwt.sign({ id: userId }, getRefreshSecret(), { expiresIn: '30d' });

    // Store refreshToken in the database
    await userModel.findByIdAndUpdate(userId, { refreshToken });

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    };

    // Set cookies: accessToken (1 day) and refreshToken (30 days)
    res.cookie('accessToken', accessToken, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000
    });

    return { accessToken, refreshToken };
};

export const registerUser = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: 'Database is connecting. Please ensure your IP is allowed in MongoDB Atlas Network Access.'
            });
        }

        const { FullName, email, password, profilePic } = req.body;
        if (!FullName || !email || !password) {
            return res.status(400).json({ message: 'FullName, email, and password are required' });
        }

        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let uploadedAvatar = profilePic || '';
        if (profilePic && profilePic.startsWith('data:')) {
            uploadedAvatar = await uploadToCloudinary(profilePic, 'pulsechat/avatars');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({
            FullName,
            email,
            password: hashedPassword,
            profilePic: uploadedAvatar
        });

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, res);

        return res.status(201).json({
            message: 'User created successfully',
            user: sanitizeUser(user),
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Error in registerUser:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const loginUser = async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                message: 'Database is connecting. Please ensure your IP is allowed in MongoDB Atlas Network Access.'
            });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, res);

        return res.status(200).json({
            message: 'Logged in successfully',
            user: sanitizeUser(user),
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error('Error in loginUser:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const logoutUser = async (req, res) => {
    try {
        const token = req.cookies.refreshToken || req.body.refreshToken;

        if (token) {
            try {
                const decoded = jwt.verify(token, getRefreshSecret());
                await userModel.findByIdAndUpdate(decoded.id, { refreshToken: '' });
            } catch {
                // Ignore token verification errors during logout
            }
        } else if (req.user?._id) {
            await userModel.findByIdAndUpdate(req.user._id, { refreshToken: '' });
        }

        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            expires: new Date(0)
        };

        res.cookie('accessToken', '', cookieOptions);
        res.cookie('refreshToken', '', cookieOptions);

        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error in logoutUser:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        const decoded = jwt.verify(incomingRefreshToken, getRefreshSecret());
        const user = await userModel.findById(decoded.id);

        if (!user || user.refreshToken !== incomingRefreshToken) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        // Generate new accessToken valid for 1 day
        const newAccessToken = jwt.sign({ id: user._id }, getAccessSecret(), { expiresIn: '1d' });

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            message: 'Access token refreshed successfully',
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error('Error in refreshAccessToken:', error);
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({ user });
    } catch (error) {
        console.error('Error in getUserProfile:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Public / Other User Profile with Post count, Friends count, and Relationship Status
export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;
        const myId = req.user._id;

        // Check if userId is a valid 24-char hex MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const target = await userModel
            .findById(userId)
            .select('-password -refreshToken')
            .lean();

        if (!target) {
            return res.status(404).json({ message: 'User not found' });
        }

        const me = await userModel.findById(myId).lean();

        // Calculate counts
        const friendsCount = target.friends ? target.friends.length : 0;

        // Check relationship status with current user
        let relationship = 'none'; // 'self', 'friends', 'requested', 'incoming', 'none'
        if (String(myId) === String(userId)) {
            relationship = 'self';
        } else if (target.friends && target.friends.some((f) => String(f) === String(myId))) {
            relationship = 'friends';
        } else if (
            target.friendRequests &&
            target.friendRequests.some((r) => String(r.from) === String(myId))
        ) {
            relationship = 'requested'; // I requested them
        } else if (
            me &&
            me.friendRequests &&
            me.friendRequests.some((r) => String(r.from) === String(userId))
        ) {
            relationship = 'incoming'; // They requested me
        }

        return res.status(200).json({
            success: true,
            user: {
                _id: target._id,
                FullName: target.FullName,
                email: target.email,
                profilePic: target.profilePic,
                bio: target.bio,
                status: target.status,
                isPrivate: target.isPrivate,
                createdAt: target.createdAt,
                friendsCount,
                relationship
            }
        });
    } catch (error) {
        console.error('Error in getUserById:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const { FullName, bio, status, profilePic, removeProfilePic } = req.body;
        const updates = {};

        if (FullName) updates.FullName = FullName.trim();
        if (bio !== undefined) updates.bio = bio;
        if (status) updates.status = status;

        if (removeProfilePic || profilePic === '' || profilePic === null) {
            updates.profilePic = '';
        } else if (profilePic && typeof profilePic === 'string') {
            const uploadedUrl = profilePic.startsWith('data:')
                ? await uploadToCloudinary(profilePic, 'pulsechat/avatars')
                : profilePic;
            updates.profilePic = uploadedUrl;
        }

        const updatedUser = await userModel
            .findByIdAndUpdate(req.user._id, { $set: updates }, { new: true })
            .select('-password -refreshToken');

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error in updateUserProfile:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const removeProfilePhoto = async (req, res) => {
    try {
        const updatedUser = await userModel
            .findByIdAndUpdate(req.user._id, { $set: { profilePic: '' } }, { new: true })
            .select('-password -refreshToken');

        return res.status(200).json({
            message: 'Profile photo removed successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error in removeProfilePhoto:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || !query.trim()) {
            return res.status(200).json({ users: [] });
        }

        const users = await userModel
            .find({
                _id: { $ne: req.user._id },
                $or: [
                    { FullName: { $regex: query.trim(), $options: 'i' } },
                    { email: { $regex: query.trim(), $options: 'i' } }
                ]
            })
            .select('_id FullName email profilePic status bio isPrivate friends friendRequests sentRequests')
            .limit(15);

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error in searchUsers:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await userModel
            .find({ _id: { $ne: req.user._id } })
            .select('_id FullName email profilePic status bio isPrivate friends createdAt')
            .sort({ createdAt: -1 })
            .limit(30);

        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error in getAllUsers:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Toggle or Set Profile Privacy (Public / Private)
export const updatePrivacy = async (req, res) => {
    try {
        const { isPrivate } = req.body;
        const updatedUser = await userModel
            .findByIdAndUpdate(
                req.user._id,
                { $set: { isPrivate: Boolean(isPrivate) } },
                { new: true }
            )
            .select('-password -refreshToken');

        return res.status(200).json({
            message: `Account is now ${updatedUser.isPrivate ? 'Private 🔒' : 'Public 🌐'}`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error in updatePrivacy:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Send Friend Request
export const sendFriendRequest = async (req, res) => {
    try {
        const myId = req.user._id;
        const { targetUserId } = req.params;

        if (String(myId) === String(targetUserId)) {
            return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
        }

        const targetUser = await userModel.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const me = await userModel.findById(myId);

        // Check if already friends
        if (me.friends.some((f) => String(f) === String(targetUserId))) {
            return res.status(400).json({ message: 'Already friends with this user' });
        }

        // If target already sent a request to me, auto-accept and become friends!
        const incomingIndex = me.friendRequests.findIndex(
            (r) => String(r.from) === String(targetUserId)
        );

        if (incomingIndex > -1) {
            // Remove request from me
            me.friendRequests.splice(incomingIndex, 1);
            me.friends.addToSet(targetUserId);
            await me.save();

            // Add me to target's friends and remove sentRequest
            targetUser.friends.addToSet(myId);
            targetUser.sentRequests = targetUser.sentRequests.filter(
                (sr) => String(sr.to) !== String(myId)
            );
            await targetUser.save();

            // Notification
            await notificationModel.create({
                recipient: targetUserId,
                sender: myId,
                type: 'friend_accept',
                message: `${me.FullName} accepted your friend request.`
            });

            const io = getIO();
            if (io) {
                const targetSockets = getReceiverSocketIds(targetUserId);
                targetSockets.forEach((sId) => io.to(sId).emit('friendRequestAccepted', { friend: me }));
            }

            return res.status(200).json({
                message: `You and ${targetUser.FullName} are now friends!`,
                status: 'friends',
                targetUser
            });
        }

        // Check if already sent
        const alreadySent = targetUser.friendRequests.some(
            (r) => String(r.from) === String(myId)
        );
        if (alreadySent) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        // Push to target's incoming friendRequests and my sentRequests
        targetUser.friendRequests.push({ from: myId });
        await targetUser.save();

        me.sentRequests.push({ to: targetUserId });
        await me.save();

        // Create notification for target user
        await notificationModel.create({
            recipient: targetUserId,
            sender: myId,
            type: 'friend_request',
            message: `${me.FullName} sent you a friend request.`
        });

        const io = getIO();
        if (io) {
            const targetSockets = getReceiverSocketIds(targetUserId);
            targetSockets.forEach((sId) =>
                io.to(sId).emit('incomingFriendRequest', {
                    from: {
                        _id: me._id,
                        FullName: me.FullName,
                        profilePic: me.profilePic,
                        email: me.email
                    }
                })
            );
        }

        return res.status(200).json({
            message: 'Friend request sent successfully',
            status: 'requested'
        });
    } catch (error) {
        console.error('Error in sendFriendRequest:', error);
        return res.status(500).json({ message: 'Internal server error sending friend request' });
    }
};

// Accept Friend Request
export const acceptFriendRequest = async (req, res) => {
    try {
        const myId = req.user._id;
        const { senderUserId } = req.params;

        const me = await userModel.findById(myId);
        const senderUser = await userModel.findById(senderUserId);

        if (!senderUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove from incoming requests and add to friends
        me.friendRequests = me.friendRequests.filter(
            (r) => String(r.from) !== String(senderUserId)
        );
        me.friends.addToSet(senderUserId);
        await me.save();

        // Add me to sender's friends and remove from sender's sentRequests
        senderUser.friends.addToSet(myId);
        senderUser.sentRequests = senderUser.sentRequests.filter(
            (sr) => String(sr.to) !== String(myId)
        );
        await senderUser.save();

        // Create notification
        await notificationModel.create({
            recipient: senderUserId,
            sender: myId,
            type: 'friend_accept',
            message: `${me.FullName} accepted your friend request.`
        });

        const io = getIO();
        if (io) {
            const senderSockets = getReceiverSocketIds(senderUserId);
            senderSockets.forEach((sId) =>
                io.to(sId).emit('friendRequestAccepted', {
                    friend: {
                        _id: me._id,
                        FullName: me.FullName,
                        profilePic: me.profilePic,
                        email: me.email,
                        status: me.status
                    }
                })
            );
        }

        return res.status(200).json({
            message: `You are now friends with ${senderUser.FullName}`,
            friend: senderUser
        });
    } catch (error) {
        console.error('Error in acceptFriendRequest:', error);
        return res.status(500).json({ message: 'Internal server error accepting friend request' });
    }
};

// Reject / Decline Friend Request
export const rejectFriendRequest = async (req, res) => {
    try {
        const myId = req.user._id;
        const { senderUserId } = req.params;

        await userModel.findByIdAndUpdate(myId, {
            $pull: { friendRequests: { from: senderUserId } }
        });

        await userModel.findByIdAndUpdate(senderUserId, {
            $pull: { sentRequests: { to: myId } }
        });

        return res.status(200).json({ message: 'Friend request declined' });
    } catch (error) {
        console.error('Error in rejectFriendRequest:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Cancel Sent Friend Request
export const cancelFriendRequest = async (req, res) => {
    try {
        const myId = req.user._id;
        const { targetUserId } = req.params;

        await userModel.findByIdAndUpdate(myId, {
            $pull: { sentRequests: { to: targetUserId } }
        });

        await userModel.findByIdAndUpdate(targetUserId, {
            $pull: { friendRequests: { from: myId } }
        });

        return res.status(200).json({ message: 'Friend request cancelled' });
    } catch (error) {
        console.error('Error in cancelFriendRequest:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Unfriend / Remove Friend
export const unfriendUser = async (req, res) => {
    try {
        const myId = req.user._id;
        const { friendId } = req.params;

        await userModel.findByIdAndUpdate(myId, {
            $pull: { friends: friendId }
        });

        await userModel.findByIdAndUpdate(friendId, {
            $pull: { friends: myId }
        });

        return res.status(200).json({ message: 'Friend removed' });
    } catch (error) {
        console.error('Error in unfriendUser:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Accepted Friends List
export const getFriends = async (req, res) => {
    try {
        const user = await userModel
            .findById(req.user._id)
            .populate('friends', '_id FullName email profilePic status bio isPrivate')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            friends: user.friends || []
        });
    } catch (error) {
        console.error('Error in getFriends:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Get Pending Friend Requests (Incoming and Outgoing)
export const getFriendRequests = async (req, res) => {
    try {
        const user = await userModel
            .findById(req.user._id)
            .populate('friendRequests.from', '_id FullName email profilePic status bio isPrivate')
            .populate('sentRequests.to', '_id FullName email profilePic status bio isPrivate')
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            incoming: user.friendRequests || [],
            outgoing: user.sentRequests || []
        });
    } catch (error) {
        console.error('Error in getFriendRequests:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Permanently delete user account and all associated data
export const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Delete all posts authored by this user
        await postModel.deleteMany({ author: userId });

        // 2. Remove user likes, dislikes, and comments from other posts
        await postModel.updateMany(
            {},
            {
                $pull: {
                    likes: userId,
                    dislikes: userId,
                    comments: { author: userId }
                }
            }
        );

        // 3. Delete all stories authored by this user
        await storyModel.deleteMany({ author: userId });

        // 4. Remove user from story viewers and reactions
        await storyModel.updateMany(
            {},
            {
                $pull: {
                    viewers: userId,
                    reactions: { user: userId }
                }
            }
        );

        // 5. Delete all messages sent or received by this user
        await messageModel.deleteMany({
            $or: [{ senderId: userId }, { receiverId: userId }]
        });

        // 6. Delete all notifications sent to or from this user
        await notificationModel.deleteMany({
            $or: [{ recipient: userId }, { sender: userId }]
        });

        // 7. Remove user from friends, friendRequests, and sentRequests of all other users
        await userModel.updateMany(
            {},
            {
                $pull: {
                    friends: userId,
                    friendRequests: { from: userId },
                    sentRequests: { to: userId }
                }
            }
        );

        // 8. Delete user record
        await userModel.findByIdAndDelete(userId);

        // 9. Clear auth cookies
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            expires: new Date(0)
        };
        res.cookie('accessToken', '', cookieOptions);
        res.cookie('refreshToken', '', cookieOptions);

        return res.status(200).json({ message: 'User account and associated data permanently deleted successfully' });
    } catch (error) {
        console.error('Error in deleteUserAccount:', error);
        return res.status(500).json({ message: 'Internal server error deleting account' });
    }
};