const mongoose = require("mongoose");
const Round = require("../models/Round");
const Hackathon = require("../models/Hackathon");

// ======================================================
// HELPER: SYNC ROUND CONFIGURATION STATUS
// ======================================================

const syncRoundsConfigured = async (hackathon) => {
  const roundCount = await Round.countDocuments({
    hackathon: hackathon._id,
  });

  hackathon.setup.roundsConfigured = roundCount > 0;

  await hackathon.save();

  return roundCount;
};

// ======================================================
// CREATE ROUND
// POST /rounds/:hackathonId
// Organizer only
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

    const organizerId = req.user?.userId;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    // Verify that the organizer owns this hackathon.
    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: organizerId,
    });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found or you are not authorized",
      });
    }

    // Validate round dates.
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
        message: "Round end date must be after start date",
      });
    }

    // Validate the hackathon's dates.
    const hackathonStart = new Date(hackathon.startDate);
    const hackathonEnd = new Date(hackathon.endDate);

    if (
      Number.isNaN(hackathonStart.getTime()) ||
      Number.isNaN(hackathonEnd.getTime())
    ) {
      return res.status(500).json({
        success: false,
        message: "Hackathon has invalid start or end date",
      });
    }

    // A round must fall within the hackathon's dates.
    if (
      start < hackathonStart ||
      end > hackathonEnd
    ) {
      return res.status(400).json({
        success: false,
        message: "Round dates must be within the hackathon dates",
      });
    }

    // Prevent duplicate round numbers.
    const existingRound = await Round.findOne({
      hackathon: hackathonId,
      roundNumber: parsedRoundNumber,
    });

    if (existingRound) {
      return res.status(409).json({
        success: false,
        message: "A round with this round number already exists",
      });
    }

    // Create the round.
    const round = await Round.create({
      hackathon: hackathonId,
      name: name.trim(),
      description: description ? description.trim() : "",
      roundNumber: parsedRoundNumber,
      startDate: start,
      endDate: end,
    });

    // Update the setup flag used by the publish endpoint.
    await syncRoundsConfigured(hackathon);

    return res.status(201).json({
      success: true,
      message: "Round created successfully",
      round,
    });
  } catch (error) {
    console.error("Create round error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A round with this round number already exists",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon or round ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating round",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL ROUNDS
// GET /rounds/:hackathonId
// Organizer only
// ======================================================

const getRounds = async (req, res) => {
  try {
    const { hackathonId } = req.params;

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

    const organizerId = req.user?.userId;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    // Verify ownership.
    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: organizerId,
    });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found or you are not authorized",
      });
    }

    // Return rounds in ascending order.
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
      message: "Server error while fetching rounds",
      error: error.message,
    });
  }
};

// ======================================================
// GET PUBLISHED HACKATHON ROUNDS FOR PARTICIPANTS
// GET /rounds/public/:publicId
// ======================================================

const getPublicRounds = async (req, res) => {
  try {
    const publicId = String(req.params.publicId || "")
      .trim()
      .toUpperCase();

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID is required",
      });
    }

    const hackathon = await Hackathon.findOne({
      hackathonId: publicId,
      isPublished: true,
    }).select("_id");

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Published hackathon not found",
      });
    }

    const rounds = await Round.find({ hackathon: hackathon._id })
      .select("name description roundNumber startDate endDate status")
      .sort({ roundNumber: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      rounds,
    });
  } catch (error) {
    console.error("Get public rounds error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching evaluation rounds",
    });
  }
};

// ======================================================
// UPDATE ROUND
// PUT /rounds/:hackathonId/:roundId
// Organizer only
// ======================================================

const updateRound = async (req, res) => {
  try {
    const { hackathonId, roundId } = req.params;

    const {
      name,
      description,
      roundNumber,
      startDate,
      endDate,
    } = req.body;

    if (!hackathonId || !roundId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID and round ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(hackathonId) ||
      !mongoose.Types.ObjectId.isValid(roundId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID or round ID",
      });
    }

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

    const organizerId = req.user?.userId;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    // Verify hackathon ownership.
    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: organizerId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message: "Hackathon not found or you are not authorized",
      });
    }

    // Verify that the round belongs to this hackathon.
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

    // Validate dates.
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
        message: "Round end date must be after start date",
      });
    }

    // Ensure the round dates remain inside the hackathon dates.
    const hackathonStart = new Date(hackathon.startDate);
    const hackathonEnd = new Date(hackathon.endDate);

    if (
      start < hackathonStart ||
      end > hackathonEnd
    ) {
      return res.status(400).json({
        success: false,
        message: "Round dates must be within the hackathon dates",
      });
    }

    // Prevent duplicate round numbers, excluding this round.
    const existingRound = await Round.findOne({
      hackathon: hackathonId,
      roundNumber: parsedRoundNumber,
      _id: { $ne: roundId },
    });

    if (existingRound) {
      return res.status(409).json({
        success: false,
        message: "Another round with this round number already exists",
      });
    }

    // Update the round.
    round.name = name.trim();
    round.description = description ? description.trim() : "";
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
        message: "Another round with this round number already exists",
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon or round ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating round",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE ROUND
// DELETE /rounds/:hackathonId/:roundId
// Organizer only
// ======================================================

const deleteRound = async (req, res) => {
  try {
    const { hackathonId, roundId } = req.params;

    if (!hackathonId || !roundId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID and round ID are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(hackathonId) ||
      !mongoose.Types.ObjectId.isValid(roundId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID or round ID",
      });
    }

    const organizerId = req.user?.userId;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    // Verify hackathon ownership.
    const hackathon = await Hackathon.findOne({
      _id: hackathonId,
      organizer: organizerId,
    });

    if (!hackathon) {
      return res.status(403).json({
        success: false,
        message: "Hackathon not found or you are not authorized",
      });
    }

    // Verify the round belongs to the hackathon.
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

    await Round.deleteOne({
      _id: roundId,
      hackathon: hackathonId,
    });

    // Recalculate the flag after deletion.
    const remainingRounds = await syncRoundsConfigured(hackathon);

    return res.status(200).json({
      success: true,
      message: "Round deleted successfully",
      remainingRounds,
      roundsConfigured: remainingRounds > 0,
    });
  } catch (error) {
    console.error("Delete round error:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon or round ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while deleting round",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createRound,
  getRounds,
  getPublicRounds,
  updateRound,
  deleteRound,
};
