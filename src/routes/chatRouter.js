const express = require("express");
const chatRouter = express.Router();
const auth = require("../middleware/auth");
const { StreamChat } = require('stream-chat');
const { generateStreamToken } = require("../utils/stream");
const User = require("../models/user");

// Initialize Stream Chat client
const api_key = process.env.STREAMIFY_API_KEY;
const api_secret = process.env.STREAMIFY_API_SECRET;
const serverClient = StreamChat.getInstance(api_key, api_secret);

// Middleware to check if the user is authenticated
chatRouter.use(auth);

// Generate token for Stream Chat
chatRouter.get("/token", auth, async (req, res) => {
    try {
        const { userId } = req.user;
        
        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate token
        const token = generateStreamToken(userId);
        
        res.status(200).json({ 
            token,
            user: {
                id: user._id.toString(),
                name: user.username,
                image: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({ 
            message: "Failed to generate token",
            error: error.message 
        });
    }
});

// Create or join a chat channel
chatRouter.post("/channel", auth, async (req, res) => {
    try {
        const { userId } = req.user;
        const { memberId } = req.body;

        // Validate member ID
        if (!memberId) {
            return res.status(400).json({ message: "Member ID is required" });
        }

        // Get both users
        const [currentUser, otherUser] = await Promise.all([
            User.findById(userId),
            User.findById(memberId)
        ]);

        if (!currentUser || !otherUser) {
            return res.status(404).json({ message: "One or both users not found" });
        }

        // Create unique channel ID (sorted to ensure consistency)
        const members = [userId, memberId].sort();
        const channelId = `messaging:${members.join('-')}`;

        // Create or get channel
        const channel = serverClient.channel('messaging', channelId, {
            members,
            created_by_id: userId
        });

        await channel.create();

        res.status(200).json({
            message: "Channel created successfully",
            channel: {
                id: channel.id,
                type: channel.type,
                members: channel.members
            }
        });
    } catch (error) {
        console.error('Channel creation error:', error);
        res.status(500).json({ 
            message: "Failed to create channel",
            error: error.message 
        });
    }
});

// Get user's channels
chatRouter.get("/channels", auth, async (req, res) => {
    try {
        const { userId } = req.user;

        // Get user's channels from Stream
        const filter = { 
            type: 'messaging',
            members: { $in: [userId.toString()] }
        };
        
        const channels = await serverClient.queryChannels(filter, {}, {
            watch: false,
            state: true,
            presence: false
        });

        res.status(200).json({
            channels: channels.map(channel => ({
                id: channel.id,
                type: channel.type,
                members: channel.members,
                lastMessage: channel.state.messages[channel.state.messages.length - 1]
            }))
        });
    } catch (error) {
        console.error('Channels fetch error:', error);
        res.status(500).json({ 
            message: "Failed to fetch channels",
            error: error.message 
        });
    }
});

// Delete a channel
chatRouter.delete("/channel/:channelId", auth, async (req, res) => {
    try {
        const { channelId } = req.params;
        const { userId } = req.user;

        const channel = serverClient.channel('messaging', channelId);
        
        // Verify channel exists and user is a member
        const state = await channel.query({ state: true });
        if (!state.channel.members.includes(userId.toString())) {
            return res.status(403).json({ message: "Not authorized to delete this channel" });
        }

        await channel.delete();

        res.status(200).json({ message: "Channel deleted successfully" });
    } catch (error) {
        console.error('Channel deletion error:', error);
        res.status(500).json({ 
            message: "Failed to delete channel",
            error: error.message 
        });
    }
});

module.exports = chatRouter;

