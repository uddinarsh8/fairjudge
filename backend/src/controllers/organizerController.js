const mongoose = require("mongoose");

const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { sendJudgeCredentials } = require("../services/emailService");

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

const generateJudgePassword = () => {
  const characterGroups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%&*",
  ];
  const allCharacters = characterGroups.join("");
  const passwordCharacters = characterGroups.map(
    (group) => group[crypto.randomInt(group.length)]
  );

  while (passwordCharacters.length < 8) {
    passwordCharacters.push(
      allCharacters[crypto.randomInt(allCharacters.length)]
    );
  }

  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(index + 1);
    [passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ];
  }

  return passwordCharacters.join("");
};

const createJudgeAccount = async (req, res) => {
  let judge;

  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const expertise = typeof req.body?.expertise === "string" ? req.body.expertise.trim() : "";

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Judge name and email are required",
      });
    }

    if (name.length > 120 || email.length > 254 || expertise.length > 300) {
      return res.status(400).json({
        success: false,
        message: "Name, email, or expertise exceeds the allowed length",
      });
    }

    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!validEmail) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    const existingUser = await User.findOne({ email }).select("role");
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.role === "JUDGE"
          ? "A judge account already exists for this email"
          : "An account already exists for this email",
      });
    }

    // Compare against existing judge hashes so generated passwords are unique
    // among judge accounts without storing any plaintext password.
    const existingJudgeHashes = await User.find({ role: "JUDGE" }).select("password");
    let temporaryPassword;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = generateJudgePassword();
      let alreadyUsed = false;
      for (const existingJudge of existingJudgeHashes) {
        if (await bcrypt.compare(candidate, existingJudge.password)) {
          alreadyUsed = true;
          break;
        }
      }
      if (!alreadyUsed) {
        temporaryPassword = candidate;
        break;
      }
    }

    if (!temporaryPassword) {
      return res.status(503).json({
        success: false,
        message: "Could not generate a unique judge password. Please try again.",
      });
    }

    judge = await User.create({
      name,
      email,
      expertise,
      password: await bcrypt.hash(temporaryPassword, 12),
      role: "JUDGE",
    });

    try {
      await sendJudgeCredentials({
        name: judge.name,
        email: judge.email,
        password: temporaryPassword,
      });
    } catch (emailError) {
      await User.deleteOne({ _id: judge._id });
      judge = null;
      console.error("Judge credentials email failed:", emailError.message);
      return res.status(503).json({
        success: false,
        message: "Could not send the judge login email. The account was not created. Check SMTP configuration and try again.",
      });
    }

    return res.status(201).json({
      success: true,
      message: `Judge login details sent to ${email}`,
      judge: {
        _id: judge._id,
        name: judge.name,
        email: judge.email,
        expertise: judge.expertise,
        role: judge.role,
        createdAt: judge.createdAt,
      },
    });
  } catch (error) {
    console.error("Create judge account error:", error);
    return res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message: error.code === 11000
        ? "An account already exists for this email"
        : "Failed to create judge account",
    });
  }
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
      .select("name email expertise role createdAt")
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
  createJudgeAccount,
  getHackathonTeams,
  getTeamRequests,
  approveTeam,
  rejectTeam,
  getHackathonRounds,
  getHackathonStats,
};
