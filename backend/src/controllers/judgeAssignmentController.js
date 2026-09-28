const JudgeAssignment = require("../models/JudgeAssignment");
const Hackathon = require("../models/Hackathon");

// ======================================================
// DELETE ASSIGNMENT
// Organizer only
// ======================================================

const removeAssignment = async (req, res) => {
  try {
    const {
      hackathonId,
      assignmentId,
    } = req.params;

    // --------------------------------------------------
    // Validate IDs
    // --------------------------------------------------

    if (!hackathonId || !assignmentId) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID and assignment ID are required",
      });
    }

    // --------------------------------------------------
    // Verify organizer owns hackathon
    // --------------------------------------------------

    const hackathon = await Hackathon.findOne({
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
    // Find assignment belonging to this hackathon
    // --------------------------------------------------

    const assignment =
      await JudgeAssignment.findOne({
        _id: assignmentId,
        hackathon: hackathonId,
      });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    // --------------------------------------------------
    // Delete assignment
    // --------------------------------------------------

    await assignment.deleteOne();

    // --------------------------------------------------
    // Success response
    // --------------------------------------------------

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

    // --------------------------------------------------
    // Handle invalid MongoDB ObjectId
    // --------------------------------------------------

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon or assignment ID",
      });
    }

    // --------------------------------------------------
    // Server error
    // --------------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Server error while removing assignment",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  removeAssignment,
};