import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        type: {
            type: String,
            enum: ['story_reaction', 'story_view', 'post_like', 'post_comment', 'friend_request', 'friend_accept', 'general'],
            default: 'general'
        },
        story: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'story'
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'post'
        },
        reactionEmoji: {
            type: String,
            default: ''
        },
        message: {
            type: String,
            required: true
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const notificationModel = mongoose.model('notification', notificationSchema);

export default notificationModel;
