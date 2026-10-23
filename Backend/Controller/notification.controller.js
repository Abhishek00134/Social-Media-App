import notificationModel from '../models/notification.js';

export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await notificationModel
            .find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('sender', 'FullName email profilePic')
            .populate('story', 'mediaUrl mediaType caption')
            .populate('post', 'content');

        const unreadCount = await notificationModel.countDocuments({
            recipient: req.user._id,
            isRead: false
        });

        return res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error in getMyNotifications:', error);
        return res.status(500).json({ message: 'Internal server error getting notifications' });
    }
};

export const markNotificationsAsRead = async (req, res) => {
    try {
        const { id } = req.body; // optional: if provided mark single, else mark all for user

        if (id) {
            await notificationModel.findOneAndUpdate(
                { _id: id, recipient: req.user._id },
                { isRead: true }
            );
        } else {
            await notificationModel.updateMany(
                { recipient: req.user._id, isRead: false },
                { isRead: true }
            );
        }

        return res.status(200).json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error('Error in markNotificationsAsRead:', error);
        return res.status(500).json({ message: 'Internal server error updating notifications' });
    }
};

export const clearNotifications = async (req, res) => {
    try {
        await notificationModel.deleteMany({ recipient: req.user._id });
        return res.status(200).json({ message: 'All notifications cleared successfully' });
    } catch (error) {
        console.error('Error in clearNotifications:', error);
        return res.status(500).json({ message: 'Internal server error clearing notifications' });
    }
};
