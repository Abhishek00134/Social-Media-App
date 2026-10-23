import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            index: true
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
            index: true
        },
        text: {
            type: String,
            trim: true,
            default: ''
        },
        mediaUrl: {
            type: String,
            default: ''
        },
        mediaType: {
            type: String,
            enum: ['text', 'image', 'video', 'file'],
            default: 'text'
        },
        isRead: {
            type: Boolean,
            default: false
        },
        readAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

// Compound index for fast conversation retrieval
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });

const messageModel = mongoose.model('message', messageSchema);

export default messageModel;
