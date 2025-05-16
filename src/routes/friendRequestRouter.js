const express = require("express");
const friendRequestRouter = express.Router();
const User = require("../models/user");
const auth = require("../middleware/auth");
const FriendRequest = require("../models/friendRequest");

// Send Friend Request
friendRequestRouter.post("/send/:receiverId", auth, async (req, res) => {
    try {
        const { userId } = req.user;
        const { receiverId } = req.params;

        // Check if the sender and receiver are the same user
        if (userId === receiverId) {
            return res.status(400).json({
                message: "You cannot send a friend request to yourself"
            });
        }

        // Check if the receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({
                message: "Receiver not found"
            });
        }

        // Check if user is already friends with the receiver
        const isAlreadyFriends = receiver.friends.includes(userId);
        if (isAlreadyFriends) {
            return res.status(400).json({
                message: "You are already friends with this user"
            });
        }

        // Check if the request is already sent
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: userId, receiver: receiverId },
                { sender: receiverId, receiver: userId }
            ]
        });
        if (existingRequest) {
            return res.status(400).json({
                message: "Friend request already sent"
            });
        }
        
        // Create a new friend request
        const newRequest = new FriendRequest({
            sender: userId,
            receiver: receiverId
        });
        await newRequest.save();
        
        res.status(201).json({
            message: "Friend request sent successfully",
            request: newRequest
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to send friend request",
            error: error.message
        });
    }
});

// Accept Friend Request
friendRequestRouter.post("/accept/:requestId", auth, async (req, res) => {
    try {
        const { userId } = req.user;
        const { requestId } = req.params;
        
        // Check if the request exists
        const request = await FriendRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                message: "Friend request not found"
            });
        }

        // Check if the request is already accepted
        if (request.status === "accepted") {
            return res.status(400).json({
                message: "Friend request already accepted"
            });
        }

        // Check if the request is from the user
        if (request.receiver.toString() !== userId) {
            return res.status(403).json({
                message: "You are not authorized to accept this friend request"
            });
        }

        // Update the request status
        request.status = "accepted";
        await request.save();

        // Add each user to the other's friends list
        // $addToSet: adds elements to an array only if they do not already exist in the array
        await User.findByIdAndUpdate(userId, { $addToSet: { friends: receiverId } });
        await User.findByIdAndUpdate(receiverId, { $addToSet: { friends: userId } });

        res.status(200).json({
            message: "Friend request accepted successfully",
            request: request
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to accept friend request",
            error: error.message
        });
    }
});

// get all friend requests which are pending
friendRequestRouter.get("/get-all-friend-requests", auth, async (req, res) => {
    try {
        const { userId } = req.user;

        const incomingRequests = await FriendRequest.find({ receiver: userId, status: "pending" }).populate("sender", "username profilePicture nativeLanguage learningLanguage");
        const outgoingRequests = await FriendRequest.find({ sender: userId, status: "pending" }).populate("receiver", "username profilePicture nativeLanguage learningLanguage");
        const acceptedRequests = await FriendRequest.find({ $or: [{ sender: userId }, { receiver: userId }], status: "accepted" }).populate("sender", "username profilePicture nativeLanguage learningLanguage").populate("receiver", "username profilePicture nativeLanguage learningLanguage");

        res.status(200).json({
            message: "Friend requests fetched successfully",
            incomingRequests: incomingRequests,
            outgoingRequests: outgoingRequests,
            acceptedRequests: acceptedRequests
        });
        
    } catch (error) {
        res.status(500).json({
            message: "Failed to get friend requests",
            error: error.message
        });
    }
});

module.exports = friendRequestRouter;

