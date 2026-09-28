const mongoose = require("mongoose");

// ======================================================
// PROJECT SCHEMA
// ======================================================

const projectSchema = new mongoose.Schema(
  {
    // ======================================================
    // TEAM
    // ======================================================

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
      unique: true,
      index: true,
    },

    // ======================================================
    // HACKATHON
    // ======================================================

    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
      index: true,
    },

    // ======================================================
    // PROJECT NAME
    // ======================================================

    projectName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },

    // ======================================================
    // PROBLEM STATEMENT
    // ======================================================

    problemStatement: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================================
    // SOLUTION
    // ======================================================

    solution: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================================
    // TECHNOLOGY STACK
    // ======================================================

    technologyStack: {
      type: String,
      required: true,
      trim: true,
    },

    // ======================================================
    // GITHUB URL
    // ======================================================

    githubUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // ======================================================
    // DEMO URL
    // ======================================================

    demoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // ======================================================
    // PRESENTATION URL
    // ======================================================

    presentationUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // ======================================================
    // PROJECT STATUS
    // ======================================================

    status: {
      type: String,
      enum: [
        "DRAFT",
        "SUBMITTED",
        "LOCKED",
      ],
      default: "DRAFT",
      index: true,
    },

    // ======================================================
    // SUBMISSION INFORMATION
    // ======================================================

    submittedAt: {
      type: Date,
      default: null,
    },

    // ======================================================
    // LOCK INFORMATION
    // ======================================================

    lockedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// COMPOUND INDEX
// ======================================================
//
// Makes hackathon/project queries faster.
//
// ======================================================

projectSchema.index({
  hackathon: 1,
  status: 1,
});

// ======================================================
// EXPORT
// ======================================================

module.exports =
  mongoose.models.Project ||
  mongoose.model(
    "Project",
    projectSchema
  );