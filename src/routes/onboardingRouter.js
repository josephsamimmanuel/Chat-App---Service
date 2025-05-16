const express = require('express');
const onboardingRouter = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/user');
const { upsertStreamUser } = require('../utils/stream');

onboardingRouter.post('/onboarding', auth, async (req, res) => {
    const { username, bio, location, nativeLanguage, learningLanguage, profilePicture } = req.body;
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.username = username;
        user.profilePicture = profilePicture;
        user.bio = bio;
        user.location = location;
        user.nativeLanguage = nativeLanguage;
        user.learningLanguage = learningLanguage;
        user.isOnboarding = true;
        await user.save();

        console.log('MongoDB User updated:', user);

        try {
            await upsertStreamUser({
                id: user._id.toString(),
                name: user.username,
                username: user.username,
                image: user.profilePicture,
                bio: user.bio,
                location: user.location,
                nativeLanguage: user.nativeLanguage,
                learningLanguage: user.learningLanguage,
            });
            console.log('Stream user created successfully:', `${user.username}`);
        } catch (streamError) {
            console.error('Stream user creation error:', streamError);
        }

        res.status(200).json({ 
            message: 'Onboarding completed',
            user: user
        });
        
    } catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ 
            message: 'Failed to complete onboarding process',
            error: error.message
        });
    }
});

module.exports = onboardingRouter;

