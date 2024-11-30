const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {   
        // Mongoose automatically creates indexes for unique fields for performance
        
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            minLength: [3, 'Username must be at least 3 characters long'],
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: [/.+@.+\..+/, 'Please use a valid email address'],
        },
        password: {
            type: String,
            required: true,
            minLength: 8,
            match: [
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                'Password must be 8 characters minimum, and include uppercase, lowercase, a number, and a special character',
            ],
            trim: true,
        },
        // optional for potential OAuth integration in future
        oauthProvider: {
            type: String,
            default: null,
        },
        oauthId: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            enum: ['Admin', 'TeamMember'], // possible roles
            default: 'TeamMember',
        },
        profile: {
            fullName: {
                type: String,
                trim: true,
                default: '',
            },
            avatarUrl: {
                type: String,
                default: '',
                match: [
                    /^https?:\/\/.+\.(jpg|jpeg|png|gif|svg)$/,
                    'Invalid URL for avatar',
                ],
            },
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        //  these fields allow us to delete users, but keep their data in the database 
        isActive: {
            type: Boolean,
            default: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

module.exports = {
    User,
};
