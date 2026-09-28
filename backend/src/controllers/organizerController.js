const mongoose = require("mongoose");

const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");

// ======================================================
// OPTIONAL ROUND MODEL
// ======================================================

let Round = null;

try {
  Round = require("../models/Round");
} catch (error) {
  console.log(
    "Round model not found. Round statistics will use fallback values."
  );
}

// ======================================================
// HELPER
// ======================================================

const getUserId = (req) => {
  return (
    req.user?.userId ||
    req.user?.id ||
    req.user?._id
  );
};

// ======================================================
// VALIDATE OBJECT ID
// ======================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ======================================================
// GET ALL JUDGES
// GET /api/organizer/judges
// ======================================================

const getJudges = async (req, res) => {
  try {
    const organizerId = getUserId(req);

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const judges = await User.find({
      role: "JUDGE",
    })
      .select("name email role createdAt")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: judges.length,
      judges,
    });
  } catch (error) {
    console.error(
      "Get judges error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get judges",
      error: error.message,
    });
  }
};

// ======================================================
// GET HACKATHON TEAMS
// GET /api/organizer/hackathons/:hackathonId/teams
// ======================================================

const getHackathonTeams = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { hackathonId } = req.params;

    // ==================================================
    // VALIDATE HACKATHON ID
    // ==================================================

    if (!isValidObjectId(hackathonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID",
      });
    }

    // ==================================================
    // FIND HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findById(
        hackathonId
      );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found",
      });
    }

    // ==================================================
    // FIND TEAMS
    // ==================================================

    const teams = await Team.find({
      hackathon: hackathonId,
    })
      .populate(
        "leader",
        "name email role"
      )
      .populate(
        "reviewedBy",
        "name email role"
      )
      .populate(
        "project",
        "projectName problemStatement solution technologyStack githubUrl demoUrl presentationUrl status submittedAt lockedAt"
      )
      .sort({
        createdAt: -1,
      });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    console.error(
      "Get organizer hackathon teams error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get hackathon teams",
      error: error.message,
    });
  }
};

// ======================================================
// GET PENDING TEAM REQUESTS
// GET /api/organizer/hackathons/:hackathonId/team-requests
// ======================================================

const getTeamRequests = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { hackathonId } = req.params;

    // ==================================================
    // VALIDATE ID
    // ==================================================

    if (!isValidObjectId(hackathonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID",
      });
    }

    // ==================================================
    // CHECK HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findById(
        hackathonId
      );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found",
      });
    }

    // ==================================================
    // GET PENDING TEAMS
    // ==================================================

    const teams = await Team.find({
      hackathon: hackathonId,
      status: "PENDING",
    })
      .populate(
        "leader",
        "name email role"
      )
      .populate(
        "project",
        "projectName problemStatement solution technologyStack githubUrl demoUrl presentationUrl status submittedAt lockedAt"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: teams.length,
      teams,
    });
  } catch (error) {
    console.error(
      "Get team requests error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get team requests",
      error: error.message,
    });
  }
};

// ======================================================
// APPROVE TEAM
// PUT /api/organizer/teams/:teamId/approve
// ======================================================

const approveTeam = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { teamId } = req.params;

    // ==================================================
    // VALIDATE TEAM ID
    // ==================================================

    if (!isValidObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    // ==================================================
    // FIND TEAM
    // ==================================================

    const team =
      await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // ==================================================
    // CHECK STATUS
    // ==================================================

    if (team.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Team is already approved",
        team,
      });
    }

    if (team.status === "REJECTED") {
      return res.status(400).json({
        success: false,
        message:
          "A rejected team cannot be approved",
      });
    }

    // ==================================================
    // FIND HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findById(
        team.hackathon
      );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found",
      });
    }

    // ==================================================
    // APPROVE TEAM
    // ==================================================

    team.status = "APPROVED";

    team.reviewedBy =
      organizerId;

    team.reviewedAt =
      new Date();

    team.rejectionReason = "";

    await team.save();

    // ==================================================
    // POPULATE RESPONSE
    // ==================================================

    const populatedTeam =
      await Team.findById(
        team._id
      )
        .populate(
          "leader",
          "name email role"
        )
        .populate(
          "hackathon"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .populate(
          "project",
          "projectName problemStatement solution technologyStack githubUrl demoUrl presentationUrl status submittedAt lockedAt"
        );

    return res.status(200).json({
      success: true,
      message:
        "Team approved successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error(
      "Approve team error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team validation failed",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve team",
      error: error.message,
    });
  }
};

// ======================================================
// REJECT TEAM
// PUT /api/organizer/teams/:teamId/reject
// ======================================================

const rejectTeam = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { teamId } = req.params;

    const { reason } =
      req.body || {};

    // ==================================================
    // VALIDATE TEAM ID
    // ==================================================

    if (!isValidObjectId(teamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid team ID",
      });
    }

    // ==================================================
    // VALIDATE REASON
    // ==================================================

    if (
      !reason ||
      typeof reason !== "string" ||
      !reason.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required",
      });
    }

    // ==================================================
    // FIND TEAM
    // ==================================================

    const team =
      await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // ==================================================
    // CHECK STATUS
    // ==================================================

    if (team.status === "REJECTED") {
      return res.status(400).json({
        success: false,
        message:
          "Team is already rejected",
        team,
      });
    }

    if (team.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message:
          "An approved team cannot be rejected",
      });
    }

    // ==================================================
    // FIND HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findById(
        team.hackathon
      );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found",
      });
    }

    // ==================================================
    // REJECT TEAM
    // ==================================================

    team.status = "REJECTED";

    team.reviewedBy =
      organizerId;

    team.reviewedAt =
      new Date();

    team.rejectionReason =
      reason.trim();

    await team.save();

    // ==================================================
    // POPULATE RESPONSE
    // ==================================================

    const populatedTeam =
      await Team.findById(
        team._id
      )
        .populate(
          "leader",
          "name email role"
        )
        .populate(
          "hackathon"
        )
        .populate(
          "reviewedBy",
          "name email role"
        )
        .populate(
          "project",
          "projectName problemStatement solution technologyStack githubUrl demoUrl presentationUrl status submittedAt lockedAt"
        );

    return res.status(200).json({
      success: true,
      message:
        "Team rejected successfully",
      team: populatedTeam,
    });
  } catch (error) {
    console.error(
      "Reject team error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team validation failed",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject team",
      error: error.message,
    });
  }
};

// ======================================================
// GET HACKATHON ROUNDS
// GET /api/organizer/hackathons/:hackathonId/rounds
// ======================================================

const getHackathonRounds = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const { hackathonId } =
      req.params;

    // ==================================================
    // VALIDATE ID
    // ==================================================

    if (!isValidObjectId(hackathonId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon ID",
      });
    }

    // ==================================================
    // CHECK HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findById(
        hackathonId
      );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found",
      });
    }

    // ==================================================
    // CHECK ROUND MODEL
    // ==================================================

    if (!Round) {
      return res.status(200).json({
        success: true,
        count: 0,
        rounds: [],
        message:
          "Round model is not configured yet.",
      });
    }

    // ==================================================
    // FIND ROUNDS
    // ==================================================

    const rounds =
      await Round.find({
        hackathon: hackathonId,
      }).sort({
        order: 1,
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: rounds.length,
      rounds,
    });
  } catch (error) {
    console.error(
      "Get hackathon rounds error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get hackathon rounds",
      error: error.message,
    });
  }
};

// ======================================================
// GET HACKATHON STATISTICS
// GET /api/organizer/hackathons/:hackathonId/stats
// ======================================================

const getHackathonStats = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const { hackathonId } =
      req.params;

    // ==================================================
    // VALIDATE ID
    // ==================================================

    if (!isValidObjectId(hackathonId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon ID",
      });
    }

    // ==================================================
    // CHECK HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findById(
        hackathonId
      );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found",
      });
    }

    // ==================================================
    // COUNT TEAMS
    // ==================================================

    const teams =
      await Team.countDocuments({
        hackathon: hackathonId,
      });

    // ==================================================
    // COUNT JUDGES
    // ==================================================
    //
    // Currently counts users having JUDGE role.
    //
    // Once JudgeAssignment model is available,
    // this should be changed to count only judges
    // assigned to this hackathon.
    //
    // ==================================================

    const judges =
      await User.countDocuments({
        role: "JUDGE",
      });

    // ==================================================
    // COUNT ROUNDS
    // ==================================================

    let rounds = 0;

    if (Round) {
      rounds =
        await Round.countDocuments({
          hackathon: hackathonId,
        });
    }

    // ==================================================
    // COUNT EVALUATIONS
    // ==================================================
    //
    // Evaluation model has not been provided yet.
    //
    // Keep this at zero until its schema/controller
    // is confirmed.
    //
    // ==================================================

    const evaluations = 0;

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      stats: {
        teams,
        judges,
        rounds,
        evaluations,
      },
    });
  } catch (error) {
    console.error(
      "Get hackathon stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get hackathon statistics",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  getJudges,
  getHackathonTeams,
  getTeamRequests,
  approveTeam,
  rejectTeam,
  getHackathonRounds,
  getHackathonStats,
};