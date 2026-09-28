const mongoose = require("mongoose");

const Project = require("../models/Project");
const Team = require("../models/Team");
const Hackathon = require("../models/Hackathon");
const User = require("../models/User");
const JudgeAssignment = require("../models/JudgeAssignment");

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
// HELPER - GET LOGGED IN USER
// ======================================================

const getLoggedInUser = async (req) => {
  const userId = getUserId(req);

  if (!userId) {
    return null;
  }

  if (
    !mongoose.Types.ObjectId.isValid(
      userId
    )
  ) {
    return null;
  }

  return User.findById(userId);
};

// ======================================================
// HELPER - CHECK TEAM MEMBERSHIP
// ======================================================
//
// Returns true when the logged-in user is:
//
// 1. Team leader
// OR
// 2. Listed in team.members by email
//
// ======================================================

const isTeamMember = (
  team,
  user
) => {
  if (!team || !user) {
    return false;
  }

  const userId =
    String(user._id);

  const userEmail =
    String(user.email || "")
      .trim()
      .toLowerCase();

  // ----------------------------------------------------
  // TEAM LEADER
  // ----------------------------------------------------

  if (
    String(team.leader) ===
    userId
  ) {
    return true;
  }

  // ----------------------------------------------------
  // TEAM MEMBER
  // ----------------------------------------------------

  if (
    Array.isArray(
      team.members
    )
  ) {
    return team.members.some(
      (member) =>
        String(
          member.email || ""
        )
          .trim()
          .toLowerCase() ===
        userEmail
    );
  }

  return false;
};

// ======================================================
// HELPER - GET TEAM FOR USER
// ======================================================
//
// Finds a team in a specific hackathon where the user
// is either the leader or a member.
// ======================================================

const findUserTeam = async (
  hackathonId,
  user
) => {
  if (!hackathonId || !user) {
    return null;
  }

  const userEmail =
    String(user.email || "")
      .trim()
      .toLowerCase();

  return Team.findOne({
    hackathon:
      hackathonId,

    $or: [
      {
        leader:
          user._id,
      },
      {
        "members.email":
          userEmail,
      },
    ],
  });
};

// ======================================================
// CREATE PROJECT
// POST /api/projects
// ======================================================
//
// Team leader OR team member can submit the project.
//
// Project is created as SUBMITTED.
//
// If judges were assigned before project submission,
// their assignments are automatically linked to this
// new project.
// ======================================================

const createProject = async (
  req,
  res
) => {
  try {
    const user =
      await getLoggedInUser(
        req
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    const userId =
      String(user._id);

    const {
      teamId,
      projectName,
      problemStatement,
      solution,
      technologyStack,
      githubUrl,
      demoUrl,
      presentationUrl,
    } = req.body;

    // ==================================================
    // VALIDATE TEAM ID
    // ==================================================

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message:
          "Team ID is required",
      });
    }

    if (
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
    // VALIDATE PROJECT DATA
    // ==================================================

    const cleanProjectName =
      String(
        projectName || ""
      ).trim();

    const cleanProblemStatement =
      String(
        problemStatement || ""
      ).trim();

    const cleanSolution =
      String(
        solution || ""
      ).trim();

    const cleanTechnologyStack =
      String(
        technologyStack || ""
      ).trim();

    if (
      !cleanProjectName ||
      !cleanProblemStatement ||
      !cleanSolution ||
      !cleanTechnologyStack
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Project name, problem statement, solution and technology stack are required",
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
    // VERIFY USER IS TEAM MEMBER
    // ==================================================

    if (
      !isTeamMember(
        team,
        user
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not a member of this team",
      });
    }

    // ==================================================
    // TEAM MUST BE APPROVED
    // ==================================================

    if (
      team.status !==
      "APPROVED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          team.status ===
          "PENDING"
            ? "Your team must be approved by the organizer before submitting a project"
            : "Rejected teams cannot submit projects",
      });
    }

    // ==================================================
    // FIND HACKATHON
    // ==================================================

    const hackathon =
      await Hackathon.findById(
        team.hackathon
      );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message:
          "Hackathon not found",
      });
    }

    // ==================================================
    // HACKATHON STATUS
    // ==================================================

    if (
      hackathon.status ===
      "DRAFT"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This hackathon has not been published yet",
      });
    }

    if (
      hackathon.status ===
      "COMPLETED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This hackathon has already been completed",
      });
    }

    // ==================================================
    // CHECK EXISTING PROJECT
    // ==================================================

    const existingProject =
      await Project.findOne({
        team: teamId,
      });

    if (existingProject) {
      return res.status(409).json({
        success: false,
        message:
          "This team already has a project",
        project:
          existingProject,
      });
    }

    // ==================================================
    // CREATE PROJECT
    // ==================================================

    const project =
      await Project.create({
        team:
          teamId,

        hackathon:
          team.hackathon,

        projectName:
          cleanProjectName,

        problemStatement:
          cleanProblemStatement,

        solution:
          cleanSolution,

        technologyStack:
          cleanTechnologyStack,

        githubUrl:
          githubUrl
            ? String(
                githubUrl
              ).trim()
            : "",

        demoUrl:
          demoUrl
            ? String(
                demoUrl
              ).trim()
            : "",

        presentationUrl:
          presentationUrl
            ? String(
                presentationUrl
              ).trim()
            : "",

        status:
          "SUBMITTED",

        submittedAt:
          new Date(),
      });

    // ==================================================
    // LINK PROJECT TO TEAM
    // ==================================================

    team.project =
      project._id;

    await team.save();

    // ==================================================
    // LINK PROJECT TO EXISTING JUDGE ASSIGNMENTS
    // ==================================================
    //
    // This is important for your new workflow.
    //
    // A judge may have been assigned before the project
    // was submitted.
    //
    // Those assignments currently contain:
    //
    // project: null
    //
    // After project submission they become:
    //
    // project: project._id
    //
    // ==================================================

    const assignmentUpdate =
      await JudgeAssignment.updateMany(
        {
          hackathon:
            team.hackathon,

          team:
            team._id,

          $or: [
            {
              project:
                null,
            },
            {
              project: {
                $exists:
                  false,
              },
            },
          ],
        },
        {
          $set: {
            project:
              project._id,
          },
        }
      );

    console.log(
      "Judge assignments linked to project:",
      assignmentUpdate.modifiedCount
    );

    // ==================================================
    // POPULATE RESPONSE
    // ==================================================

    const populatedProject =
      await Project.findById(
        project._id
      )
        .populate(
          "team",
          "teamId name status leader members"
        )
        .populate(
          "hackathon",
          "hackathonId name status startDate endDate"
        );

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,

      message:
        "Project submitted successfully",

      project:
        populatedProject,
    });
  } catch (error) {
    console.error(
      "Create project error:",
      error
    );

    // ==================================================
    // DUPLICATE PROJECT
    // ==================================================

    if (
      error.code ===
      11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This team already has a project",
      });
    }

    // ==================================================
    // VALIDATION ERROR
    // ==================================================

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Project validation failed",
        error:
          error.message,
      });
    }

    // ==================================================
    // CAST ERROR
    // ==================================================

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid team or project data",
      });
    }

    // ==================================================
    // GENERAL ERROR
    // ==================================================

    return res.status(500).json({
      success: false,
      message:
        "Server error while submitting project",
      error:
        error.message,
    });
  }
};

// ======================================================
// GET MY PROJECT
// GET /api/projects/my
//
// Optional query:
//
// /api/projects/my?hackathonId=HACK-7F3A91
//
// Works for team leaders AND joined members.
// ======================================================

const getMyProject = async (
  req,
  res
) => {
  try {
    const user =
      await getLoggedInUser(
        req
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required",
      });
    }

    // ==================================================
    // OPTIONAL HACKATHON FILTER
    // ==================================================

    const requestedHackathonId =
      req.query?.hackathonId
        ? String(
            req.query.hackathonId
          )
            .trim()
            .toUpperCase()
        : null;

    let hackathonObjectId =
      null;

    if (
      requestedHackathonId
    ) {
      const hackathon =
        await Hackathon.findOne({
          hackathonId:
            requestedHackathonId,
        });

      if (!hackathon) {
        return res.status(404).json({
          success: false,
          message:
            "Hackathon not found",
        });
      }

      hackathonObjectId =
        hackathon._id;
    }

    // ==================================================
    // FIND USER TEAM
    // ==================================================

    const teamQuery = {
      $or: [
        {
          leader:
            user._id,
        },
        {
          "members.email":
            String(
              user.email
            )
              .trim()
              .toLowerCase(),
        },
      ],
    };

    if (
      hackathonObjectId
    ) {
      teamQuery.hackathon =
        hackathonObjectId;
    }

    const team =
      await Team.findOne(
        teamQuery
      );

    if (!team) {
      return res.status(404).json({
        success: false,
        message:
          "Team not found",
      });
    }

    // ==================================================
    // FIND PROJECT
    // ==================================================

    const project =
      await Project.findOne({
        team:
          team._id,
      })
        .populate(
          "team",
          "teamId name status leader members"
        )
        .populate(
          "hackathon",
          "hackathonId name status startDate endDate"
        );

    if (!project) {
      return res.status(404).json({
        success: false,
        message:
          "Project not submitted yet",
      });
    }

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      project,
    });
  } catch (error) {
    console.error(
      "Get project error:",
      error
    );

    if (
      error.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid hackathon or team data",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching project",
      error:
        error.message,
    });
  }
};

// ======================================================
// GET PROJECT BY TEAM
// GET /api/projects/team/:teamId
//
// Team leader OR team member can access the project.
// ======================================================

const getProjectByTeam =
  async (
    req,
    res
  ) => {
    try {
      const user =
        await getLoggedInUser(
          req
        );

      if (!user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required",
        });
      }

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
      // VERIFY MEMBERSHIP
      // ==================================================

      if (
        !isTeamMember(
          team,
          user
        )
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not a member of this team",
        });
      }

      // ==================================================
      // FIND PROJECT
      // ==================================================

      const project =
        await Project.findOne({
          team:
            teamId,
        })
          .populate(
            "team",
            "teamId name status leader members"
          )
          .populate(
            "hackathon",
            "hackathonId name status startDate endDate"
          );

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not submitted yet",
        });
      }

      return res.status(200).json({
        success: true,
        project,
      });
    } catch (error) {
      console.error(
        "Get project by team error:",
        error
      );

      if (
        error.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid team ID",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching project",
        error:
          error.message,
      });
    }
  };

// ======================================================
// EXPORT
// ======================================================

module.exports = {
  createProject,
  getMyProject,
  getProjectByTeam,
};