import messageModel from '../models/message.js';
import userModel from '../models/user.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { getIO, getReceiverSocketIds } from '../socket/socket.js';

// 1. Get Conversation Messages with a specific user
export const getMessages = async (req, res) => {
    try {
        const myId = req.user._id;
        const { receiverId } = req.params;

        if (!receiverId) {
            return res.status(400).json({ message: 'Receiver ID is required' });
        }

        const messages = await messageModel
            .find({
                $or: [
                    { senderId: myId, receiverId },
                    { senderId: receiverId, receiverId: myId }
                ]
            })
            .sort({ createdAt: 1 })
            .lean();

        // Mark incoming unread messages as read
        const unreadCount = await messageModel.countDocuments({
            senderId: receiverId,
            receiverId: myId,
            isRead: false
        });

        if (unreadCount > 0) {
            await messageModel.updateMany(
                { senderId: receiverId, receiverId: myId, isRead: false },
                { $set: { isRead: true, readAt: new Date() } }
            );

            // Notify the sender that their messages were read
            const io = getIO();
            if (io) {
                const senderSockets = getReceiverSocketIds(receiverId);
                senderSockets.forEach((sockId) => {
                    io.to(sockId).emit('messagesRead', { readerId: String(myId) });
                });
            }
        }

        return res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error in getMessages controller:', error);
        return res.status(500).json({ message: 'Internal server error while fetching messages' });
    }
};

// 2. Send Message to a specific user (Text and/or Media)
export const sendMessage = async (req, res) => {
    try {
        const myId = req.user._id;
        const { receiverId } = req.params;
        const { text, mediaUrl, mediaType = 'text' } = req.body;

        if (!receiverId) {
            return res.status(400).json({ message: 'Receiver ID is required' });
        }

        if (!text && !mediaUrl) {
            return res.status(400).json({ message: 'Message text or media is required' });
        }

        let finalMediaUrl = '';
        let finalMediaType = mediaType;

        if (mediaUrl) {
            if (mediaUrl.startsWith('data:')) {
                finalMediaUrl = await uploadToCloudinary(mediaUrl, 'pulsechat_messages');
            } else {
                finalMediaUrl = mediaUrl;
            }
        }

        const newMessage = await messageModel.create({
            senderId: myId,
            receiverId,
            text: text ? text.trim() : '',
            mediaUrl: finalMediaUrl,
            mediaType: finalMediaType,
            isRead: false
        });

        const messagePayload = {
            ...newMessage.toObject(),
            senderId: String(newMessage.senderId),
            receiverId: String(newMessage.receiverId)
        };

        // Real-time broadcast to receiver's active sockets
        const io = getIO();
        if (io) {
            const receiverSockets = getReceiverSocketIds(receiverId);
            receiverSockets.forEach((sockId) => {
                io.to(sockId).emit('newMessage', messagePayload);
            });
        }

        return res.status(201).json({
            success: true,
            message: messagePayload
        });
    } catch (error) {
        console.error('Error in sendMessage controller:', error);
        return res.status(500).json({ message: 'Internal server error while sending message' });
    }
};

// 3. Get Recent Conversations for the active user
export const getRecentConversations = async (req, res) => {
    try {
        const myId = req.user._id;

        // Find all messages involving myId
        const messages = await messageModel
            .find({
                $or: [{ senderId: myId }, { receiverId: myId }]
            })
            .sort({ createdAt: -1 })
            .lean();

        const conversationsMap = new Map();

        for (const msg of messages) {
            const otherUserId =
                String(msg.senderId) === String(myId) ? String(msg.receiverId) : String(msg.senderId);

            if (!conversationsMap.has(otherUserId)) {
                conversationsMap.set(otherUserId, {
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            if (String(msg.receiverId) === String(myId) && !msg.isRead) {
                conversationsMap.get(otherUserId).unreadCount += 1;
            }
        }

        const userIds = Array.from(conversationsMap.keys());
        const users = await userModel
            .find({ _id: { $in: userIds } })
            .select('FullName profilePic bio status')
            .lean();

        const userMap = new Map(users.map((u) => [String(u._id), u]));

        const conversationList = [];
        for (const [userId, convData] of conversationsMap.entries()) {
            const userData = userMap.get(userId);
            if (userData) {
                conversationList.push({
                    user: userData,
                    lastMessage: convData.lastMessage,
                    unreadCount: convData.unreadCount
                });
            }
        }

        return res.status(200).json({
            success: true,
            conversations: conversationList
        });
    } catch (error) {
        console.error('Error in getRecentConversations:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// 4. Mark messages from a specific sender as read
export const markAsRead = async (req, res) => {
    try {
        const myId = req.user._id;
        const { senderId } = req.params;

        await messageModel.updateMany(
            { senderId, receiverId: myId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        const io = getIO();
        if (io) {
            const senderSockets = getReceiverSocketIds(senderId);
            senderSockets.forEach((sockId) => {
                io.to(sockId).emit('messagesRead', { readerId: String(myId) });
            });
        }

        return res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error in markAsRead:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
