const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error(
        "MONGODB_URI is not defined in .env"
      );
    }

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("=================================");
    console.log("MongoDB connected successfully");
    console.log("=================================");
  } catch (error) {
    console.error(
      "MongoDB connection failed:"
    );

    console.error(error.message);

    throw error;
  }
};

module.exports = connectDB;