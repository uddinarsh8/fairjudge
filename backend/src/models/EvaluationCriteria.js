const mongoose = require("mongoose");

const scoringLevelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["BEST", "GOOD", "AVERAGE", "POOR", "WORST"],
    },

    score: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const evaluationCriteriaSchema = new mongoose.Schema(
  {
    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
    },

    round: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Round",
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
    },

    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    scoringLevels: {
      type: [scoringLevelSchema],
      required: true,
      validate: {
        validator: function (levels) {
          return levels.length === 5;
        },
        message:
          "Each criterion must have exactly 5 scoring levels",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "EvaluationCriteria",
  evaluationCriteriaSchema
);