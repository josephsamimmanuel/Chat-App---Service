const express = require("express");
const uploadRouter = express.Router();
const { upload } = require("../utils/cloudinary");
const User = require("../models/user");
const auth = require("../middleware/auth");

// Handle file uploads properly
uploadRouter.post("/upload", (req, res) => {
    upload.single("image")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message });
        }        
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        // Return the URL of the uploaded image
        return res.status(200).json({
            url: req.file.path,
            message: "Image uploaded successfully"
        });
    });
});

// New endpoint to update user's profile picture
uploadRouter.post("/update-profile-picture", auth, async (req, res) => {
    try {
        const { userId, imageUrl } = req.body;
        
        if (!userId || !imageUrl) {
            return res.status(400).json({ message: "User ID and image URL are required" });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: imageUrl },
            { new: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.status(200).json({
            message: "Profile picture updated successfully",
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

module.exports = uploadRouter;