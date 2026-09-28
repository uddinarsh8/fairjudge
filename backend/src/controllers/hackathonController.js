const mongoose = require("mongoose");

const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const Judge = require("../models/Judge");
const Round = require("../models/Round");
const Evaluation = require("../models/Evaluation");

// ======================================================
// HELPER - GET USER ID
// ======================================================

const getUserId = (req) => {
  return (
    req.user?.userId ||
    req.user?.id ||
    req.user?._id
  );
};

// ======================================================
// GENERATE PUBLIC HACKATHON ID
// Example: HACK-7F3A91
// ======================================================

const generateHackathonId = () => {
  const randomPart = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `HACK-${randomPart}`;
};

// ======================================================
// CREATE HACKATHON
// POST /api/hackathons
// ======================================================

const createHackathon = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
    } = req.body;

    const organizerId = getUserId(req);

    // --------------------------------------------------
    // VALIDATE USER
    // --------------------------------------------------

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    // --------------------------------------------------
    // VALIDATE REQUIRED FIELDS
    // --------------------------------------------------

    if (
      !name ||
      !description ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, start date and end date are required",
      });
    }

    // --------------------------------------------------
    // VALIDATE DATES
    // --------------------------------------------------

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end date",
      });
    }

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    // --------------------------------------------------
    // GENERATE UNIQUE PUBLIC ID
    // --------------------------------------------------

    let hackathonId;
    let exists = true;

    while (exists) {
      hackathonId = generateHackathonId();

      exists = await Hackathon.exists({
        hackathonId,
      });
    }

    // --------------------------------------------------
    // CREATE HACKATHON
    // --------------------------------------------------

    const hackathon = await Hackathon.create({
      hackathonId,
      name: name.trim(),
      description: description.trim(),
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      status: "DRAFT",
      isPublished: false,
      organizer: organizerId,
    });

    console.log(
      "Hackathon created:",
      hackathon._id,
      hackathon.hackathonId
    );

    return res.status(201).json({
      success: true,
      message: "Hackathon created successfully",
      hackathon,
    });
  } catch (error) {
    console.error(
      "Create hackathon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating hackathon",
      error: error.message,
    });
  }
};

// ======================================================
// GET ORGANIZER HACKATHONS
// GET /api/hackathons/organizer
//
// RETURNS:
//
// hackathons[]
//   - teamCount
//   - judgeCount
//   - roundCount
//   - evaluationCount
//
// stats
//   - teams
//   - judges
//   - rounds
//   - evaluations
//
// ======================================================

const getOrganizerHackathons = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);

    // --------------------------------------------------
    // VALIDATE USER
    // --------------------------------------------------

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    // --------------------------------------------------
    // VALIDATE OBJECT ID
    // --------------------------------------------------

    if (
      !mongoose.Types.ObjectId.isValid(
        organizerId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid organizer ID",
      });
    }

    // --------------------------------------------------
    // GET ORGANIZER HACKATHONS
    // --------------------------------------------------

    const hackathons = await Hackathon.find({
      organizer: organizerId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    // --------------------------------------------------
    // NO HACKATHONS
    // --------------------------------------------------

    if (hackathons.length === 0) {
      return res.status(200).json({
        success: true,
        hackathons: [],
        stats: {
          teams: 0,
          judges: 0,
          rounds: 0,
          evaluations: 0,
        },
      });
    }

    // --------------------------------------------------
    // HACKATHON IDS
    // --------------------------------------------------

    const hackathonIds = hackathons.map(
      (hackathon) => hackathon._id
    );

    // --------------------------------------------------
    // GET ALL COUNTS IN PARALLEL
    // --------------------------------------------------

    const [
      teamCounts,
      judgeCounts,
      roundCounts,
      evaluationCounts,
    ] = await Promise.all([
      Team.aggregate([
        {
          $match: {
            hackathon: {
              $in: hackathonIds,
            },
          },
        },
        {
          $group: {
            _id: "$hackathon",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Judge.aggregate([
        {
          $match: {
            hackathon: {
              $in: hackathonIds,
            },
          },
        },
        {
          $group: {
            _id: "$hackathon",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Round.aggregate([
        {
          $match: {
            hackathon: {
              $in: hackathonIds,
            },
          },
        },
        {
          $group: {
            _id: "$hackathon",
            count: {
              $sum: 1,
            },
          },
        },
      ]),

      Evaluation.aggregate([
        {
          $match: {
            hackathon: {
              $in: hackathonIds,
            },
          },
        },
        {
          $group: {
            _id: "$hackathon",
            count: {
              $sum: 1,
            },
          },
        },
      ]),
    ]);

    // --------------------------------------------------
    // CREATE COUNT MAPS
    // --------------------------------------------------

    const createCountMap = (results) => {
      const map = new Map();

      results.forEach((item) => {
        map.set(
          String(item._id),
          Number(item.count || 0)
        );
      });

      return map;
    };

    const teamCountMap =
      createCountMap(teamCounts);

    const judgeCountMap =
      createCountMap(judgeCounts);

    const roundCountMap =
      createCountMap(roundCounts);

    const evaluationCountMap =
      createCountMap(evaluationCounts);

    // --------------------------------------------------
    // ATTACH REAL COUNTS TO EACH HACKATHON
    // --------------------------------------------------

    const hackathonsWithStats =
      hackathons.map((hackathon) => {
        const id = String(
          hackathon._id
        );

        return {
          ...hackathon,

          teamCount:
            teamCountMap.get(id) || 0,

          judgeCount:
            judgeCountMap.get(id) || 0,

          roundCount:
            roundCountMap.get(id) || 0,

          evaluationCount:
            evaluationCountMap.get(id) || 0,
        };
      });

    // --------------------------------------------------
    // GLOBAL ORGANIZER STATS
    // --------------------------------------------------

    const totalTeams =
      teamCounts.reduce(
        (total, item) =>
          total + Number(item.count || 0),
        0
      );

    const totalJudges =
      judgeCounts.reduce(
        (total, item) =>
          total + Number(item.count || 0),
        0
      );

    const totalRounds =
      roundCounts.reduce(
        (total, item) =>
          total + Number(item.count || 0),
        0
      );

    const totalEvaluations =
      evaluationCounts.reduce(
        (total, item) =>
          total + Number(item.count || 0),
        0
      );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      hackathons: hackathonsWithStats,

      stats: {
        teams: totalTeams,
        judges: totalJudges,
        rounds: totalRounds,
        evaluations: totalEvaluations,
      },
    });
  } catch (error) {
    console.error(
      "Get organizer hackathons error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching hackathons",
      error: error.message,
    });
  }
};

// ======================================================
// GET PUBLIC HACKATHON BY PUBLIC ID
// GET /api/hackathons/public/:publicId
// ======================================================

const getHackathonByPublicId = async (
  req,
  res
) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Hackathon ID is required",
      });
    }

    const hackathon =
      await Hackathon.findOne({
        hackathonId: publicId
          .trim()
          .toUpperCase(),
      }).select("-__v");

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found",
      });
    }

    return res.status(200).json({
      success: true,
      hackathon,
    });
  } catch (error) {
    console.error(
      "Get public hackathon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching hackathon",
      error: error.message,
    });
  }
};

// ======================================================
// GET HACKATHON BY MONGODB ID
// GET /api/hackathons/:id
// ======================================================

const getHackathonById = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);
    const { id } = req.params;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user ID not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hackathon ID",
      });
    }

    const hackathon =
      await Hackathon.findOne({
        _id: id,
        organizer: organizerId,
      });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: "Hackathon not found",
      });
    }

    return res.status(200).json({
      success: true,
      hackathon,
    });
  } catch (error) {
    console.error(
      "Get hackathon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching hackathon",
      error: error.message,
    });
  }
};

// ======================================================
// PUBLISH HACKATHON
// POST /api/hackathons/:id/publish
// ======================================================

const publishHackathon = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);
    const { id } = req.params;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon ID",
      });
    }

    const hackathon =
      await Hackathon.findOne({
        _id: id,
        organizer: organizerId,
      });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found",
      });
    }

    // --------------------------------------------------
    // ALREADY PUBLISHED
    // --------------------------------------------------

    if (hackathon.isPublished) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon is already published",
        hackathon,
      });
    }

    // --------------------------------------------------
    // CHECK SETUP
    // --------------------------------------------------

    if (
      !hackathon.setup?.roundsConfigured
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please configure hackathon rounds before publishing",
      });
    }

    if (
      !hackathon.setup?.evaluationConfigured
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please configure evaluation before publishing",
      });
    }

    // --------------------------------------------------
    // PUBLISH
    // --------------------------------------------------

    hackathon.isPublished = true;

    if (hackathon.status === "DRAFT") {
      hackathon.status = "UPCOMING";
    }

    await hackathon.save();

    return res.status(200).json({
      success: true,
      message:
        "Hackathon published successfully",
      hackathon,
    });
  } catch (error) {
    console.error(
      "Publish hackathon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while publishing hackathon",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE HACKATHON
// PUT /api/hackathons/:id
// ======================================================

const updateHackathon = async (
  req,
  res
) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      status,
    } = req.body;

    const organizerId = getUserId(req);
    const { id } = req.params;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user ID not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon ID",
      });
    }

    const hackathon =
      await Hackathon.findOne({
        _id: id,
        organizer: organizerId,
      });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found",
      });
    }

    // --------------------------------------------------
    // NAME
    // --------------------------------------------------

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Hackathon name cannot be empty",
        });
      }

      hackathon.name = name.trim();
    }

    // --------------------------------------------------
    // DESCRIPTION
    // --------------------------------------------------

    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Description cannot be empty",
        });
      }

      hackathon.description =
        description.trim();
    }

    // --------------------------------------------------
    // DATES
    // --------------------------------------------------

    const updatedStartDate =
      startDate !== undefined
        ? new Date(startDate)
        : hackathon.startDate;

    const updatedEndDate =
      endDate !== undefined
        ? new Date(endDate)
        : hackathon.endDate;

    if (
      Number.isNaN(
        updatedStartDate.getTime()
      ) ||
      Number.isNaN(
        updatedEndDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid start or end date",
      });
    }

    if (
      updatedEndDate <=
      updatedStartDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "End date must be after start date",
      });
    }

    hackathon.startDate =
      updatedStartDate;

    hackathon.endDate =
      updatedEndDate;

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (status !== undefined) {
      const allowedStatuses = [
        "DRAFT",
        "UPCOMING",
        "ACTIVE",
        "COMPLETED",
      ];

      if (
        !allowedStatuses.includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid hackathon status",
        });
      }

      hackathon.status = status;
    }

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    await hackathon.save();

    return res.status(200).json({
      success: true,
      message:
        "Hackathon updated successfully",
      hackathon,
    });
  } catch (error) {
    console.error(
      "Update hackathon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating hackathon",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE HACKATHON
// DELETE /api/hackathons/:id
// ======================================================

const deleteHackathon = async (
  req,
  res
) => {
  try {
    const organizerId = getUserId(req);
    const { id } = req.params;

    if (!organizerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user ID not found",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon ID",
      });
    }

    const hackathon =
      await Hackathon.findOneAndDelete({
        _id: id,
        organizer: organizerId,
      });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Hackathon deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete hackathon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting hackathon",
      error: error.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  createHackathon,
  getOrganizerHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon,
  publishHackathon,
  getHackathonByPublicId,
};