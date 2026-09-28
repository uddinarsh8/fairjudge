const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // NAME
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // EMAIL
    // =====================================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // =====================================================
    // PASSWORD
    // =====================================================

    password: {
      type: String,
      required: true,
    },

    // =====================================================
    // ROLE
    // =====================================================

    role: {
      type: String,

      enum: [
        "ADMIN",
        "TEAM",
        "MEMBER",
        "JUDGE",
        "ORGANIZER",
      ],

      default: "TEAM",
    },
  },

  {
    timestamps: true,
  }
);

// =====================================================
// EXPORT MODEL
// =====================================================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);