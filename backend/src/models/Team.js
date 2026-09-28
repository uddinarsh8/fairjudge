const mongoose = require("mongoose");

// ======================================================
// TEAM MEMBER SCHEMA
// ======================================================

const teamMemberSchema = new mongoose.Schema(
  {
    // ==================================================
    // MEMBER NAME
    // ==================================================

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // ==================================================
    // MEMBER EMAIL
    // ==================================================

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 150,
    },

    // ==================================================
    // MEMBER ROLE
    // ==================================================

    role: {
      type: String,
      default: "Member",
      trim: true,
      maxlength: 50,
    },
  },
  {
    _id: false,
  }
);

// ======================================================
// TEAM SCHEMA
// ======================================================

const teamSchema = new mongoose.Schema(
  {
    // ==================================================
    // PUBLIC TEAM ID
    // ==================================================
    //
    // This is the ID that participants can share with
    // teammates to join the team.
    //
    // Example:
    //
    // TEAM-7K4P92
    //
    // This is separate from MongoDB's _id.
    // ==================================================

    teamId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    // ==================================================
    // HACKATHON
    // ==================================================

    hackathon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hackathon",
      required: true,
      index: true,
    },

    // ==================================================
    // TEAM LEADER
    // ==================================================

    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==================================================
    // TEAM NAME
    // ==================================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // ==================================================
    // TEAM MEMBERS
    // ==================================================

    members: {
      type: [teamMemberSchema],
      default: [],
    },

    // ==================================================
    // PROJECT
    // ==================================================

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },

    // ==================================================
    // TEAM STATUS
    //
    // PENDING  = Waiting for organizer approval
    // APPROVED = Accepted by organizer
    // REJECTED = Rejected by organizer
    // ==================================================

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
      ],
      default: "PENDING",
      required: true,
      index: true,
    },

    // ==================================================
    // REVIEWED BY
    // ==================================================

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ==================================================
    // REVIEW DATE
    // ==================================================

    reviewedAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // REJECTION REASON
    // ==================================================

    rejectionReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// UNIQUE TEAM PER LEADER + HACKATHON
// ======================================================
//
// One leader cannot create multiple teams for the
// same hackathon.
//
// Hackathon A + User A
//       ↓
// One team
//
// Hackathon B + User A
//       ↓
// Another team is allowed
// ======================================================

teamSchema.index(
  {
    hackathon: 1,
    leader: 1,
  },
  {
    unique: true,
  }
);

// ======================================================
// UNIQUE PUBLIC TEAM ID
// ======================================================
//
// teamId itself is already marked unique above.
//
// This explicit index also makes lookups such as:
//
// Team.findOne({ teamId: "TEAM-7K4P92" })
//
// efficient.
// ======================================================

teamSchema.index({
  teamId: 1,
});

// ======================================================
// HACKATHON + STATUS INDEX
// ======================================================

teamSchema.index({
  hackathon: 1,
  status: 1,
  createdAt: -1,
});

// ======================================================
// REVIEW HISTORY INDEX
// ======================================================

teamSchema.index({
  reviewedBy: 1,
  reviewedAt: -1,
});

// ======================================================
// EXPORT
// ======================================================

module.exports =
  mongoose.models.Team ||
  mongoose.model("Team", teamSchema);