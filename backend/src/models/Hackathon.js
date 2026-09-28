const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema(
  {
    // =====================================================
    // UNIQUE PUBLIC HACKATHON ID
    // Example: HACK-7F3A91
    // =====================================================

    hackathonId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // =====================================================
    // NAME
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // DESCRIPTION
    // =====================================================

    description: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // DATES
    // =====================================================

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: [
        "DRAFT",
        "UPCOMING",
        "ACTIVE",
        "COMPLETED",
      ],
      default: "DRAFT",
    },

    // =====================================================
    // PUBLISH STATUS
    //
    // A hackathon can only become published after
    // organizer completes the required configuration.
    // =====================================================

    isPublished: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // SETUP STATUS
    // =====================================================

    setup: {
      roundsConfigured: {
        type: Boolean,
        default: false,
      },

      evaluationConfigured: {
        type: Boolean,
        default: false,
      },
    },

    // =====================================================
    // ORGANIZER
    // =====================================================

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Hackathon ||
  mongoose.model("Hackathon", hackathonSchema);