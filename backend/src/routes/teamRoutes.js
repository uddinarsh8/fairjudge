const express = require("express");

const {
  createTeam,
  joinTeam,
  getMyTeam,
  getHackathonTeams,
  approveTeam,
  rejectTeam,
  leaveHackathon,
} = require("../controllers/teamController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CREATE TEAM
//
// POST /api/teams
//
// Logged-in TEAM user creates a new team.
//
// The backend automatically generates a unique
// public Team ID such as:
//
// TEAM-A7F29C
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles("TEAM"),
  createTeam
);

// ======================================================
// JOIN EXISTING TEAM
//
// POST /api/teams/join
//
// Body:
//
// {
//   "hackathon": "HACK-7F3A91",
//   "teamId": "TEAM-A7F29C"
// }
//
// TEAM or MEMBER users can join an existing team.
// ======================================================

router.post(
  "/join",
  protect,
  authorizeRoles(
    "TEAM",
    "MEMBER"
  ),
  joinTeam
);

// ======================================================
// GET MY TEAM
//
// GET /api/teams/my/:hackathonId
//
// Works for both:
//
// 1. Team leader
// 2. Joined team member
// ======================================================

router.get(
  "/my/:hackathonId",
  protect,
  authorizeRoles(
    "TEAM",
    "MEMBER"
  ),
  getMyTeam
);

// ======================================================
// GET ALL TEAMS FOR HACKATHON
//
// GET /api/teams/hackathon/:hackathonId
//
// Organizer/Admin can view teams.
// ======================================================

router.get(
  "/hackathon/:hackathonId",
  protect,
  authorizeRoles(
    "ORGANIZER",
    "ADMIN"
  ),
  getHackathonTeams
);
// ======================================================
// LEAVE HACKATHON
//
// POST /api/teams/leave-hackathon
//
// Team leader/member can leave their current hackathon.
// ======================================================

router.post(
  "/leave-hackathon",
  protect,
  authorizeRoles(
    "TEAM",
    "MEMBER"
  ),
  leaveHackathon
);

// ======================================================
// APPROVE TEAM
//
// PATCH /api/teams/:teamId/approve
//
// Organizer/Admin only.
// ======================================================

router.patch(
  "/:teamId/approve",
  protect,
  authorizeRoles(
    "ORGANIZER",
    "ADMIN"
  ),
  approveTeam
);

// ======================================================
// REJECT TEAM
//
// PATCH /api/teams/:teamId/reject
//
// Body:
//
// {
//   "reason": "Team does not meet the requirements."
// }
//
// Organizer/Admin only.
// ======================================================

router.patch(
  "/:teamId/reject",
  protect,
  authorizeRoles(
    "ORGANIZER",
    "ADMIN"
  ),
  rejectTeam
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;