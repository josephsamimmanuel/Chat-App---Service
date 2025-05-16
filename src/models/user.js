const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: ""
    },
    nativeLanguage: {
        type: String,
        default: ""
    },
    learningLanguage: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    isOnboarding: {
        type: Boolean,
        default: false
    },
    friends: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
        
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
