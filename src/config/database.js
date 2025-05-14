require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI;
const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

module.exports = connectDB;
