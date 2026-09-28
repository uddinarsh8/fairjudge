const express = require("express");

const {
  createProject,
  getMyProject,
  getProjectByTeam,
} = require("../controllers/projectController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CREATE PROJECT
//
// POST /api/projects
//
// Team leader OR joined team member can submit
// the team's project.
//
// The backend verifies actual team membership.
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles(
    "TEAM",
    "MEMBER"
  ),
  createProject
);

// ======================================================
// GET MY PROJECT
//
// GET /api/projects/my
//
// Works for both:
// 1. Team leader
// 2. Joined team member
// ======================================================

router.get(
  "/my",
  protect,
  authorizeRoles(
    "TEAM",
    "MEMBER"
  ),
  getMyProject
);

// ======================================================
// GET PROJECT BY TEAM
//
// GET /api/projects/team/:teamId
//
// Team leader or joined member can access the
// project's details.
// ======================================================

router.get(
  "/team/:teamId",
  protect,
  authorizeRoles(
    "TEAM",
    "MEMBER"
  ),
  getProjectByTeam
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;