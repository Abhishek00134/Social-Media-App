import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        FullName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6
        },
        profilePic: {
            type: String,
            default: ''
        },
        bio: {
            type: String,
            default: 'Hey there! I am using PulseChat.'
        },
        status: {
            type: String,
            default: 'Available'
        },
        isPrivate: {
            type: Boolean,
            default: false
        },
        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            }
        ],
        friendRequests: [
            {
                from: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'user',
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        sentRequests: [
            {
                to: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'user',
                    required: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        refreshToken: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

const userModel = mongoose.model('user', userSchema);

export default userModel;