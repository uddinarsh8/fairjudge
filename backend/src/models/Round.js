const mongoose = require("mongoose");

const roundSchema = new mongoose.Schema(
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

    description: {
      type: String,
      trim: true,
      default: "",
    },

    roundNumber: {
      type: Number,
      required: true,
      min: 1,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["UPCOMING", "ACTIVE", "COMPLETED"],
      default: "UPCOMING",
    },

    resultsReleased: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// A hackathon cannot have two rounds with the same round number
roundSchema.index(
  { hackathon: 1, roundNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Round", roundSchema);