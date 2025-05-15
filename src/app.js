const express = require("express");
const connectDB = require("./config/database");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const userRouter = require("./routes/authRouter");    
const uploadRouter = require("./routes/uploadRoutes");

app.use("/api/auth", userRouter);
app.use("/api/upload", uploadRouter);

connectDB().then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
    });
}).catch((err) => {
    console.log(err);
});

