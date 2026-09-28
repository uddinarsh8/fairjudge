"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

// =====================================================
// TEAM TYPES
// =====================================================

type TeamMember = {
  name: string;
  email: string;
  role: string;
};

type Team = {
  _id: string;
  name: string;

  hackathon: any;

  leader: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };

  members: TeamMember[];

  project?: string | null;

  status: string;

  rejectionReason?: string;
};

// =====================================================
// PROJECT TYPE
// =====================================================

type Project = {
  _id: string;

  team: any;

  hackathon: any;

  projectName: string;

  problemStatement: string;

  solution: string;

  technologyStack: string;

  githubUrl?: string;

  demoUrl?: string;

  presentationUrl?: string;

  status: "DRAFT" | "SUBMITTED" | "LOCKED";

  submittedAt?: string | null;

  lockedAt?: string | null;

  createdAt?: string;

  updatedAt?: string;
};

// =====================================================
// PROJECT FORM
// =====================================================

type ProjectForm = {
  projectName: string;
  problemStatement: string;
  solution: string;
  technologyStack: string;
  githubUrl: string;
  demoUrl: string;
  presentationUrl: string;
};

// =====================================================
// INITIAL PROJECT FORM
// =====================================================

const initialProjectForm: ProjectForm = {
  projectName: "",
  problemStatement: "",
  solution: "",
  technologyStack: "",
  githubUrl: "",
  demoUrl: "",
  presentationUrl: "",
};

// =====================================================
// TEAM DASHBOARD
// =====================================================

export default function TeamDashboard() {
  const {
    user,
    logout,
    token,
  } = useAuth();

  // ===================================================
  // TEAM
  // ===================================================

  const [team, setTeam] =
    useState<Team | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  // ===================================================
  // HACKATHON
  // ===================================================

  const [hackathonId, setHackathonId] =
    useState("");

  const [hackathonName, setHackathonName] =
    useState("");

  const [hackathonLoading, setHackathonLoading] =
    useState(false);

  // ===================================================
  // CREATE TEAM
  // ===================================================

  const [showCreateTeam, setShowCreateTeam] =
    useState(false);

  const [teamName, setTeamName] =
    useState("");

  const [members, setMembers] =
    useState<TeamMember[]>([]);

  // ===================================================
  // PROJECT
  // ===================================================

  const [project, setProject] =
    useState<Project | null>(null);

  const [projectLoading, setProjectLoading] =
    useState(false);

  const [showProjectModal, setShowProjectModal] =
    useState(false);

  const [projectSubmitting, setProjectSubmitting] =
    useState(false);

  const [projectForm, setProjectForm] =
    useState<ProjectForm>(
      initialProjectForm
    );

  // ===================================================
  // PROJECT MESSAGE
  // ===================================================

  const [projectError, setProjectError] =
    useState("");

  // ===================================================
  // LOAD SAVED HACKATHON ID
  // ===================================================

  useEffect(() => {
    const savedHackathon =
      localStorage.getItem(
        "fairjudge_hackathon"
      );

    if (savedHackathon) {
      setHackathonId(
        savedHackathon
          .trim()
          .toUpperCase()
      );
    }
  }, []);

  // ===================================================
  // SAVE HACKATHON ID
  // ===================================================

  useEffect(() => {
    if (hackathonId.trim()) {
      localStorage.setItem(
        "fairjudge_hackathon",
        hackathonId
          .trim()
          .toUpperCase()
      );
    }
  }, [hackathonId]);

  // ===================================================
// LOAD HACKATHON
// ===================================================

useEffect(() => {
  const loadHackathon = async () => {
    // -------------------------------------------------
    // VALIDATE HACKATHON ID
    // -------------------------------------------------

    const publicId = String(hackathonId || "")
      .trim()
      .toUpperCase();

    if (!publicId) {
      setHackathonName("");
      setHackathonLoading(false);
      return;
    }

    try {
      setHackathonLoading(true);

      console.log(
        "================================="
      );
      console.log(
        "LOADING HACKATHON"
      );
      console.log(
        "Public Hackathon ID:",
        publicId
      );
      console.log(
        "Endpoint:",
        `/hackathons/public/${publicId}`
      );
      console.log(
        "================================="
      );

      const response = await apiRequest(
        `/hackathons/public/${encodeURIComponent(
          publicId
        )}`,
        {
          method: "GET",
        }
      );

      console.log(
        "Hackathon response:",
        response
      );

      // -------------------------------------------------
      // HACKATHON FOUND
      // -------------------------------------------------

      if (
        response?.success &&
        response?.hackathon
      ) {
        console.log(
          "Hackathon found:",
          response.hackathon
        );

        setHackathonName(
          response.hackathon.name || ""
        );
      } else {
        console.warn(
          "Hackathon response did not contain a hackathon:",
          response
        );

        setHackathonName("");
      }
    } catch (error) {
      console.error(
        "Load hackathon error:",
        error
      );

      setHackathonName("");
    } finally {
      setHackathonLoading(false);
    }
  };

  loadHackathon();
}, [hackathonId]);
  // ===================================================
// LOAD MY TEAM
// ===================================================

useEffect(() => {
  const loadTeam = async () => {
    // -------------------------------------------------
    // NORMALIZE PUBLIC HACKATHON ID
    // -------------------------------------------------

    const publicId = String(hackathonId || "")
      .trim()
      .toUpperCase();

    // -------------------------------------------------
    // VALIDATE AUTH + HACKATHON ID
    // -------------------------------------------------

    if (!token || !publicId) {
      setTeam(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      console.log(
        "================================="
      );
      console.log(
        "LOADING MY TEAM"
      );
      console.log(
        "Public Hackathon ID:",
        publicId
      );
      console.log(
        "Endpoint:",
        `/teams/my/${publicId}`
      );
      console.log(
        "Token available:",
        !!token
      );
      console.log(
        "================================="
      );

      const response = await apiRequest(
        `/teams/my/${encodeURIComponent(
          publicId
        )}`,
        {
          method: "GET",
          token,
        }
      );

      console.log(
        "My team response:",
        response
      );

      // -------------------------------------------------
      // TEAM FOUND
      // -------------------------------------------------

      if (
        response?.success
      ) {
        setTeam(
          response?.team || null
        );
      } else {
        setTeam(null);
      }
    } catch (error) {
      console.error(
        "Load team error:",
        error
      );

      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  loadTeam();
}, [
  token,
  hackathonId,
]);

  // ===================================================
  // LOAD MY PROJECT
  // ===================================================

  useEffect(() => {
    const loadProject =
      async () => {
        if (
          !token ||
          !hackathonId.trim() ||
          !team
        ) {
          setProject(null);
          return;
        }

        try {
          setProjectLoading(true);

          const response =
            await apiRequest(
              `/projects/my?hackathonId=${encodeURIComponent(
                hackathonId
                  .trim()
                  .toUpperCase()
              )}`,
              {
                method: "GET",
                token,
              }
            );

          console.log(
            "My project response:",
            response
          );

          if (response?.project) {
            setProject(
              response.project
            );
          } else {
            setProject(null);
          }
        } catch (error) {
          console.log(
            "Project not found yet:",
            error
          );

          setProject(null);
        } finally {
          setProjectLoading(false);
        }
      };

    loadProject();
  }, [
    token,
    hackathonId,
    team,
  ]);

  // ===================================================
  // CHANGE HACKATHON
  // ===================================================

  const handleHackathonChange = (
    value: string
  ) => {
    const formatted =
      value.toUpperCase();

    setHackathonId(
      formatted
    );

    setTeam(null);
    setProject(null);
    setHackathonName("");
  };

  // ===================================================
  // CREATE TEAM
  // ===================================================

  const handleCreateTeam =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      if (!token) {
        alert(
          "Authentication required. Please login again."
        );
        return;
      }

      if (!hackathonId.trim()) {
        alert(
          "Please enter the Hackathon ID."
        );
        return;
      }

      if (!teamName.trim()) {
        alert(
          "Please enter a team name."
        );
        return;
      }

      if (!hackathonName) {
        alert(
          "Please enter a valid Hackathon ID."
        );
        return;
      }

      setCreating(true);

      try {
        const response =
          await apiRequest(
            "/teams",
            {
              method: "POST",

              body: {
                hackathon:
                  hackathonId
                    .trim()
                    .toUpperCase(),

                name:
                  teamName.trim(),

                members: members
                  .filter(
                    (member) =>
                      member.name.trim() &&
                      member.email.trim()
                  )
                  .map(
                    (member) => ({
                      name:
                        member.name.trim(),

                      email:
                        member.email
                          .trim()
                          .toLowerCase(),

                      role:
                        member.role?.trim() ||
                        "Member",
                    })
                  ),
              },

              token,
            }
          );

        console.log(
          "Create team response:",
          response
        );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to create team"
          );
        }

        setTeam(
          response.team || null
        );

        setShowCreateTeam(false);

        setTeamName("");

        setMembers([]);

        alert(
          "Team request submitted successfully!"
        );
      } catch (error) {
        console.error(
          "Create team error:",
          error
        );

        alert(
          error instanceof Error
            ? error.message
            : "Failed to create team"
        );
      } finally {
        setCreating(false);
      }
    };

  // ===================================================
  // ADD MEMBER
  // ===================================================

  const addMember = () => {
    setMembers([
      ...members,
      {
        name: "",
        email: "",
        role: "Member",
      },
    ]);
  };

  // ===================================================
  // REMOVE MEMBER
  // ===================================================

  const removeMember = (
    index: number
  ) => {
    setMembers(
      members.filter(
        (_, memberIndex) =>
          memberIndex !== index
      )
    );
  };

  // ===================================================
  // UPDATE MEMBER
  // ===================================================

  const updateMember = (
    index: number,
    field:
      | "name"
      | "email"
      | "role",
    value: string
  ) => {
    const updated = [
      ...members,
    ];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setMembers(updated);
  };

  // ===================================================
  // UPDATE PROJECT FORM
  // ===================================================

  const updateProjectField = (
    field: keyof ProjectForm,
    value: string
  ) => {
    setProjectForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  // ===================================================
  // OPEN PROJECT MODAL
  // ===================================================

  const openProjectModal = () => {
    if (!team) {
      alert(
        "Please create a team first."
      );
      return;
    }

    if (
      team.status !==
      "APPROVED"
    ) {
      alert(
        team.status ===
          "PENDING"
          ? "Your team must be approved by the organizer before submitting a project."
          : "Rejected teams cannot submit projects."
      );

      return;
    }

    if (project) {
      alert(
        "Your project has already been submitted."
      );

      return;
    }

    setProjectError("");

    setProjectForm(
      initialProjectForm
    );

    setShowProjectModal(true);
  };

  // ===================================================
  // SUBMIT PROJECT
  // ===================================================

  const handleSubmitProject =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      setProjectError("");

      if (!token) {
        setProjectError(
          "Authentication required. Please login again."
        );

        return;
      }

      if (!team) {
        setProjectError(
          "Team not found."
        );

        return;
      }

      if (
        team.status !==
        "APPROVED"
      ) {
        setProjectError(
          "Your team must be approved before submitting a project."
        );

        return;
      }

      // -----------------------------------------------
      // REQUIRED FIELDS
      // -----------------------------------------------

      if (
        !projectForm.projectName.trim()
      ) {
        setProjectError(
          "Project name is required."
        );

        return;
      }

      if (
        !projectForm.problemStatement.trim()
      ) {
        setProjectError(
          "Problem statement is required."
        );

        return;
      }

      if (
        !projectForm.solution.trim()
      ) {
        setProjectError(
          "Solution is required."
        );

        return;
      }

      if (
        !projectForm.technologyStack.trim()
      ) {
        setProjectError(
          "Technology stack is required."
        );

        return;
      }

      setProjectSubmitting(true);

      try {
        const response =
          await apiRequest(
            "/projects",
            {
              method: "POST",

              token,

              body: {
                teamId:
                  team._id,

                projectName:
                  projectForm.projectName.trim(),

                problemStatement:
                  projectForm.problemStatement.trim(),

                solution:
                  projectForm.solution.trim(),

                technologyStack:
                  projectForm.technologyStack.trim(),

                githubUrl:
                  projectForm.githubUrl.trim(),

                demoUrl:
                  projectForm.demoUrl.trim(),

                presentationUrl:
                  projectForm.presentationUrl.trim(),
              },
            }
          );

        console.log(
          "Project submission response:",
          response
        );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to submit project."
          );
        }

        // ---------------------------------------------
        // SAVE PROJECT
        // ---------------------------------------------

        setProject(
          response.project ||
            null
        );

        // ---------------------------------------------
        // CLOSE MODAL
        // ---------------------------------------------

        setShowProjectModal(
          false
        );

        // ---------------------------------------------
        // RESET FORM
        // ---------------------------------------------

        setProjectForm(
          initialProjectForm
        );

        alert(
          "Project submitted successfully!"
        );
      } catch (error) {
        console.error(
          "Submit project error:",
          error
        );

        setProjectError(
          error instanceof Error
            ? error.message
            : "Failed to submit project."
        );
      } finally {
        setProjectSubmitting(
          false
        );
      }
    };

  // ===================================================
  // PROJECT STATUS
  // ===================================================

  const getProjectStatusClass = (
    status?: string
  ) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-500/10 text-blue-400";

      case "LOCKED":
        return "bg-purple-500/10 text-purple-400";

      case "DRAFT":
        return "bg-yellow-500/10 text-yellow-400";

      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-slate-400">
            Loading your team...
          </p>

        </div>
      </main>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-800 bg-slate-900">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div>
            <h1 className="text-2xl font-bold">
              FairJudge
            </h1>

            <p className="text-sm text-slate-400">
              Team Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="text-right">

              <p className="text-sm font-medium">
                {user?.name ||
                  "Team"}
              </p>

              <p className="text-xs text-slate-400">
                {user?.email}
              </p>

            </div>

            <button
              onClick={logout}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Logout
            </button>

          </div>

        </div>

      </header>

      {/* =================================================
          DASHBOARD
      ================================================= */}

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* =================================================
            WELCOME
        ================================================= */}

        <div className="mb-8">

          <h2 className="text-3xl font-bold">
            Welcome,{" "}
            {user?.name ||
              "Team"}{" "}
            👋
          </h2>

          <p className="mt-2 text-slate-400">
            Manage your hackathon team,
            project and evaluation.
          </p>

        </div>

        {/* =================================================
            HACKATHON ID
        ================================================= */}

        <section className="mb-8 rounded-2xl border border-blue-500/30 bg-slate-900 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

            <div className="flex-1">

              <label className="mb-2 block text-sm font-medium text-blue-400">
                HACKATHON ID
              </label>

              <input
                type="text"
                value={
                  hackathonId
                }
                onChange={(e) =>
                  handleHackathonChange(
                    e.target.value
                  )
                }
                placeholder="Example: HACK-7F3A91"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-semibold uppercase tracking-wide text-white outline-none focus:border-blue-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                Enter the public Hackathon ID
                provided by the organizer.
              </p>

            </div>

            <div className="md:min-w-[300px]">

              <p className="text-sm text-slate-400">
                Hackathon
              </p>

              {hackathonLoading ? (

                <p className="mt-1 text-slate-500">
                  Checking Hackathon...
                </p>

              ) : hackathonName ? (

                <p className="mt-1 text-xl font-bold text-white">
                  {hackathonName}
                </p>

              ) : hackathonId ? (

                <p className="mt-1 text-red-400">
                  Hackathon not found
                </p>

              ) : (

                <p className="mt-1 text-slate-500">
                  Enter Hackathon ID
                </p>

              )}

            </div>

          </div>

        </section>

        {/* =================================================
            CURRENT HACKATHON
        ================================================= */}

        {hackathonName && (

          <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>

                <p className="text-sm text-blue-400">
                  CURRENT HACKATHON
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  {hackathonName}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Hackathon ID:{" "}
                  <span className="font-semibold text-blue-400">
                    {hackathonId}
                  </span>
                </p>

              </div>

              <span className="w-fit rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
                Active
              </span>

            </div>

          </section>

        )}

        {/* =================================================
            TEAM SECTION
        ================================================= */}

        {!team ? (

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                👥
              </div>

              <h3 className="mt-5 text-2xl font-bold">
                You haven't created a team yet
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-slate-400">
                Enter your Hackathon ID and
                create your team.
              </p>

              <button
                onClick={() =>
                  setShowCreateTeam(
                    true
                  )
                }
                disabled={
                  !hackathonId.trim() ||
                  !hackathonName
                }
                className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Create Team
              </button>

              {!hackathonId.trim() && (
                <p className="mt-3 text-sm text-yellow-500">
                  Enter a Hackathon ID first.
                </p>
              )}

            </div>

          </section>

        ) : (

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>

                <p className="text-sm text-blue-400">
                  YOUR TEAM
                </p>

                <h3 className="mt-1 text-2xl font-bold">
                  {team.name}
                </h3>

                <p className="mt-2 text-sm text-slate-400">
                  Team Leader:{" "}
                  {team.leader?.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Hackathon ID:{" "}
                  {hackathonId}
                </p>

              </div>

              <span
                className={`w-fit rounded-full px-4 py-2 text-sm font-medium ${
                  team.status ===
                  "APPROVED"
                    ? "bg-green-500/10 text-green-400"
                    : team.status ===
                      "REJECTED"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-yellow-500/10 text-yellow-400"
                }`}
              >
                {team.status}
              </span>

            </div>

            {/* REJECTION REASON */}

            {team.status ===
              "REJECTED" &&
              team.rejectionReason && (

                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">

                  <p className="text-sm font-medium text-red-400">
                    Rejection Reason
                  </p>

                  <p className="mt-1 text-sm text-slate-300">
                    {
                      team.rejectionReason
                    }
                  </p>

                </div>

              )}

            {/* MEMBERS */}

            <div className="mt-6">

              <h4 className="text-lg font-semibold">
                Team Members
              </h4>

              <div className="mt-4 grid gap-3 md:grid-cols-2">

                {/* LEADER */}

                {team.leader && (

                  <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                    <div className="flex items-center justify-between">

                      <p className="font-medium">
                        {
                          team.leader
                            .name
                        }
                      </p>

                      <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                        Leader
                      </span>

                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {
                        team.leader
                          .email
                      }
                    </p>

                  </div>

                )}

                {team.members.map(
                  (
                    member,
                    index
                  ) => (

                    <div
                      key={index}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                    >

                      <p className="font-medium">
                        {
                          member.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {
                          member.email
                        }
                      </p>

                      <p className="mt-2 text-xs text-blue-400">
                        {
                          member.role
                        }
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>

          </section>

        )}

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mt-8 grid gap-5 md:grid-cols-4">

          <StatCard
            title="Current Round"
            value="Round 1"
            description="Evaluation in progress"
          />

          <StatCard
            title="Score"
            value="-- / 100"
            description="Results not released"
          />

          <StatCard
            title="Rank"
            value="--"
            description="Ranking unavailable"
          />

          <StatCard
            title="Evaluation"
            value="Pending"
            description="Judges are evaluating"
          />

        </div>

        {/* =================================================
            PROJECT
        ================================================= */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>

              <h3 className="text-xl font-semibold">
                Your Project
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Submit and manage your hackathon
                project.
              </p>

            </div>

            {!project && (
              <button
                onClick={
                  openProjectModal
                }
                disabled={
                  !team ||
                  team.status !==
                    "APPROVED" ||
                  projectLoading
                }
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {team?.status ===
                "PENDING"
                  ? "Waiting for Approval"
                  : team?.status ===
                    "REJECTED"
                  ? "Team Rejected"
                  : projectLoading
                  ? "Loading..."
                  : "Submit Project"}
              </button>
            )}

          </div>

          {/* PROJECT LOADING */}

          {projectLoading ? (

            <div className="mt-6 rounded-xl bg-slate-800/50 p-8 text-center">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

              <p className="mt-3 text-sm text-slate-400">
                Loading project...
              </p>

            </div>

          ) : project ? (

            <div className="mt-6 space-y-5">

              {/* PROJECT HEADER */}

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">

                  <div>

                    <p className="text-xs uppercase tracking-wider text-blue-400">
                      Project
                    </p>

                    <h4 className="mt-1 text-2xl font-bold">
                      {
                        project.projectName
                      }
                    </h4>

                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getProjectStatusClass(
                      project.status
                    )}`}
                  >
                    {
                      project.status
                    }
                  </span>

                </div>

                {/* PROBLEM */}

                <div className="mt-5">

                  <p className="text-sm font-medium text-slate-300">
                    Problem Statement
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {
                      project.problemStatement
                    }
                  </p>

                </div>

                {/* SOLUTION */}

                <div className="mt-5">

                  <p className="text-sm font-medium text-slate-300">
                    Solution
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {
                      project.solution
                    }
                  </p>

                </div>

                {/* TECHNOLOGY */}

                <div className="mt-5">

                  <p className="text-sm font-medium text-slate-300">
                    Technology Stack
                  </p>

                  <p className="mt-2 text-sm text-slate-400">
                    {
                      project.technologyStack
                    }
                  </p>

                </div>

                {/* LINKS */}

                <div className="mt-6 flex flex-wrap gap-3">

                  {project.githubUrl && (

                    <a
                      href={
                        project.githubUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      GitHub ↗
                    </a>

                  )}

                  {project.demoUrl && (

                    <a
                      href={
                        project.demoUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      Live Demo ↗
                    </a>

                  )}

                  {project.presentationUrl && (

                    <a
                      href={
                        project.presentationUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
                    >
                      Presentation ↗
                    </a>

                  )}

                </div>

                {/* SUBMITTED DATE */}

                {project.submittedAt && (

                  <p className="mt-5 text-xs text-slate-500">
                    Submitted on{" "}
                    {new Date(
                      project.submittedAt
                    ).toLocaleString()}
                  </p>

                )}

              </div>

            </div>

          ) : (

            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                🚀
              </div>

              <p className="mt-4 text-slate-400">
                No project submitted yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Once your team is approved,
                you can submit your project.
              </p>

              {team?.status !==
                "APPROVED" && (

                <p className="mt-3 text-sm text-yellow-500">
                  Team approval is required
                  before submission.
                </p>

              )}

            </div>

          )}

        </section>

        {/* =================================================
            EVALUATION
        ================================================= */}

        <section className="mt-8 grid gap-6 md:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h3 className="text-xl font-semibold">
              Evaluation
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              Your detailed scores will become
              available after the organizer
              releases the results.
            </p>

            <div className="mt-6 rounded-xl bg-slate-800/50 p-5">

              <p className="text-sm text-slate-400">
                Overall Score
              </p>

              <p className="mt-1 text-4xl font-bold">
                --
              </p>

            </div>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h3 className="text-xl font-semibold">
              Judge Feedback
            </h3>

            <div className="mt-6 rounded-xl bg-slate-800/50 p-5">

              <p className="text-sm text-slate-500">
                Feedback will appear here after
                evaluation.
              </p>

            </div>

          </div>

        </section>

      </div>

      {/* =================================================
          CREATE TEAM MODAL
      ================================================= */}

      {showCreateTeam && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 px-4 py-8">

          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  Create Your Team
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Hackathon ID:{" "}
                  <span className="font-semibold text-blue-400">
                    {hackathonId}
                  </span>
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateTeam(
                    false
                  )
                }
                className="text-2xl text-slate-400 hover:text-white"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={
                handleCreateTeam
              }
              className="mt-6 space-y-5"
            >

              {/* HACKATHON ID */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Hackathon ID
                </label>

                <input
                  type="text"
                  value={
                    hackathonId
                  }
                  onChange={(e) =>
                    handleHackathonChange(
                      e.target.value
                    )
                  }
                  placeholder="HACK-7F3A91"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 uppercase text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* TEAM NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Team Name
                </label>

                <input
                  type="text"
                  value={
                    teamName
                  }
                  onChange={(e) =>
                    setTeamName(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Dream Team"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* MEMBERS */}

              <div>

                <div className="flex items-center justify-between">

                  <label className="text-sm font-medium text-slate-300">
                    Team Members
                  </label>

                  <button
                    type="button"
                    onClick={
                      addMember
                    }
                    className="text-sm font-medium text-blue-400 hover:text-blue-300"
                  >
                    + Add Member
                  </button>

                </div>

                {members.length ===
                  0 && (

                  <div className="mt-3 rounded-xl border border-dashed border-slate-700 p-5 text-center">

                    <p className="text-sm text-slate-500">
                      No additional members
                      added.
                    </p>

                    <button
                      type="button"
                      onClick={
                        addMember
                      }
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      Add a teammate
                    </button>

                  </div>

                )}

                <div className="mt-3 space-y-3">

                  {members.map(
                    (
                      member,
                      index
                    ) => (

                      <div
                        key={index}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >

                        <div className="grid gap-3 md:grid-cols-2">

                          <input
                            type="text"
                            placeholder="Member name"
                            value={
                              member.name
                            }
                            onChange={(e) =>
                              updateMember(
                                index,
                                "name",
                                e.target
                                  .value
                              )
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          />

                          <input
                            type="email"
                            placeholder="Member email"
                            value={
                              member.email
                            }
                            onChange={(e) =>
                              updateMember(
                                index,
                                "email",
                                e.target
                                  .value
                              )
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          />

                        </div>

                        <div className="mt-3 flex justify-between gap-3">

                          <input
                            type="text"
                            placeholder="Role"
                            value={
                              member.role
                            }
                            onChange={(e) =>
                              updateMember(
                                index,
                                "role",
                                e.target
                                  .value
                              )
                            }
                            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeMember(
                                index
                              )
                            }
                            className="text-sm text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateTeam(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creating ||
                    !hackathonId.trim() ||
                    !hackathonName
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Creating..."
                    : "Create Team"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          PROJECT SUBMISSION MODAL
      ================================================= */}

      {showProjectModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-8">

          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm font-medium text-blue-400">
                  PROJECT SUBMISSION
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Submit Your Project
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Team:{" "}
                  <span className="font-medium text-white">
                    {team?.name}
                  </span>
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  if (
                    !projectSubmitting
                  ) {
                    setShowProjectModal(
                      false
                    );
                    setProjectError(
                      ""
                    );
                  }
                }}
                disabled={
                  projectSubmitting
                }
                className="text-2xl text-slate-400 hover:text-white disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* ERROR */}

            {projectError && (

              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                <p className="text-sm text-red-400">
                  {projectError}
                </p>

              </div>

            )}

            {/* FORM */}

            <form
              onSubmit={
                handleSubmitProject
              }
              className="mt-6 space-y-5"
            >

              {/* PROJECT NAME */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Project Name *
                </label>

                <input
                  type="text"
                  value={
                    projectForm.projectName
                  }
                  onChange={(e) =>
                    updateProjectField(
                      "projectName",
                      e.target.value
                    )
                  }
                  placeholder="e.g. FairJudge"
                  required
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* PROBLEM STATEMENT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Problem Statement *
                </label>

                <textarea
                  value={
                    projectForm.problemStatement
                  }
                  onChange={(e) =>
                    updateProjectField(
                      "problemStatement",
                      e.target.value
                    )
                  }
                  placeholder="What problem are you solving?"
                  required
                  rows={5}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* SOLUTION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Solution *
                </label>

                <textarea
                  value={
                    projectForm.solution
                  }
                  onChange={(e) =>
                    updateProjectField(
                      "solution",
                      e.target.value
                    )
                  }
                  placeholder="Explain your proposed solution."
                  required
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* TECHNOLOGY STACK */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Technology Stack *
                </label>

                <textarea
                  value={
                    projectForm.technologyStack
                  }
                  onChange={(e) =>
                    updateProjectField(
                      "technologyStack",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Next.js, React, Node.js, Express, MongoDB"
                  required
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* LINKS */}

              <div className="grid gap-5 md:grid-cols-2">

                {/* GITHUB */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    GitHub URL
                  </label>

                  <input
                    type="url"
                    value={
                      projectForm.githubUrl
                    }
                    onChange={(e) =>
                      updateProjectField(
                        "githubUrl",
                        e.target.value
                      )
                    }
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />

                </div>

                {/* DEMO */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Demo URL
                  </label>

                  <input
                    type="url"
                    value={
                      projectForm.demoUrl
                    }
                    onChange={(e) =>
                      updateProjectField(
                        "demoUrl",
                        e.target.value
                      )
                    }
                    placeholder="https://your-demo.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />

                </div>

              </div>

              {/* PRESENTATION */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Presentation URL
                </label>

                <input
                  type="url"
                  value={
                    projectForm.presentationUrl
                  }
                  onChange={(e) =>
                    updateProjectField(
                      "presentationUrl",
                      e.target.value
                    )
                  }
                  placeholder="Google Drive / OneDrive / presentation link"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* WARNING */}

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">

                <p className="text-sm font-medium text-yellow-400">
                  Before submitting
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Make sure all project information
                  is correct. Your backend currently
                  creates the project as SUBMITTED.
                  Once a project is locked by the
                  system, it should no longer be
                  editable.
                </p>

              </div>

              {/* ACTIONS */}

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !projectSubmitting
                    ) {
                      setShowProjectModal(
                        false
                      );
                      setProjectError(
                        ""
                      );
                    }
                  }}
                  disabled={
                    projectSubmitting
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    projectSubmitting
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {projectSubmitting
                    ? "Submitting..."
                    : "Submit Project"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}