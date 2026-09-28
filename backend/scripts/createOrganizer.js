require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../src/models/User");

const createOrganizer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Connected to MongoDB Atlas");

    const email = "admin@fairjudge.com";
    const password = "Admin@123456";
    const name = "FairJudge Admin";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("Organizer already exists.");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const organizer = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "ORGANIZER",
      isVerified: true,
    });

    console.log("Organizer created successfully!");
    console.log("Email:", organizer.email);
    console.log("Role:", organizer.role);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Failed to create organizer:", error.message);

    await mongoose.connection.close();
    process.exit(1);
  }
};

createOrganizer();