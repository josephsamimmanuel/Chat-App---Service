const express = require("express");
const connectDB = require("./config/database");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();

app.use(cors({
    origin: ["http://localhost:5173", "https://happychating.netlify.app"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/authRouter");    
const uploadRouter = require("./routes/uploadRoutes");
const onboardingRouter = require("./routes/onboardingRouter");
const userRouter = require("./routes/userRouter");
const friendRequestRouter = require("./routes/friendRequestRouter");
const chatRouter = require("./routes/chatRouter");

app.use("/api/auth", authRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/user", userRouter);
app.use("/api/friend-request", friendRequestRouter);
app.use("/api/chat", chatRouter);

connectDB().then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((err) => {
    console.log(err);
});

