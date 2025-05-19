const express = require('express');
const userRouter = express.Router();
const User = require('../models/user');
const { generateStreamToken } = require('../utils/stream');
const auth = require('../middleware/auth');
const FriendRequest = require('../models/friendRequest');

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

        // Find all pending friend requests involving the current user
        const pendingRequests = await FriendRequest.find({
            $or: [
                { sender: userId, status: "pending" },
                { receiver: userId, status: "pending" }
            ]
        });

        // Find all declined friend requests involving the current user
        const declinedRequests = await FriendRequest.find({
            $or: [
                { sender: userId, status: "declined" },
                { receiver: userId, status: "declined" }
            ]
        });


        // Get IDs of users involved in pending requests
        const pendingUserIds = pendingRequests.map(request => {
            return request.sender.toString() === userId 
                ? request.receiver.toString() 
                : request.sender.toString();
        });

        // Get Ids of users involved in declined requests
        const declinedUserIds = declinedRequests.map(request => {
            return request.sender.toString() === userId 
                ? request.receiver.toString() 
                : request.sender.toString();
        });

        // Find users who:
        // 1. Are not the current user
        // 2. Are not already friends with the current user
        // 3. Have completed onboarding
        // 4. Are not involved in any pending friend requests
        // 5. Match either native or learning language preferences
        const recommendedUsers = await User.find({
            $and: [
                { _id: { $ne: userId } }, // Not the current user
                { _id: { $nin: user.friends || [] } }, // Not already friends
                { _id: { $nin: pendingUserIds } }, // Not in pending requests
                { _id: { $nin: declinedUserIds } }, // Not in declined requests
                { isOnboarding: true }, // Has completed onboarding

                // Suppose you're this user:
                // {
                //  _id: 682591dae154d21c4e6d8e14,
                //  username: "Joseph Sam Immanuel",
                //  nativeLanguage: "Tamil",
                //  learningLanguage: "Hindi",
                //  friends: []
                // }
                // Your logic tries to find users who either:
                // speak Hindi → nativeLanguage: "Hindi"
                // want to learn Tamil → learningLanguage: "Tamil"
                // {
                //     $or: [
                        // Match language preferences
                //         { nativeLanguage: user.learningLanguage },
                //         { learningLanguage: user.nativeLanguage }
                //     ]
                // }
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








