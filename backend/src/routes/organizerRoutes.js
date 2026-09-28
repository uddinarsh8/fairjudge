const express = require("express");

const {
  getJudges,
  getHackathonTeams,
  getTeamRequests,
  approveTeam,
  rejectTeam,
  getHackathonRounds,
  getHackathonStats,
} = require("../controllers/organizerController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// GET ALL JUDGES
// GET /api/organizer/judges
// ======================================================

router.get(
  "/judges",
  protect,
  authorizeRoles("ORGANIZER"),
  getJudges
);

// ======================================================
// GET HACKATHON TEAMS
// GET /api/organizer/hackathons/:hackathonId/teams
// ======================================================

router.get(
  "/hackathons/:hackathonId/teams",
  protect,
  authorizeRoles("ORGANIZER"),
  getHackathonTeams
);

// ======================================================
// GET PENDING TEAM REQUESTS
// GET /api/organizer/hackathons/:hackathonId/team-requests
// ======================================================

router.get(
  "/hackathons/:hackathonId/team-requests",
  protect,
  authorizeRoles("ORGANIZER"),
  getTeamRequests
);

// ======================================================
// APPROVE TEAM
// PUT /api/organizer/teams/:teamId/approve
// ======================================================

router.put(
  "/teams/:teamId/approve",
  protect,
  authorizeRoles("ORGANIZER"),
  approveTeam
);

// ======================================================
// REJECT TEAM
// PUT /api/organizer/teams/:teamId/reject
// ======================================================

router.put(
  "/teams/:teamId/reject",
  protect,
  authorizeRoles("ORGANIZER"),
  rejectTeam
);

// ======================================================
// GET HACKATHON ROUNDS
// GET /api/organizer/hackathons/:hackathonId/rounds
// ======================================================

router.get(
  "/hackathons/:hackathonId/rounds",
  protect,
  authorizeRoles("ORGANIZER"),
  getHackathonRounds
);

// ======================================================
// GET HACKATHON STATISTICS
// GET /api/organizer/hackathons/:hackathonId/stats
// ======================================================

router.get(
  "/hackathons/:hackathonId/stats",
  protect,
  authorizeRoles("ORGANIZER"),
  getHackathonStats
);

module.exports = router;