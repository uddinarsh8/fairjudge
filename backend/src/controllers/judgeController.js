const Judge = require("../models/Judge");
const Hackathon = require("../models/Hackathon");

// ======================================================
// CREATE JUDGE
// ======================================================

const createJudge = async (req, res) => {
  try {
    const hackathonId = req.params.hackathonId;

    const {
      name,
      email,
      phone,
      specialization,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !name.trim() ||
      !email ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Judge name and email are required",
      });
    }

    // Verify organizer owns hackathon
    const hackathon =
      await Hackathon.findOne({
        _id: hackathonId,
        organizer: req.user.userId,
      });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found or you are not authorized",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // Check duplicate email
    const existingJudge =
      await Judge.findOne({
        hackathon: hackathonId,
        email: normalizedEmail,
      });

    if (existingJudge) {
      return res.status(409).json({
        success: false,
        message:
          "A judge with this email already exists for this hackathon",
      });
    }

    // Create judge
    const judge =
      await Judge.create({
        hackathon: hackathonId,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone?.trim() || "",
        specialization:
          specialization?.trim() || "",
      });

    return res.status(201).json({
      success: true,
      message:
        "Judge added successfully",
      judge,
    });
  } catch (error) {
    console.error(
      "Create judge error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A judge with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while adding judge",
    });
  }
};


// ======================================================
// GET ALL JUDGES
// ======================================================

const getJudges = async (req, res) => {
  try {
    const hackathonId =
      req.params.hackathonId;

    // Verify organizer owns hackathon
    const hackathon =
      await Hackathon.findOne({
        _id: hackathonId,
        organizer: req.user.userId,
      });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found or you are not authorized",
      });
    }

    const judges =
      await Judge.find({
        hackathon: hackathonId,
      }).sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      judges,
    });
  } catch (error) {
    console.error(
      "Get judges error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching judges",
    });
  }
};


// ======================================================
// UPDATE JUDGE
// ======================================================

const updateJudge = async (req, res) => {
  try {
    const {
      hackathonId,
      judgeId,
    } = req.params;

    const {
      name,
      email,
      phone,
      specialization,
    } = req.body;

    // Verify organizer owns hackathon
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

    const judge =
      await Judge.findOne({
        _id: judgeId,
        hackathon: hackathonId,
      });

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: "Judge not found",
      });
    }

    // Validate
    if (
      !name ||
      !name.trim() ||
      !email ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Judge name and email are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    // Check duplicate email
    const duplicateJudge =
      await Judge.findOne({
        hackathon: hackathonId,
        email: normalizedEmail,
        _id: {
          $ne: judgeId,
        },
      });

    if (duplicateJudge) {
      return res.status(409).json({
        success: false,
        message:
          "Another judge with this email already exists",
      });
    }

    judge.name = name.trim();
    judge.email = normalizedEmail;
    judge.phone = phone?.trim() || "";
    judge.specialization =
      specialization?.trim() || "";

    await judge.save();

    return res.status(200).json({
      success: true,
      message:
        "Judge updated successfully",
      judge,
    });
  } catch (error) {
    console.error(
      "Update judge error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating judge",
    });
  }
};


// ======================================================
// DELETE JUDGE
// ======================================================

const deleteJudge = async (req, res) => {
  try {
    const {
      hackathonId,
      judgeId,
    } = req.params;

    // Verify organizer owns hackathon
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

    const judge =
      await Judge.findOne({
        _id: judgeId,
        hackathon: hackathonId,
      });

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: "Judge not found",
      });
    }

    await judge.deleteOne();

    return res.status(200).json({
      success: true,
      message:
        "Judge deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete judge error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting judge",
    });
  }
};


module.exports = {
  createJudge,
  getJudges,
  updateJudge,
  deleteJudge,
};