const express = require("express");

const {
  createHackathon,
  getOrganizerHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon,
  publishHackathon,
  getHackathonByPublicId,
} = require("../controllers/hackathonController");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// ======================================================
// CREATE HACKATHON
// POST /api/hackathons
// ======================================================

router.post(
  "/",
  protect,
  authorizeRoles("ORGANIZER"),
  createHackathon
);

// ======================================================
// GET ORGANIZER HACKATHONS
// GET /api/hackathons/organizer
// ======================================================

router.get(
  "/organizer",
  protect,
  authorizeRoles("ORGANIZER"),
  getOrganizerHackathons
);

// ======================================================
// GET PUBLIC HACKATHON BY PUBLIC ID
// GET /api/hackathons/public/:publicId
//
// Used by members when entering a Hackathon ID.
// This route is intentionally available before /:id.
// ======================================================

router.get(
  "/public/:publicId",
  getHackathonByPublicId
);

// ======================================================
// PUBLISH HACKATHON
// POST /api/hackathons/:id/publish
//
// Only the organizer who owns the hackathon can publish it.
// Backend will verify that required configuration is complete.
// ======================================================

router.post(
  "/:id/publish",
  protect,
  authorizeRoles("ORGANIZER"),
  publishHackathon
);

// ======================================================
// GET SINGLE HACKATHON
// GET /api/hackathons/:id
// ======================================================

router.get(
  "/:id",
  protect,
  authorizeRoles("ORGANIZER"),
  getHackathonById
);

// ======================================================
// UPDATE HACKATHON
// PUT /api/hackathons/:id
// ======================================================

router.put(
  "/:id",
  protect,
  authorizeRoles("ORGANIZER"),
  updateHackathon
);

// ======================================================
// DELETE HACKATHON
// DELETE /api/hackathons/:id
// ======================================================

router.delete(
  "/:id",
  protect,
  authorizeRoles("ORGANIZER"),
  deleteHackathon
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;