import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        content: {
            type: String,
            default: '',
            trim: true
        },
        mediaUrl: {
            type: String,
            default: ''
        },
        mediaType: {
            type: String,
            enum: ['image', 'video', null],
            default: null
        },
        feeling: {
            emoji: { type: String, default: '' },
            text: { type: String, default: '' }
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        ],
        dislikes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        ],
        shares: {
            type: Number,
            default: 0
        },
        comments: [commentSchema]
    },
    { timestamps: true }
);

const postModel = mongoose.model('post', postSchema);

export default postModel;
