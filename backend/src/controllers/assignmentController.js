const JudgeAssignment = require("../models/JudgeAssignment");
const Hackathon = require("../models/Hackathon");
const Round = require("../models/Round");
const User = require("../models/User");
const Team = require("../models/Team");
const Project = require("../models/Project");

// ======================================================
// CREATE ASSIGNMENT
// Organizer only
//
// IMPORTANT:
// Project is OPTIONAL.
//
// A judge can be assigned to a team before the team
// submits a project.
//
// Workflow:
//
// Team approved
//       ↓
// Judge assigned to Team + Round
//       ↓
// Project submitted later
//       ↓
// Judge evaluates project
// ======================================================

const createAssignment = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
      judgeId,
      teamId,
    } = req.body;

    // --------------------------------------------------
    // VALIDATE REQUIRED FIELDS
    // --------------------------------------------------

    if (
      !hackathonId ||
      !roundId ||
      !judgeId ||
      !teamId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon, round, judge and team are required",
      });
    }

    // --------------------------------------------------
    // VERIFY ORGANIZER OWNS HACKATHON
    // --------------------------------------------------

    const hackathon =
      await Hackathon.findOne({
        _id: hackathonId,
        organizer: req.user.userId,
      });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to manage this hackathon",
      });
    }

    // --------------------------------------------------
    // VERIFY ROUND BELONGS TO HACKATHON
    // --------------------------------------------------

    const round =
      await Round.findOne({
        _id: roundId,
        hackathon: hackathonId,
      });

    if (!round) {
      return res.status(404).json({
        success: false,
        message: "Round not found",
      });
    }

    // --------------------------------------------------
    // VERIFY JUDGE
    // --------------------------------------------------

    const judge =
      await User.findOne({
        _id: judgeId,
        role: "JUDGE",
      });

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: "Judge not found",
      });
    }

    // --------------------------------------------------
    // VERIFY TEAM BELONGS TO HACKATHON
    // --------------------------------------------------

    const team =
      await Team.findOne({
        _id: teamId,
        hackathon: hackathonId,
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // --------------------------------------------------
    // OPTIONAL:
    // CHECK WHETHER PROJECT ALREADY EXISTS
    //
    // This is informational only.
    // The assignment does NOT depend on it.
    // --------------------------------------------------

    const project =
      await Project.findOne({
        team: teamId,
        hackathon: hackathonId,
      });

    // --------------------------------------------------
    // PREVENT DUPLICATE ASSIGNMENT
    // --------------------------------------------------

    const existingAssignment =
      await JudgeAssignment.findOne({
        round: roundId,
        judge: judgeId,
        team: teamId,
      });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message:
          "This judge is already assigned to this team for this round",
        assignment:
          existingAssignment,
      });
    }

    // --------------------------------------------------
    // CREATE ASSIGNMENT
    //
    // project can be:
    //
    // existing project ID
    // OR
    // null if no project has been submitted yet
    // --------------------------------------------------

    const assignment =
      await JudgeAssignment.create({
        hackathon: hackathonId,
        round: roundId,
        judge: judgeId,
        team: teamId,
        project:
          project?._id || null,
      });

    // --------------------------------------------------
    // POPULATE RESPONSE
    // --------------------------------------------------

    const populatedAssignment =
      await JudgeAssignment.findById(
        assignment._id
      )
        .populate(
          "judge",
          "name email"
        )
        .populate(
          "team",
          "name status"
        )
        .populate(
          "project",
          "projectName status submittedAt"
        )
        .populate(
          "round",
          "name roundNumber"
        )
        .populate(
          "hackathon",
          "name status"
        );

    // --------------------------------------------------
    // RESPONSE MESSAGE
    // --------------------------------------------------

    const message = project
      ? "Judge assigned successfully"
      : "Judge assigned successfully. The team has not submitted a project yet.";

    return res.status(201).json({
      success: true,
      message,
      assignment:
        populatedAssignment,
    });
  } catch (error) {
    console.error(
      "Create assignment error:",
      error
    );

    // --------------------------------------------------
    // DUPLICATE KEY ERROR
    // --------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This judge is already assigned to this team for this round",
      });
    }

    // --------------------------------------------------
    // VALIDATION ERROR
    // --------------------------------------------------

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Assignment validation failed",
        error:
          error.message,
      });
    }

    // --------------------------------------------------
    // CAST ERROR
    // --------------------------------------------------

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon, round, judge or team ID",
      });
    }

    // --------------------------------------------------
    // SERVER ERROR
    // --------------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating assignment",
      error:
        error.message,
    });
  }
};

// ======================================================
// GET ALL ASSIGNMENTS FOR HACKATHON
// Organizer only
// ======================================================

const getAssignmentsForHackathon =
  async (req, res) => {
    try {
      const {
        hackathonId,
      } = req.params;

      // ------------------------------------------------
      // VERIFY ORGANIZER OWNS HACKATHON
      // ------------------------------------------------

      const hackathon =
        await Hackathon.findOne({
          _id: hackathonId,
          organizer:
            req.user.userId,
        });

      if (!hackathon) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to access this hackathon",
        });
      }

      // ------------------------------------------------
      // GET ASSIGNMENTS
      // ------------------------------------------------

      const assignments =
        await JudgeAssignment.find({
          hackathon:
            hackathonId,
        })
          .populate(
            "judge",
            "name email"
          )
          .populate(
            "team",
            "name status"
          )
          .populate(
            "project",
            "projectName status submittedAt"
          )
          .populate(
            "round",
            "name roundNumber"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error(
        "Get assignments error:",
        error
      );

      if (
        error.name === "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid hackathon ID",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching assignments",
        error:
          error.message,
      });
    }
  };

// ======================================================
// GET MY ASSIGNMENTS
// Judge only
// ======================================================

const getMyAssignments =
  async (req, res) => {
    try {
      const assignments =
        await JudgeAssignment.find({
          judge:
            req.user.userId,
        })
          .populate(
            "team",
            "name status"
          )
          .populate(
            "project",
            "projectName problemStatement solution technologyStack githubUrl demoUrl presentationUrl status submittedAt"
          )
          .populate(
            "round",
            "name roundNumber startDate endDate status"
          )
          .populate(
            "hackathon",
            "name status"
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json({
        success: true,
        assignments,
      });
    } catch (error) {
      console.error(
        "Get judge assignments error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching your assignments",
        error:
          error.message,
      });
    }
  };

// ======================================================
// GET SINGLE ASSIGNMENT
// Judge only
// ======================================================

const getAssignmentById =
  async (req, res) => {
    try {
      const {
        assignmentId,
      } = req.params;

      const assignment =
        await JudgeAssignment.findOne({
          _id: assignmentId,
          judge:
            req.user.userId,
        })
          .populate(
            "team",
            "name status"
          )
          .populate(
            "project",
            "projectName problemStatement solution technologyStack githubUrl demoUrl presentationUrl status submittedAt"
          )
          .populate(
            "round",
            "name roundNumber startDate endDate status"
          )
          .populate(
            "hackathon",
            "name status"
          )
          .populate(
            "judge",
            "name email"
          );

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "Assignment not found or you are not authorized to access it",
        });
      }

      return res.status(200).json({
        success: true,
        assignment,
      });
    } catch (error) {
      console.error(
        "Get assignment by ID error:",
        error
      );

      if (
        error.name === "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid assignment ID",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching assignment",
        error:
          error.message,
      });
    }
  };

// ======================================================
// DELETE ASSIGNMENT
// Organizer only
// ======================================================

const removeAssignment =
  async (req, res) => {
    try {
      const {
        hackathonId,
        assignmentId,
      } = req.params;

      // ------------------------------------------------
      // VALIDATE IDs
      // ------------------------------------------------

      if (
        !hackathonId ||
        !assignmentId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Hackathon ID and assignment ID are required",
        });
      }

      // ------------------------------------------------
      // VERIFY ORGANIZER OWNS HACKATHON
      // ------------------------------------------------

      const hackathon =
        await Hackathon.findOne({
          _id: hackathonId,
          organizer:
            req.user.userId,
        });

      if (!hackathon) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to manage this hackathon",
        });
      }

      // ------------------------------------------------
      // FIND ASSIGNMENT
      // ------------------------------------------------

      const assignment =
        await JudgeAssignment.findOne({
          _id: assignmentId,
          hackathon:
            hackathonId,
        });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message:
            "Assignment not found",
        });
      }

      // ------------------------------------------------
      // DELETE
      // ------------------------------------------------

      await assignment.deleteOne();

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,
        message:
          "Assignment removed successfully",
      });
    } catch (error) {
      console.error(
        "Remove assignment error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid hackathon or assignment ID",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Server error while removing assignment",
        error:
          error.message,
      });
    }
  };

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createAssignment,
  getAssignmentsForHackathon,
  getMyAssignments,
  getAssignmentById,
  removeAssignment,
};