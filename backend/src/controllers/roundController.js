const mongoose = require("mongoose");
const Round = require("../models/Round");
const Hackathon = require("../models/Hackathon");

// ======================================================
// CREATE ROUND
// Organizer only
// POST /rounds/:hackathonId
// ======================================================

const createRound = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    const {
      name,
      description,
      roundNumber,
      startDate,
      endDate,
    } = req.body;

    // --------------------------------------------------
    // Validate Hackathon ID
    // --------------------------------------------------

    if (!hackathonId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID",
      });
    }

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (
      !name ||
      roundNumber === undefined ||
      roundNumber === null ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, round number, start date and end date are required",
      });
    }

    // --------------------------------------------------
    // Validate round number
    // --------------------------------------------------

    const parsedRoundNumber = Number(roundNumber);

    if (
      !Number.isInteger(parsedRoundNumber) ||
      parsedRoundNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Round number must be a positive integer",
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
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found or you are not authorized",
      });
    }

    // --------------------------------------------------
    // Validate dates
    // --------------------------------------------------

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    if (Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message:
          "Round end date must be after start date",
      });
    }

    // --------------------------------------------------
    // Validate hackathon dates
    // --------------------------------------------------

    const hackathonStart = new Date(hackathon.startDate);
    const hackathonEnd = new Date(hackathon.endDate);

    if (
      Number.isNaN(hackathonStart.getTime()) ||
      Number.isNaN(hackathonEnd.getTime())
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Hackathon has invalid start or end date",
      });
    }

    // --------------------------------------------------
    // Keep round dates inside hackathon dates
    // --------------------------------------------------

    if (
      start < hackathonStart ||
      end > hackathonEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Round dates must be within the hackathon dates",
      });
    }

    // --------------------------------------------------
    // Prevent duplicate round numbers
    // --------------------------------------------------

    const existingRound = await Round.findOne({
      hackathon: hackathonId,
      roundNumber: parsedRoundNumber,
    });

    if (existingRound) {
      return res.status(409).json({
        success: false,
        message:
          "A round with this round number already exists",
      });
    }

    // --------------------------------------------------
    // Create round
    // --------------------------------------------------

    const round = await Round.create({
      hackathon: hackathonId,
      name: name.trim(),
      description: description
        ? description.trim()
        : "",
      roundNumber: parsedRoundNumber,
      startDate: start,
      endDate: end,
    });

    // --------------------------------------------------
    // Success response
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Round created successfully",
      round,
    });
  } catch (error) {
    console.error("Create round error:", error);

    // --------------------------------------------------
    // Duplicate key error
    // --------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A round with this round number already exists",
      });
    }

    // --------------------------------------------------
    // Invalid ObjectId
    // --------------------------------------------------

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon or round ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating round",
    });
  }
};


// ======================================================
// GET ALL ROUNDS FOR A HACKATHON
// Organizer only
// GET /rounds/:hackathonId
// ======================================================

const getRounds = async (req, res) => {
  try {
    const { hackathonId } = req.params;

    // --------------------------------------------------
    // Validate ID
    // --------------------------------------------------

    if (!hackathonId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(hackathonId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID",
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
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found or you are not authorized",
      });
    }

    // --------------------------------------------------
    // Get rounds
    // --------------------------------------------------

    const rounds = await Round.find({
      hackathon: hackathonId,
    }).sort({
      roundNumber: 1,
    });

    return res.status(200).json({
      success: true,
      rounds,
    });
  } catch (error) {
    console.error("Get rounds error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching rounds",
    });
  }
};


// ======================================================
// UPDATE ROUND
// Organizer only
// PUT /rounds/:hackathonId/:roundId
// ======================================================

const updateRound = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
    } = req.params;

    const {
      name,
      description,
      roundNumber,
      startDate,
      endDate,
    } = req.body;

    // --------------------------------------------------
    // Validate IDs
    // --------------------------------------------------

    if (!hackathonId || !roundId) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID and round ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(hackathonId) ||
      !mongoose.Types.ObjectId.isValid(roundId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon ID or round ID",
      });
    }

    // --------------------------------------------------
    // Validate required fields
    // --------------------------------------------------

    if (
      !name ||
      roundNumber === undefined ||
      roundNumber === null ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, round number, start date and end date are required",
      });
    }

    // --------------------------------------------------
    // Validate round number
    // --------------------------------------------------

    const parsedRoundNumber = Number(roundNumber);

    if (
      !Number.isInteger(parsedRoundNumber) ||
      parsedRoundNumber < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Round number must be a positive integer",
      });
    }

    // --------------------------------------------------
    // Verify hackathon ownership
    // --------------------------------------------------

    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: req.user.userId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message:
          "Hackathon not found or you are not authorized",
      });
    }

    // --------------------------------------------------
    // Verify round belongs to hackathon
    // --------------------------------------------------

    const round = await Round.findOne({
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
    // Validate dates
    // --------------------------------------------------

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date",
      });
    }

    if (Number.isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message:
          "Round end date must be after start date",
      });
    }

    // --------------------------------------------------
    // Validate hackathon dates
    // --------------------------------------------------

    const hackathonStart = new Date(hackathon.startDate);
    const hackathonEnd = new Date(hackathon.endDate);

    if (
      start < hackathonStart ||
      end > hackathonEnd
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Round dates must be within the hackathon dates",
      });
    }

    // --------------------------------------------------
    // Prevent duplicate round numbers
    // --------------------------------------------------

    const existingRound = await Round.findOne({
      hackathon: hackathonId,
      roundNumber: parsedRoundNumber,
      _id: {
        $ne: roundId,
      },
    });

    if (existingRound) {
      return res.status(409).json({
        success: false,
        message:
          "Another round with this round number already exists",
      });
    }

    // --------------------------------------------------
    // Update round
    // --------------------------------------------------

    round.name = name.trim();
    round.description = description
      ? description.trim()
      : "";
    round.roundNumber = parsedRoundNumber;
    round.startDate = start;
    round.endDate = end;

    await round.save();

    return res.status(200).json({
      success: true,
      message: "Round updated successfully",
      round,
    });
  } catch (error) {
    console.error("Update round error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Another round with this round number already exists",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon or round ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating round",
    });
  }
};


// ======================================================
// DELETE ROUND
// Organizer only
// DELETE /rounds/:hackathonId/:roundId
// ======================================================

const deleteRound = async (req, res) => {
  try {
    const {
      hackathonId,
      roundId,
    } = req.params;

    // --------------------------------------------------
    // Validate IDs
    // --------------------------------------------------

    if (!hackathonId || !roundId) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID and round ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(hackathonId) ||
      !mongoose.Types.ObjectId.isValid(roundId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon ID or round ID",
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
          "Hackathon not found or you are not authorized",
      });
    }

    // --------------------------------------------------
    // Verify round belongs to hackathon
    // --------------------------------------------------

    const round = await Round.findOne({
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
    // Delete round
    // --------------------------------------------------

    await Round.deleteOne({
      _id: roundId,
      hackathon: hackathonId,
    });

    return res.status(200).json({
      success: true,
      message: "Round deleted successfully",
    });
  } catch (error) {
    console.error("Delete round error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon or round ID",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting round",
    });
  }
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createRound,
  getRounds,
  updateRound,
  deleteRound,
};