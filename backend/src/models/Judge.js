const mongoose = require("mongoose");

const judgeSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    specialization: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent the same email from being added
// multiple times to the same hackathon
judgeSchema.index(
  {
    hackathon: 1,
    email: 1,
  },
  {
    unique: true,
  }
);

module.exports =
  mongoose.model(
    "Judge",
    judgeSchema
  );