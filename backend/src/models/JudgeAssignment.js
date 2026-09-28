const mongoose = require("mongoose");

// ======================================================
// JUDGE ASSIGNMENT SCHEMA
// ======================================================
//
// An assignment connects:
//
// Hackathon
//    ↓
// Evaluation Round
//    ↓
// Judge
//    ↓
// Team
//    ↓
// Project (optional)
//
// IMPORTANT:
// Project is optional because a judge can be assigned
// to a team before that team submits its project.
// ======================================================

const judgeAssignmentSchema =
  new mongoose.Schema(
    {
      // ==================================================
      // HACKATHON
      // ==================================================

      hackathon: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Hackathon",
        required: true,
        index: true,
      },

      // ==================================================
      // EVALUATION ROUND
      // ==================================================

      round: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Round",
        required: true,
        index: true,
      },

      // ==================================================
      // JUDGE
      // ==================================================

      judge: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      // ==================================================
      // TEAM
      // ==================================================
      //
      // The judge is assigned to a TEAM.
      //
      // This is required.
      // ==================================================

      team: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true,
        index: true,
      },

      // ==================================================
      // PROJECT
      // ==================================================
      //
      // OPTIONAL.
      //
      // A team may not have submitted a project yet
      // when the judge assignment is created.
      //
      // Before project submission:
      //
      // project = null
      //
      // After project submission:
      //
      // project = Project._id
      // ==================================================

      project: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Project",
        default: null,
        index: true,
      },

      // ==================================================
      // ASSIGNMENT STATUS
      // ==================================================

      status: {
        type: String,

        enum: [
          "ASSIGNED",
          "ACTIVE",
          "COMPLETED",
        ],

        default: "ASSIGNED",

        index: true,
      },
    },

    {
      timestamps: true,
    }
  );

// ======================================================
// DUPLICATE ASSIGNMENT PROTECTION
// ======================================================
//
// Prevent the same judge from being assigned to the
// same team for the same round more than once.
//
// Example:
//
// Judge A + Team A + Round 1
//          ↓
// Only one assignment allowed.
//
// Judge A + Team B + Round 1
//          ↓
// Allowed.
//
// Judge A + Team A + Round 2
//          ↓
// Allowed.
// ======================================================

judgeAssignmentSchema.index(
  {
    hackathon: 1,
    round: 1,
    judge: 1,
    team: 1,
  },
  {
    unique: true,
  }
);

// ======================================================
// EXPORT
// ======================================================

module.exports =
  mongoose.models.JudgeAssignment ||
  mongoose.model(
    "JudgeAssignment",
    judgeAssignmentSchema
  );