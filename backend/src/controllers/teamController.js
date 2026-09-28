const mongoose = require("mongoose");
const crypto = require("crypto");

const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");

// ======================================================
// HELPER - GET LOGGED IN USER ID
// ======================================================

const getUserId = (req) => {
  return (
    req.user?.userId ||
    req.user?.id ||
    req.user?._id
  );
};

// ======================================================
// HELPER - GET LOGGED IN USER EMAIL
// ======================================================

const getUserEmail = (req) => {
  return req.user?.email
    ? String(req.user.email)
        .trim()
        .toLowerCase()
    : null;
};

// ======================================================
// HELPER - CHECK ORGANIZER / ADMIN
// ======================================================

const isOrganizerOrAdmin = (req) => {
  const role = String(
    req.user?.role || ""
  )
    .trim()
    .toUpperCase();

  return (
    role === "ORGANIZER" ||
    role === "ADMIN"
  );
};

// ======================================================
// HELPER - IS ADMIN
// ======================================================

const isAdmin = (req) => {
  const role = String(
    req.user?.role || ""
  )
    .trim()
    .toUpperCase();

  return role === "ADMIN";
};

// ======================================================
// HELPER - POPULATE TEAM
// ======================================================

const populateTeam = (query) => {
  return query
    .populate(
      "leader",
      "name email role"
    )
    .populate(
      "hackathon"
    )
    .populate(
      "project"
    )
    .populate(
      "reviewedBy",
      "name email role"
    );
};

// ======================================================
// HELPER - GENERATE TEAM ID
// ======================================================
//
// Example:
//
// TEAM-A7F29C
//
// This is the public Team ID shown to participants.
// ======================================================

const generateTeamId = () => {
  const randomPart =
    crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();

  return `TEAM-${randomPart}`;
};

// ======================================================
// HELPER - GENERATE UNIQUE TEAM ID
// ======================================================

const generateUniqueTeamId =
  async () => {
    let teamId;

    let exists = true;

    while (exists) {
      teamId = generateTeamId();

      exists =
        await Team.exists({
          teamId,
        });
    }

    return teamId;
  };

// ======================================================
// CREATE TEAM
// POST /api/teams
//
// Frontend sends PUBLIC hackathon ID:
//
// HACK-7F3A91
//
// Backend converts it to MongoDB _id.
// ======================================================

const createTeam = async (
  req,
  res
) => {
  try {
    const {
      hackathon,
      name,
      members,
    } = req.body;

    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const leaderId =
      getUserId(req);

    if (!leaderId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ==================================================
    // VALIDATE LEADER ID
    // ==================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        leaderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    // ==================================================
    // VALIDATE HACKATHON ID
    // ==================================================

    if (
      !hackathon ||
      typeof hackathon !==
        "string" ||
      !hackathon.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID is required",
      });
    }

    const publicHackathonId =
      hackathon
        .trim()
        .toUpperCase();

    // ==================================================
    // FIND HACKATHON
    // ==================================================

    const hackathonExists =
      await Hackathon.findOne({
        hackathonId:
          publicHackathonId,
      });

    if (!hackathonExists) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found. Please check the Hackathon ID.",
      });
    }

    // ==================================================
    // CHECK HACKATHON STATUS
    // ==================================================

    if (
      String(
        hackathonExists.status
      ).toUpperCase() ===
      "COMPLETED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This hackathon has already been completed.",
      });
    }

    // ==================================================
    // VALIDATE TEAM NAME
    // ==================================================

    if (
      !name ||
      typeof name !==
        "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team name is required",
      });
    }

    // ==================================================
    // FIND LEADER
    // ==================================================

    const leader =
      await User.findById(
        leaderId
      );

    if (!leader) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    const leaderEmail =
      String(
        leader.email
      )
        .trim()
        .toLowerCase();

    // ==================================================
    // CHECK WHETHER USER ALREADY HAS A TEAM
    // ==================================================
    //
    // User may be:
    //
    // 1. Leader of another team
    // 2. Existing member of another team
    //
    // Both are prevented in the same hackathon.
    // ==================================================

    const existingMembership =
      await Team.findOne({
        hackathon:
          hackathonExists._id,

        $or: [
          {
            leader:
              leaderId,
          },
          {
            "members.email":
              leaderEmail,
          },
        ],
      });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message:
          "You already belong to a team for this hackathon.",
        team:
          existingMembership,
      });
    }

    // ==================================================
    // PREPARE MEMBERS
    // ==================================================

    const teamMembers =
      [];

    // ==================================================
    // ADD TEAM LEADER
    // ==================================================

    teamMembers.push({
      name:
        leader.name,

      email:
        leaderEmail,

      role:
        "Team Leader",
    });

    // ==================================================
    // ADD OTHER MEMBERS
    // ==================================================

    if (
      Array.isArray(members)
    ) {
      for (
        const member of members
      ) {
        if (
          !member ||
          typeof member !==
            "object" ||
          !member.name ||
          !member.email
        ) {
          continue;
        }

        const memberName =
          String(
            member.name
          ).trim();

        const memberEmail =
          String(
            member.email
          )
            .trim()
            .toLowerCase();

        if (
          !memberName ||
          !memberEmail
        ) {
          continue;
        }

        // ----------------------------------------------
        // DON'T ADD LEADER TWICE
        // ----------------------------------------------

        if (
          memberEmail ===
          leaderEmail
        ) {
          continue;
        }

        // ----------------------------------------------
        // DON'T ADD DUPLICATE MEMBER EMAILS
        // ----------------------------------------------

        const alreadyAdded =
          teamMembers.some(
            (existingMember) =>
              existingMember.email ===
              memberEmail
          );

        if (alreadyAdded) {
          continue;
        }

        teamMembers.push({
          name:
            memberName,

          email:
            memberEmail,

          role:
            member.role &&
            String(
              member.role
            ).trim()
              ? String(
                  member.role
                ).trim()
              : "Member",
        });
      }
    }

    // ==================================================
    // GENERATE UNIQUE TEAM ID
    // ==================================================

    const teamId =
      await generateUniqueTeamId();

    // ==================================================
    // CREATE TEAM
    // ==================================================

    let team;

    try {
      team =
        await Team.create({
          teamId,

          hackathon:
            hackathonExists._id,

          leader:
            leaderId,

          name:
            name.trim(),

          members:
            teamMembers,

          status:
            "PENDING",

          reviewedBy:
            null,

          reviewedAt:
            null,

          rejectionReason:
            "",
        });
    } catch (error) {
      // ------------------------------------------------
      // Rare race condition:
      // unique teamId generated by another request.
      // ------------------------------------------------

      if (
        error.code === 11000 &&
        error.keyPattern?.teamId
      ) {
        const retryTeamId =
          await generateUniqueTeamId();

        team =
          await Team.create({
            teamId:
              retryTeamId,

            hackathon:
              hackathonExists._id,

            leader:
              leaderId,

            name:
              name.trim(),

            members:
              teamMembers,

            status:
              "PENDING",

            reviewedBy:
              null,

            reviewedAt:
              null,

            rejectionReason:
              "",
          });
      } else {
        throw error;
      }
    }

    // ==================================================
    // POPULATE TEAM
    // ==================================================

    const populatedTeam =
      await populateTeam(
        Team.findById(
          team._id
        )
      );

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Team created successfully. Waiting for organizer approval.",

      team:
        populatedTeam,

      teamId:
        team.teamId,
    });
  } catch (error) {
    console.error(
      "Create team error:",
      error
    );

    // ==================================================
    // DUPLICATE KEY
    // ==================================================

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A team with this information already exists. Please try again.",
      });
    }

    // ==================================================
    // MONGOOSE VALIDATION
    // ==================================================

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team validation failed.",
        error:
          error.message,
      });
    }

    // ==================================================
    // GENERAL ERROR
    // ==================================================

    return res.status(500).json({
      success: false,
      message:
        "Failed to create team request.",
      error:
        error.message,
    });
  }
};

// ======================================================
// JOIN TEAM
// POST /api/teams/join
//
// Body:
//
// {
//   "hackathon": "HACK-7F3A91",
//   "teamId": "TEAM-A7F29C"
// }
//
// A logged-in TEAM/MEMBER joins an existing team.
// ======================================================

const joinTeam = async (
  req,
  res
) => {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ==================================================
    // FIND USER
    // ==================================================

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    const userEmail =
      String(
        user.email
      )
        .trim()
        .toLowerCase();

    // ==================================================
    // REQUEST DATA
    // ==================================================

    const {
      hackathon,
      teamId,
    } = req.body;

    if (
      !hackathon ||
      typeof hackathon !==
        "string" ||
      !hackathon.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID is required",
      });
    }

    if (
      !teamId ||
      typeof teamId !==
        "string" ||
      !teamId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team ID is required",
      });
    }

    const publicHackathonId =
      hackathon
        .trim()
        .toUpperCase();

    const publicTeamId =
      teamId
        .trim()
        .toUpperCase();

    // ==================================================
    // FIND HACKATHON
    // ==================================================

    const hackathonExists =
      await Hackathon.findOne({
        hackathonId:
          publicHackathonId,
      });

    if (!hackathonExists) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found. Please check the Hackathon ID.",
      });
    }

    // ==================================================
    // CHECK HACKATHON STATUS
    // ==================================================

    if (
      String(
        hackathonExists.status
      ).toUpperCase() ===
      "COMPLETED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This hackathon has already been completed.",
      });
    }

    // ==================================================
    // FIND TARGET TEAM
    // ==================================================

    const team =
      await Team.findOne({
        teamId:
          publicTeamId,

        hackathon:
          hackathonExists._id,
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found. Please check the Team ID.",
      });
    }

    // ==================================================
    // TEAM STATUS
    // ==================================================

    if (
      team.status ===
      "REJECTED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot join a rejected team.",
      });
    }

    // ==================================================
    // TEAM LEADER CANNOT JOIN
    // ==================================================

    if (
      String(team.leader) ===
      String(userId)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You are already the leader of this team.",
        team:
          team,
      });
    }

    // ==================================================
    // CHECK WHETHER USER ALREADY BELONGS TO ANY TEAM
    // IN THIS HACKATHON
    // ==================================================

    const existingMembership =
      await Team.findOne({
        hackathon:
          hackathonExists._id,

        $or: [
          {
            leader:
              userId,
          },
          {
            "members.email":
              userEmail,
          },
        ],
      });

    if (
      existingMembership
    ) {
      const alreadyTarget =
        String(
          existingMembership._id
        ) ===
        String(team._id);

      if (
        alreadyTarget
      ) {
        return res.status(409).json({
          success: false,
          message:
            "You are already a member of this team.",
          team:
            await populateTeam(
              Team.findById(
                team._id
              )
            ),
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "You already belong to another team for this hackathon.",
        team:
          existingMembership,
      });
    }

    // ==================================================
    // CHECK TARGET TEAM MEMBERS
    // ==================================================

    const alreadyMember =
      team.members.some(
        (member) =>
          String(
            member.email
          )
            .trim()
            .toLowerCase() ===
          userEmail
      );

    if (
      alreadyMember
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You are already listed as a member of this team.",
      });
    }

    // ==================================================
    // ADD USER TO TEAM
    // ==================================================

    team.members.push({
      name:
        user.name,

      email:
        userEmail,

      role:
        "Member",
    });

    await team.save();

    // ==================================================
    // POPULATE UPDATED TEAM
    // ==================================================

    const populatedTeam =
      await populateTeam(
        Team.findById(
          team._id
        )
      );

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      message:
        "You joined the team successfully.",

      team:
        populatedTeam,

      teamId:
        team.teamId,
    });
  } catch (error) {
    console.error(
      "Join team error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You could not join this team because a duplicate record was detected.",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team validation failed.",
        error:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to join team.",
      error:
        error.message,
    });
  }
};

// ======================================================
// GET MY TEAM
// GET /api/teams/my/:hackathonId
//
// Works for:
//
// 1. Team Leader
// 2. Joined Team Member
// ======================================================

const getMyTeam = async (
  req,
  res
) => {
  try {
    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const {
      hackathonId,
    } = req.params;

    if (
      !hackathonId ||
      typeof hackathonId !==
        "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID is required",
      });
    }

    // ==================================================
    // FIND USER
    // ==================================================

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    const userEmail =
      String(
        user.email
      )
        .trim()
        .toLowerCase();

    // ==================================================
    // FIND HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findOne({
        hackathonId:
          hackathonId
            .trim()
            .toUpperCase(),
      });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found",
      });
    }

    // ==================================================
    // FIND TEAM
    //
    // Leader OR member.
    // ==================================================

    const team =
      await populateTeam(
        Team.findOne({
          hackathon:
            hackathon._id,

          $or: [
            {
              leader:
                userId,
            },
            {
              "members.email":
                userEmail,
            },
          ],
        })
      );

    return res.status(200).json({
      success: true,

      team:
        team || null,
    });
  } catch (error) {
    console.error(
      "Get my team error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get team",
      error:
        error.message,
    });
  }
};

// ======================================================
// GET ALL TEAMS FOR HACKATHON
// GET /api/teams/hackathon/:hackathonId
//
// Organizer/Admin access.
// ======================================================

const getHackathonTeams =
  async (
    req,
    res
  ) => {
    try {
      const {
        hackathonId,
      } = req.params;

      if (
        !hackathonId ||
        typeof hackathonId !==
          "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Hackathon ID is required",
        });
      }

      // ==================================================
      // AUTHORIZATION
      // ==================================================

      if (
        !isOrganizerOrAdmin(req)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only organizers or administrators can access hackathon teams.",
        });
      }

      const reviewerId =
        getUserId(req);

      // ==================================================
      // FIND HACKATHON
      // ==================================================

      let hackathon;

      if (
        isAdmin(req)
      ) {
        hackathon =
          await Hackathon.findOne({
            hackathonId:
              hackathonId
                .trim()
                .toUpperCase(),
          });
      } else {
        hackathon =
          await Hackathon.findOne({
            hackathonId:
              hackathonId
                .trim()
                .toUpperCase(),

            organizer:
              reviewerId,
          });
      }

      if (!hackathon) {
        return res.status(404).json({
          success: false,
          message:
            "Hackathon not found or you are not authorized to access it.",
        });
      }

      // ==================================================
      // GET TEAMS
      // ==================================================

      const teams =
        await populateTeam(
          Team.find({
            hackathon:
              hackathon._id,
          }).sort({
            createdAt:
              -1,
          })
        );

      return res.status(200).json({
        success: true,

        count:
          teams.length,

        teams,
      });
    } catch (error) {
      console.error(
        "Get hackathon teams error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to get teams",
        error:
          error.message,
      });
    }
  };

// ======================================================
// APPROVE TEAM
//
// PATCH /api/teams/:teamId/approve
//
// ONLY ORGANIZER / ADMIN
// ======================================================

const approveTeam = async (
  req,
  res
) => {
  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const reviewerId =
      getUserId(req);

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ==================================================
    // AUTHORIZATION
    // ==================================================

    if (
      !isOrganizerOrAdmin(req)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only organizers or administrators can approve teams.",
      });
    }

    // ==================================================
    // TEAM ID
    // ==================================================

    const {
      teamId,
    } = req.params;

    if (
      !teamId ||
      !mongoose.Types.ObjectId.isValid(
        teamId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid team ID",
      });
    }

    // ==================================================
    // FIND TEAM
    // ==================================================

    const team =
      await Team.findById(
        teamId
      );

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // ==================================================
    // VERIFY HACKATHON OWNERSHIP
    // ==================================================

    if (
      !isAdmin(req)
    ) {
      const hackathon =
        await Hackathon.findOne({
          _id:
            team.hackathon,

          organizer:
            reviewerId,
        });

      if (!hackathon) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to approve this team.",
        });
      }
    }

    // ==================================================
    // CHECK STATUS
    // ==================================================

    if (
      team.status ===
      "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This team has already been approved.",
        team,
      });
    }

    if (
      team.status ===
      "REJECTED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A rejected team cannot be approved.",
        team,
      });
    }

    // ==================================================
    // APPROVE
    // ==================================================

    team.status =
      "APPROVED";

    team.reviewedBy =
      reviewerId;

    team.reviewedAt =
      new Date();

    team.rejectionReason =
      "";

    await team.save();

    // ==================================================
    // RETURN UPDATED TEAM
    // ==================================================

    const updatedTeam =
      await populateTeam(
        Team.findById(
          team._id
        )
      );

    return res.status(200).json({
      success: true,

      message:
        "Team approved successfully.",

      team:
        updatedTeam,
    });
  } catch (error) {
    console.error(
      "Approve team error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team validation failed.",
        error:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve team.",
      error:
        error.message,
    });
  }
};

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
// ONLY ORGANIZER / ADMIN
// ======================================================

const rejectTeam = async (
  req,
  res
) => {
  try {
    // ==================================================
    // AUTHENTICATION
    // ==================================================

    const reviewerId =
      getUserId(req);

    if (!reviewerId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ==================================================
    // AUTHORIZATION
    // ==================================================

    if (
      !isOrganizerOrAdmin(req)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only organizers or administrators can reject teams.",
      });
    }

    // ==================================================
    // TEAM ID
    // ==================================================

    const {
      teamId,
    } = req.params;

    if (
      !teamId ||
      !mongoose.Types.ObjectId.isValid(
        teamId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid team ID",
      });
    }

    // ==================================================
    // REJECTION REASON
    // ==================================================

    const reason =
      req.body?.reason
        ? String(
            req.body.reason
          ).trim()
        : "";

    if (!reason) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason is required.",
      });
    }

    if (
      reason.length >
      1000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Rejection reason cannot exceed 1000 characters.",
      });
    }

    // ==================================================
    // FIND TEAM
    // ==================================================

    const team =
      await Team.findById(
        teamId
      );

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // ==================================================
    // VERIFY HACKATHON OWNERSHIP
    // ==================================================

    if (
      !isAdmin(req)
    ) {
      const hackathon =
        await Hackathon.findOne({
          _id:
            team.hackathon,

          organizer:
            reviewerId,
        });

      if (!hackathon) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to reject this team.",
        });
      }
    }

    // ==================================================
    // CHECK STATUS
    // ==================================================

    if (
      team.status ===
      "REJECTED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This team has already been rejected.",
        team,
      });
    }

    if (
      team.status ===
      "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "An approved team cannot be rejected.",
        team,
      });
    }

    // ==================================================
    // REJECT
    // ==================================================

    team.status =
      "REJECTED";

    team.reviewedBy =
      reviewerId;

    team.reviewedAt =
      new Date();

    team.rejectionReason =
      reason;

    await team.save();

    // ==================================================
    // RETURN UPDATED TEAM
    // ==================================================

    const updatedTeam =
      await populateTeam(
        Team.findById(
          team._id
        )
      );

    return res.status(200).json({
      success: true,

      message:
        "Team rejected successfully.",

      team:
        updatedTeam,
    });
  } catch (error) {
    console.error(
      "Reject team error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team validation failed.",
        error:
          error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject team.",
      error:
        error.message,
    });
  }
};

// ======================================================
// LEAVE HACKATHON
//
// POST /api/teams/leave-hackathon
//
// Body:
//
// {
//   "hackathon": "HACK-7F3A91"
// }
//
// Behavior:
//
// - Team member: removed from the team
// - Team leader with no other members: team is deleted
// - Team leader with other members: leaving is blocked
//
// ======================================================

const leaveHackathon = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const user = await User.findById(
      userId
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    const publicHackathonId =
      req.body?.hackathon
        ? String(
            req.body.hackathon
          )
            .trim()
            .toUpperCase()
        : "";

    if (!publicHackathonId) {
      return res.status(400).json({
        success: false,
        message:
          "Hackathon ID is required",
      });
    }

    // ==================================================
    // FIND HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findOne({
        hackathonId:
          publicHackathonId,
      });

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found",
      });
    }

    const userEmail =
      String(
        user.email || ""
      )
        .trim()
        .toLowerCase();

    // ==================================================
    // FIND USER'S TEAM
    // ==================================================

    const team =
      await Team.findOne({
        hackathon:
          hackathon._id,

        $or: [
          {
            leader:
              userId,
          },
          {
            "members.email":
              userEmail,
          },
        ],
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "You are not currently part of a team in this hackathon.",
      });
    }

    // ==================================================
    // TEAM LEADER
    // ==================================================

    if (
      String(team.leader) ===
      String(userId)
    ) {
      const remainingMembers =
        Array.isArray(
          team.members
        )
          ? team.members.filter(
              (member) =>
                String(
                  member.email || ""
                )
                  .trim()
                  .toLowerCase() !==
                userEmail
            )
          : [];

      // ----------------------------------------------
      // LEADER IS THE ONLY PERSON
      // ----------------------------------------------

      if (
        remainingMembers.length ===
        0
      ) {
        await team.deleteOne();

        return res.status(200).json({
          success: true,
          message:
            "You left the hackathon successfully. Your empty team was removed.",
        });
      }

      // ----------------------------------------------
      // LEADER HAS OTHER MEMBERS
      // ----------------------------------------------

      return res.status(400).json({
        success: false,
        message:
          "You are the team leader. Remove or transfer your teammates before leaving the hackathon.",
      });
    }

    // ==================================================
    // NORMAL TEAM MEMBER
    // ==================================================

    team.members =
      Array.isArray(
        team.members
      )
        ? team.members.filter(
            (member) =>
              String(
                member.email || ""
              )
                .trim()
                .toLowerCase() !==
              userEmail
          )
        : [];

    await team.save();

    return res.status(200).json({
      success: true,
      message:
        "You left the hackathon successfully.",
    });
  } catch (error) {
    console.error(
      "Leave hackathon error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to leave hackathon.",
      error:
        error.message,
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  createTeam,
  joinTeam,
  getMyTeam,
  getHackathonTeams,
  approveTeam,
  rejectTeam,
  leaveHackathon,
};