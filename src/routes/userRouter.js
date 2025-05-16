const express = require('express');
const userRouter = express.Router();
const User = require('../models/user');
const { generateStreamToken } = require('../utils/stream');
const auth = require('../middleware/auth');

// Get Recommended Users
userRouter.get('/recommended', auth, async (req, res) => {
    try {
        const { userId } = req.user;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Find users who:
        // 1. Are not the current user
        // 2. Are not already friends with the current user
        // 3. Have completed onboarding
        // 4. Match either native or learning language preferences
        const recommendedUsers = await User.find({
            $and: [
                { _id: { $ne: userId } }, // Not the current user
                { _id: { $nin: user.friends || [] } }, // Not already friends
                { isOnboarding: true }, // Has completed onboarding
                {
                    $or: [
                        // Match language preferences
                        { nativeLanguage: user.learningLanguage },
                        { learningLanguage: user.nativeLanguage }
                    ]
                }
            ]
        }).select('username profilePicture bio nativeLanguage learningLanguage location')
          .limit(10); // Limit results for better performance

        res.status(200).json({
            message: 'Recommended users fetched successfully',
            users: recommendedUsers
        });
    } catch (error) {
        console.error('Error fetching recommended users:', error);
        res.status(500).json({
            message: 'Failed to fetch recommended users',
            error: error.message
        });
    }
});

// Get My Friends
userRouter.get('/friends', auth, async (req, res) => {
    try {
        const { userId } = req.user;
        
        // Find user and populate friends in one query
        const user = await User.findById(userId)
            .populate({
                path: 'friends',
                select: 'username profilePicture bio nativeLanguage learningLanguage location isOnline lastSeen',
                match: { isOnboarding: true } // Only get friends who have completed onboarding
            });

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // Filter out any null values that might result from the match condition
        const friends = user.friends.filter(friend => friend);

        res.status(200).json({
            message: 'Friends fetched successfully',
            users: friends
        });
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({
            message: 'Failed to fetch friends',
            error: error.message
        });
    }
});

module.exports = userRouter;








