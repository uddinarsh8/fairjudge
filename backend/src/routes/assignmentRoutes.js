const express = require("express");

const {
  createAssignment,
  getAssignmentsForHackathon,
  getMyAssignments,
  getAssignmentById,
} = require("../controllers/assignmentController");

const {
  removeAssignment,
} = require("../controllers/judgeAssignmentController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CREATE ASSIGNMENT
// Organizer only
//
// POST /api/assignments
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles("ORGANIZER"),
  createAssignment
);

// ======================================================
// GET ALL ASSIGNMENTS FOR HACKATHON
// Organizer only
//
// GET /api/assignments/hackathon/:hackathonId
// ======================================================

router.get(
  "/hackathon/:hackathonId",
  protect,
  authorizeRoles("ORGANIZER"),
  getAssignmentsForHackathon
);

// ======================================================
// DELETE ASSIGNMENT
// Organizer only
//
// Preferred:
// DELETE /api/assignments/:hackathonId/:assignmentId
//
// This matches the current removeAssignment controller.
// ======================================================

router.delete(
  "/:hackathonId/:assignmentId",
  protect,
  authorizeRoles("ORGANIZER"),
  removeAssignment
);

// ======================================================
// GET MY ASSIGNMENTS
// Judge only
//
// GET /api/assignments/judge/my
//
// IMPORTANT:
// The Judge dashboard is requesting /judge/my.
// ======================================================

router.get(
  "/judge/my",
  protect,
  authorizeRoles("JUDGE"),
  getMyAssignments
);

// ======================================================
// BACKWARD-COMPATIBLE GET MY ASSIGNMENTS
//
// GET /api/assignments/my
//
// Keeping this route prevents older frontend code
// from breaking.
// ======================================================

router.get(
  "/my",
  protect,
  authorizeRoles("JUDGE"),
  getMyAssignments
);

// ======================================================
// GET SINGLE ASSIGNMENT
// Judge only
//
// GET /api/assignments/:assignmentId
// ======================================================

router.get(
  "/:assignmentId",
  protect,
  authorizeRoles("JUDGE"),
  getAssignmentById
);

module.exports = router;