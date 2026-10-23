import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        mediaUrl: {
            type: String,
            required: true
        },
        mediaType: {
            type: String,
            enum: ['image', 'video'],
            default: 'image'
        },
        caption: {
            type: String,
            default: '',
            trim: true
        },
        backgroundColor: {
            type: String,
            default: ''
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
            index: { expires: '1s' }
        },
        viewers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        ],
        reactions: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'user',
                    required: true
                },
                emoji: {
                    type: String,
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    { timestamps: true }
);

const storyModel = mongoose.model('story', storySchema);

export default storyModel;
