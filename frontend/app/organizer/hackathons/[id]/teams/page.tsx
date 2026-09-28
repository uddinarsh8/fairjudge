"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";

import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ======================================================
// TYPES
// ======================================================

type TeamMember = {
  _id?: string;
  name: string;
  email: string;
  role?: string;
};

type Leader = {
  _id: string;
  name: string;
  email: string;
  role?: string;
};

type ReviewedBy = {
  _id: string;
  name: string;
  email: string;
  role?: string;
};

type Project = {
  _id: string;
  projectName: string;
  status?: "DRAFT" | "SUBMITTED" | "LOCKED";
  problemStatement?: string;
  solution?: string;
  technologyStack?: string;
  githubUrl?: string;
  demoUrl?: string;
  presentationUrl?: string;
  submittedAt?: string | null;
  lockedAt?: string | null;
};

type Team = {
  _id: string;
  name: string;

  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED";

  leader?: Leader;

  members?: TeamMember[];

  project?: Project | null;

  reviewedBy?: ReviewedBy | null;

  reviewedAt?: string | null;

  rejectionReason?: string;

  createdAt?: string;
};

type Hackathon = {
  _id: string;

  // IMPORTANT:
  // This is the public ID used by /teams/hackathon/:hackathonId
  hackathonId: string;

  name: string;

  description?: string;

  startDate?: string;

  endDate?: string;

  status?: string;

  isPublished?: boolean;
};

type HackathonResponse = {
  success: boolean;
  message?: string;
  hackathon?: Hackathon;
};

type TeamsResponse = {
  success: boolean;
  count?: number;
  teams?: Team[];
  message?: string;
};

type TeamResponse = {
  success: boolean;
  message?: string;
  team?: Team;
};

// ======================================================
// PAGE
// ======================================================

export default function TeamsPage() {
  const router = useRouter();

  const params = useParams();

  const { token, loading: authLoading } =
    useAuth();

  // ====================================================
  // ROUTE ID
  //
  // IMPORTANT:
  //
  // URL:
  // /organizer/hackathons/6ab4f82df60acf7294ef3c33/teams
  //
  // This is the MongoDB _id.
  //
  // We will convert it to:
  //
  // HACK-XXXXXX
  //
  // before calling /teams/hackathon/:hackathonId
  // ====================================================

  const routeHackathonId = Array.isArray(
    params.id
  )
    ? params.id[0]
    : params.id;

  // ====================================================
  // STATE
  // ====================================================

  const [hackathon, setHackathon] =
    useState<Hackathon | null>(null);

  const [teams, setTeams] =
    useState<Team[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [
    rejectingTeamId,
    setRejectingTeamId,
  ] = useState<string | null>(null);

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState("");

  // ====================================================
  // LOAD HACKATHON
  //
  // URL ID = MongoDB _id
  //
  // GET /api/hackathons/:id
  //
  // Response contains:
  //
  // {
  //   hackathon: {
  //      _id: "...",
  //      hackathonId: "HACK-XXXXXX"
  //   }
  // }
  // ====================================================

  const loadHackathon =
    useCallback(async () => {
      if (!token || !routeHackathonId) {
        return null;
      }

      const response =
        (await apiRequest(
          `/hackathons/${encodeURIComponent(
            routeHackathonId
          )}`,
          {
            method: "GET",
            token,
          }
        )) as HackathonResponse;

      if (!response?.hackathon) {
        throw new Error(
          response?.message ||
            "Hackathon not found"
        );
      }

      setHackathon(
        response.hackathon
      );

      return response.hackathon;
    }, [
      token,
      routeHackathonId,
    ]);

  // ====================================================
  // LOAD TEAMS
  //
  // IMPORTANT:
  //
  // The public team endpoint expects:
  //
  // HACK-XXXXXX
  //
  // NOT MongoDB _id.
  //
  // GET /api/teams/hackathon/:hackathonId
  // ====================================================

  const loadTeams = useCallback(
    async () => {
      if (!token || !routeHackathonId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        // ----------------------------------------------
        // STEP 1:
        // Get hackathon using MongoDB _id
        // ----------------------------------------------

        const currentHackathon =
          hackathon ||
          (await loadHackathon());

        if (
          !currentHackathon
            ?.hackathonId
        ) {
          throw new Error(
            "Hackathon public ID is missing."
          );
        }

        // ----------------------------------------------
        // STEP 2:
        // Use PUBLIC hackathonId
        // ----------------------------------------------

        const publicHackathonId =
          currentHackathon.hackathonId
            .trim()
            .toUpperCase();

        console.log(
          "Loading teams for public hackathon ID:",
          publicHackathonId
        );

        // ----------------------------------------------
        // STEP 3:
        // Load teams
        //
        // This endpoint expects PUBLIC ID
        // ----------------------------------------------

        const response =
          (await apiRequest(
            `/teams/hackathon/${encodeURIComponent(
              publicHackathonId
            )}`,
            {
              method: "GET",
              token,
            }
          )) as TeamsResponse;

        setTeams(
          Array.isArray(
            response?.teams
          )
            ? response.teams
            : []
        );
      } catch (err) {
        console.error(
          "Load teams error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load teams"
        );

        setTeams([]);
      } finally {
        setLoading(false);
      }
    },
    [
      token,
      routeHackathonId,
      hackathon,
      loadHackathon,
    ]
  );

  // ====================================================
  // INITIAL LOAD
  // ====================================================

  useEffect(() => {
    if (
      authLoading ||
      !token ||
      !routeHackathonId
    ) {
      return;
    }

    loadTeams();
  }, [
    authLoading,
    token,
    routeHackathonId,
    loadTeams,
  ]);

  // ====================================================
  // APPROVE TEAM
  //
  // PATCH /api/teams/:teamId/approve
  // ====================================================

  const approveTeam = async (
    teamId: string
  ) => {
    if (!token) {
      setError(
        "Authentication token not found."
      );
      return;
    }

    try {
      setActionLoading(teamId);
      setError("");

      const response =
        (await apiRequest(
          `/teams/${encodeURIComponent(
            teamId
          )}/approve`,
          {
            method: "PATCH",
            token,
          }
        )) as TeamResponse;

      console.log(
        "Approve response:",
        response
      );

      await loadTeams();
    } catch (err) {
      console.error(
        "Approve team error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve team"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ====================================================
  // OPEN REJECT FORM
  // ====================================================

  const openRejectForm = (
    teamId: string
  ) => {
    setRejectingTeamId(teamId);
    setRejectionReason("");
    setError("");
  };

  // ====================================================
  // CANCEL REJECT
  // ====================================================

  const cancelReject = () => {
    setRejectingTeamId(null);
    setRejectionReason("");
  };

  // ====================================================
  // REJECT TEAM
  //
  // PATCH /api/teams/:teamId/reject
  // ====================================================

  const rejectTeam = async (
    teamId: string
  ) => {
    if (!token) {
      setError(
        "Authentication token not found."
      );
      return;
    }

    const reason =
      rejectionReason.trim();

    if (!reason) {
      setError(
        "Please enter a rejection reason."
      );
      return;
    }

    if (reason.length > 1000) {
      setError(
        "Rejection reason cannot exceed 1000 characters."
      );
      return;
    }

    try {
      setActionLoading(teamId);
      setError("");

      const response =
        (await apiRequest(
          `/teams/${encodeURIComponent(
            teamId
          )}/reject`,
          {
            method: "PATCH",
            body: {
              reason,
            },
            token,
          }
        )) as TeamResponse;

      console.log(
        "Reject response:",
        response
      );

      setRejectingTeamId(null);
      setRejectionReason("");

      await loadTeams();
    } catch (err) {
      console.error(
        "Reject team error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to reject team"
      );
    } finally {
      setActionLoading(null);
    }
  };

  // ====================================================
  // STATUS STYLE
  // ====================================================

  const getStatusStyle = (
    status: Team["status"]
  ) => {
    switch (status) {
      case "APPROVED":
        return "border-green-500/30 bg-green-500/10 text-green-400";

      case "REJECTED":
        return "border-red-500/30 bg-red-500/10 text-red-400";

      default:
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }
  };

  // ====================================================
  // PROJECT STATUS STYLE
  // ====================================================

  const getProjectStatusStyle = (
    status?: Project["status"]
  ) => {
    switch (status) {
      case "LOCKED":
        return "bg-purple-500/10 text-purple-400";

      case "SUBMITTED":
        return "bg-blue-500/10 text-blue-400";

      default:
        return "bg-yellow-500/10 text-yellow-400";
    }
  };

  // ====================================================
  // COUNTS
  // ====================================================

  const pendingCount =
    teams.filter(
      (team) =>
        team.status === "PENDING"
    ).length;

  const approvedCount =
    teams.filter(
      (team) =>
        team.status === "APPROVED"
    ).length;

  const rejectedCount =
    teams.filter(
      (team) =>
        team.status === "REJECTED"
    ).length;

  // ====================================================
  // LOADING
  // ====================================================

  if (
    authLoading ||
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p>
            Loading teams...
          </p>
        </div>
      </main>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            BACK
        ================================================== */}

        <button
          onClick={() =>
            router.push(
              `/organizer/hackathons/${routeHackathonId}`
            )
          }
          className="mb-6 text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to Hackathon
        </button>

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">

          <div>
            <p className="text-sm font-semibold tracking-wider text-blue-400">
              TEAM MANAGEMENT
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Teams
            </h1>

            <p className="mt-2 max-w-2xl text-slate-400">
              Review team registration
              requests, approve or reject
              teams, and inspect their
              submitted projects.
            </p>

            {/* MongoDB ID */}

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-md bg-slate-900 px-3 py-1.5 text-slate-500">
                Mongo ID:
              </span>

              <span className="rounded-md bg-slate-900 px-3 py-1.5 font-mono text-slate-400">
                {routeHackathonId}
              </span>
            </div>

            {/* Public ID */}

            {hackathon?.hackathonId && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-blue-500/10 px-3 py-1.5 text-blue-400">
                  Public ID:
                </span>

                <span className="rounded-md bg-blue-500/10 px-3 py-1.5 font-mono text-blue-300">
                  {
                    hackathon.hackathonId
                  }
                </span>
              </div>
            )}
          </div>

          <button
            onClick={loadTeams}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-medium transition hover:bg-slate-800 disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">

            <div>
              <p className="font-semibold">
                Error
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>

            <button
              onClick={() =>
                setError("")
              }
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <TeamStat
            title="Total Teams"
            value={teams.length}
            description="All registered teams"
          />

          <TeamStat
            title="Pending"
            value={pendingCount}
            description="Awaiting approval"
          />

          <TeamStat
            title="Approved"
            value={approvedCount}
            description="Approved teams"
          />

          <TeamStat
            title="Rejected"
            value={rejectedCount}
            description="Rejected requests"
          />

        </div>

        {/* ==================================================
            EMPTY
        ================================================== */}

        {teams.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">

            <div className="text-5xl">
              👥
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No teams registered yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Teams that register for this
              hackathon will appear here.
            </p>

            <button
              onClick={loadTeams}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
            >
              Refresh Teams
            </button>

          </div>

        ) : (

          <div className="space-y-5">

            {teams.map(
              (team) => (

                <div
                  key={team._id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >

                  {/* ========================================
                      TEAM HEADER
                  ======================================== */}

                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">

                    <div className="flex items-start gap-4">

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                        👥
                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-3">

                          <h2 className="text-xl font-semibold">
                            {team.name}
                          </h2>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusStyle(
                              team.status
                            )}`}
                          >
                            {team.status}
                          </span>

                        </div>

                        <p className="mt-2 text-sm text-slate-500">
                          Team ID:{" "}
                          {team._id}
                        </p>

                        {team.createdAt && (
                          <p className="mt-1 text-xs text-slate-600">
                            Registered on{" "}
                            {new Date(
                              team.createdAt
                            ).toLocaleString()}
                          </p>
                        )}

                      </div>
                    </div>

                    {/* ======================================
                        ACTIONS
                    ====================================== */}

                    {team.status ===
                      "PENDING" && (

                      <div className="flex flex-wrap gap-3">

                        <button
                          disabled={
                            actionLoading ===
                            team._id
                          }
                          onClick={() =>
                            approveTeam(
                              team._id
                            )
                          }
                          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ===
                          team._id
                            ? "Processing..."
                            : "✓ Approve"}
                        </button>

                        <button
                          disabled={
                            actionLoading ===
                            team._id
                          }
                          onClick={() =>
                            openRejectForm(
                              team._id
                            )
                          }
                          className="rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>

                      </div>
                    )}

                  </div>

                  {/* ========================================
                      REJECTION FORM
                  ======================================== */}

                  {rejectingTeamId ===
                    team._id && (

                    <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-5">

                      <h3 className="font-semibold text-red-400">
                        Reject Team
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        Enter the reason that
                        should be saved with
                        this rejection.
                      </p>

                      <textarea
                        value={
                          rejectionReason
                        }
                        onChange={(e) =>
                          setRejectionReason(
                            e.target.value
                          )
                        }
                        maxLength={1000}
                        placeholder="Example: Team does not meet the hackathon eligibility requirements."
                        rows={4}
                        className="mt-4 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-500"
                      />

                      <div className="mt-2 text-right text-xs text-slate-600">
                        {
                          rejectionReason.length
                        }
                        /1000
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">

                        <button
                          disabled={
                            actionLoading ===
                            team._id
                          }
                          onClick={() =>
                            rejectTeam(
                              team._id
                            )
                          }
                          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {actionLoading ===
                          team._id
                            ? "Rejecting..."
                            : "Confirm Rejection"}
                        </button>

                        <button
                          disabled={
                            actionLoading ===
                            team._id
                          }
                          onClick={
                            cancelReject
                          }
                          className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          Cancel
                        </button>

                      </div>
                    </div>
                  )}

                  {/* ========================================
                      TEAM INFORMATION
                  ======================================== */}

                  <div className="mt-6 grid gap-5 lg:grid-cols-3">

                    {/* ======================================
                        LEADER
                    ====================================== */}

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Team Leader
                      </p>

                      {team.leader ? (

                        <div className="mt-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 font-semibold text-blue-400">
                              {team.leader.name
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>

                            <div className="min-w-0">

                              <p className="truncate font-semibold">
                                {
                                  team
                                    .leader
                                    .name
                                }
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-500">
                                {
                                  team
                                    .leader
                                    .email
                                }
                              </p>

                            </div>

                          </div>

                          {team.leader
                            .role && (
                            <p className="mt-3 text-xs text-blue-400">
                              {
                                team
                                  .leader
                                  .role
                              }
                            </p>
                          )}

                        </div>

                      ) : (

                        <p className="mt-4 text-sm text-slate-500">
                          Leader information
                          unavailable.
                        </p>

                      )}

                    </div>

                    {/* ======================================
                        MEMBERS
                    ====================================== */}

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                      <div className="flex items-center justify-between">

                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Team Members
                        </p>

                        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                          {team.members
                            ?.length || 0}
                        </span>

                      </div>

                      {team.members &&
                      team.members.length >
                        0 ? (

                        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">

                          {team.members.map(
                            (
                              member,
                              index
                            ) => (

                              <div
                                key={
                                  member._id ||
                                  `${member.email}-${index}`
                                }
                                className="flex items-center gap-3"
                              >

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold">
                                  {member.name
                                    ?.charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0">

                                  <p className="truncate text-sm font-medium">
                                    {
                                      member.name
                                    }
                                  </p>

                                  <p className="truncate text-xs text-slate-500">
                                    {
                                      member.email
                                    }
                                  </p>

                                  {member.role && (
                                    <p className="text-xs text-blue-400">
                                      {
                                        member.role
                                      }
                                    </p>
                                  )}

                                </div>

                              </div>

                            )
                          )}

                        </div>

                      ) : (

                        <p className="mt-4 text-sm text-slate-500">
                          No member
                          information
                          available.
                        </p>

                      )}

                    </div>

                    {/* ======================================
                        PROJECT
                    ====================================== */}

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                      <div className="flex items-center justify-between">

                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Project
                        </p>

                        {team.project && (
                          <span className="text-xs text-slate-600">
                            Submitted
                          </span>
                        )}

                      </div>

                      {team.project ? (

                        <div className="mt-4">

                          <p className="font-semibold">
                            {
                              team
                                .project
                                .projectName
                            }
                          </p>

                          {team.project
                            .status && (

                            <span
                              className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs ${getProjectStatusStyle(
                                team
                                  .project
                                  .status
                              )}`}
                            >
                              {
                                team
                                  .project
                                  .status
                              }
                            </span>
                          )}

                          {team.project
                            .problemStatement && (

                            <div className="mt-4">

                              <p className="text-xs uppercase tracking-wide text-slate-600">
                                Problem
                              </p>

                              <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-400">
                                {
                                  team
                                    .project
                                    .problemStatement
                                }
                              </p>

                            </div>
                          )}

                          {team.project
                            .solution && (

                            <div className="mt-4">

                              <p className="text-xs uppercase tracking-wide text-slate-600">
                                Solution
                              </p>

                              <p className="mt-1 line-clamp-3 text-sm leading-6 text-slate-400">
                                {
                                  team
                                    .project
                                    .solution
                                }
                              </p>

                            </div>
                          )}

                          {team.project
                            .technologyStack && (

                            <div className="mt-4">

                              <p className="text-xs uppercase tracking-wide text-slate-600">
                                Technology
                              </p>

                              <p className="mt-1 text-sm text-slate-400">
                                {
                                  team
                                    .project
                                    .technologyStack
                                }
                              </p>

                            </div>
                          )}

                          {/* PROJECT LINKS */}

                          <div className="mt-4 flex flex-wrap gap-2">

                            {team.project
                              .githubUrl && (
                              <a
                                href={
                                  team
                                    .project
                                    .githubUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
                              >
                                GitHub ↗
                              </a>
                            )}

                            {team.project
                              .demoUrl && (
                              <a
                                href={
                                  team
                                    .project
                                    .demoUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
                              >
                                Demo ↗
                              </a>
                            )}

                            {team.project
                              .presentationUrl && (
                              <a
                                href={
                                  team
                                    .project
                                    .presentationUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800"
                              >
                                Presentation ↗
                              </a>
                            )}

                          </div>

                        </div>

                      ) : (

                        <p className="mt-4 text-sm text-slate-500">
                          No project
                          submitted yet.
                        </p>

                      )}

                    </div>

                  </div>

                  {/* ========================================
                      REJECTION INFORMATION
                  ======================================== */}

                  {team.status ===
                    "REJECTED" &&
                    team.rejectionReason && (

                    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-5">

                      <p className="text-xs uppercase tracking-wide text-red-400">
                        Rejection Reason
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {
                          team.rejectionReason
                        }
                      </p>

                      {team.reviewedBy && (
                        <p className="mt-3 text-xs text-slate-600">
                          Rejected by{" "}
                          {
                            team
                              .reviewedBy
                              .name
                          }
                        </p>
                      )}

                      {team.reviewedAt && (
                        <p className="mt-1 text-xs text-slate-600">
                          Reviewed on{" "}
                          {new Date(
                            team.reviewedAt
                          ).toLocaleString()}
                        </p>
                      )}

                    </div>
                  )}

                  {/* ========================================
                      APPROVAL INFORMATION
                  ======================================== */}

                  {team.status ===
                    "APPROVED" &&
                    team.reviewedAt && (

                    <div className="mt-5 rounded-xl border border-green-500/20 bg-green-500/5 p-4">

                      <p className="text-sm text-green-400">
                        ✓ Team approved
                      </p>

                      {team.reviewedBy && (
                        <p className="mt-1 text-xs text-slate-500">
                          Approved by{" "}
                          {
                            team
                              .reviewedBy
                              .name
                          }
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-500">
                        Approved on{" "}
                        {new Date(
                          team.reviewedAt
                        ).toLocaleString()}
                      </p>

                    </div>
                  )}

                </div>
              )
            )}

          </div>
        )}

      </div>
    </main>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function TeamStat({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}