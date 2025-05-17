const express = require("express");
const userRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("../middleware/auth");
const { upsertStreamUser } = require("../utils/stream");

// Register a new user
userRouter.post("/register", async (req, res) => {
    const { username, email, password, profilePicture } = req.body;
    console.log(req.body);
    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const index = Math.floor(Math.random() * 100) + 1;
        const randomProfilePicture = `https://avatar.iran.liara.run/public/${index}.png`;

        const hashedPassword = await bcrypt.hash(password, 6);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            profilePicture: randomProfilePicture
        });
        await newUser.save();

        try {
            await upsertStreamUser({
                id: newUser._id,
                name: newUser.username,
                email: newUser.email,
                password: newUser.password,
                image: newUser.profilePicture || randomProfilePicture
            });
            console.log(`Stream user created for ${newUser.username}`);
        } catch (error) {
            console.log(error);
        }

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

// Login a user
userRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            maxAge: 3600000,
            sameSite: "none"
        });
        res.status(200).json({
            message: "Login successful",
            token,
            data: user
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

// Logout a user
userRouter.post("/logout", async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
})

// Get current user
userRouter.get("/current", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        res.status(200).json({ message: "Current user", data: user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
})

module.exports = userRouter;
