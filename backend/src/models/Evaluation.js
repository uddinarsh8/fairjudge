const mongoose = require("mongoose");

// ======================================================
// SCORE SCHEMA
// ======================================================

const scoreSchema = new mongoose.Schema(
  {
    criterion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EvaluationCriteria",
      required: true,
    },

    criterionName: {
      type: String,
      required: true,
      trim: true,
    },

    weight: {
      type: Number,
      required: true,
    },

    selectedLevel: {
      type: String,
      enum: [
        "BEST",
        "GOOD",
        "AVERAGE",
        "POOR",
        "WORST",
      ],
      required: true,
    },

    score: {
      type: Number,
      required: true,
    },

    weightedScore: {
      type: Number,
      required: true,
    },

    comment: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    _id: false,
  }
);


// ======================================================
// EVALUATION SCHEMA
// ======================================================

const evaluationSchema = new mongoose.Schema(
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

    judge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JudgeAssignment",
      required: true,
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    scores: {
      type: [scoreSchema],
      required: true,
    },

    finalScore: {
      type: Number,
      required: true,
      default: 0,
    },

    overallComment: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
      ],
      default: "DRAFT",
    },
  },
  {
    timestamps: true,
  }
);


// ======================================================
// PREVENT DUPLICATE EVALUATION
// One judge can evaluate one assignment once
// ======================================================

evaluationSchema.index(
  {
    assignment: 1,
    judge: 1,
  },
  {
    unique: true,
  }
);


module.exports =
  mongoose.model(
    "Evaluation",
    evaluationSchema
  );