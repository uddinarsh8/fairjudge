"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Search, Star, StickyNote, UserRound, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ======================================================
// TYPES
// ======================================================

type AssignmentProject = {
  _id: string;
  projectName: string;
  problemStatement?: string;
  solution?: string;
  technologyStack?: string;
  githubUrl?: string;
  demoUrl?: string;
  presentationUrl?: string;
  status?: string;
};

type AssignmentTeam = {
  _id: string;
  name: string;
};

type AssignmentRound = {
  _id: string;
  name: string;
  roundNumber: number;
  status?: string;
};

type AssignmentHackathon = {
  _id: string;
  name: string;
  status?: string;
};

type Assignment = {
  _id: string;
  status?: string;

  team?: AssignmentTeam | null;

  // IMPORTANT:
  // Project can now be null because a judge can be
  // assigned before the team submits a project.
  project?: AssignmentProject | null;

  round?: AssignmentRound | null;

  hackathon?: AssignmentHackathon | null;
};

// ======================================================
// PAGE
// ======================================================

export default function JudgeDashboard() {
  const router = useRouter();

  const {
    token,
    user,
    loading: authLoading,
    logout,
  } = useAuth();

  // ====================================================
  // STATE
  // ====================================================

  const [assignments, setAssignments] =
    useState<Assignment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showNotepad, setShowNotepad] = useState(false);
  const [judgeWorkspace, setJudgeWorkspace] = useState<{
    ownerId: string | null;
    notes: Record<string, string>;
    highlightedTeams: Record<string, boolean>;
    generalNote: string;
  }>({ ownerId: null, notes: {}, highlightedTeams: {}, generalNote: "" });

  useEffect(() => {
    if (authLoading) return;
    if (!user || !token || String(user.role).toUpperCase() !== "JUDGE") {
      router.replace("/login");
    }
  }, [authLoading, user, token, router]);

  useEffect(() => {
    if (!user?.id) return;

    const storageKey = `fairjudge_judge_workspace_${user.id}`;
    try {
      const storedValue = localStorage.getItem(storageKey);
      const parsed = storedValue ? JSON.parse(storedValue) : {};
      setJudgeWorkspace({
        ownerId: user.id,
        notes: parsed?.notes && typeof parsed.notes === "object" ? parsed.notes : {},
        highlightedTeams: parsed?.highlightedTeams && typeof parsed.highlightedTeams === "object"
          ? parsed.highlightedTeams
          : {},
        generalNote: typeof parsed?.generalNote === "string" ? parsed.generalNote : "",
      });
    } catch {
      setJudgeWorkspace({ ownerId: user.id, notes: {}, highlightedTeams: {}, generalNote: "" });
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || judgeWorkspace.ownerId !== user.id) return;

    try {
      localStorage.setItem(
        `fairjudge_judge_workspace_${user.id}`,
        JSON.stringify({
          notes: judgeWorkspace.notes,
          highlightedTeams: judgeWorkspace.highlightedTeams,
          generalNote: judgeWorkspace.generalNote,
        })
      );
    } catch {
      // Keep the dashboard usable if browser storage is unavailable.
    }
  }, [judgeWorkspace, user?.id]);

  // ====================================================
  // LOAD ASSIGNMENTS
  // ====================================================

  useEffect(() => {
    const loadAssignments = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        console.log(
          "Loading judge assignments..."
        );

        const response =
          await apiRequest(
            "/assignments/judge/my",
            {
              method: "GET",
              token,
            }
          );

        console.log(
          "Judge assignments response:",
          response
        );

        const fetchedAssignments =
          Array.isArray(
            response?.assignments
          )
            ? response.assignments
            : [];

        setAssignments(
          fetchedAssignments
        );
      } catch (error) {
        console.error(
          "Load judge assignments error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load your assignments"
        );

        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [token]);

  // ====================================================
  // ASSIGNMENT STATUS
  // ====================================================

  const getAssignmentStatus = (
    assignment: Assignment
  ) => {
    if (["EVALUATED", "COMPLETED"].includes(
      String(assignment.status || "").toUpperCase()
    )) {
      return "EVALUATED";
    }

    return "PENDING";
  };

  const teamsAssigned = useMemo(() => {
    return new Set(
      assignments
        .map((assignment) => assignment.team?._id)
        .filter((teamId): teamId is string => Boolean(teamId))
    ).size;
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return assignments;

    return assignments.filter((assignment) => [
      assignment.team?.name,
      assignment.project?.projectName,
      assignment.hackathon?.name,
      assignment.round?.name,
    ].some((value) => value?.toLowerCase().includes(query)));
  }, [assignments, searchQuery]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // ====================================================
  // EVALUATION HANDLER
  // ====================================================

  const handleEvaluate = (
    assignment: Assignment
  ) => {
    // --------------------------------------------------
    // NO PROJECT YET
    // --------------------------------------------------

    if (!assignment.project) {
      return;
    }

    router.push(
      `/judge/evaluations/${assignment._id}`
    );
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm font-medium text-blue-400">JUDGE PANEL</p>
            <h1 className="mt-1 text-3xl font-bold">My Assignments</h1>
            <p className="mt-2 text-slate-400">
              Review the projects assigned to you and submit your evaluations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNotepad(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 transition hover:border-blue-500/50 hover:bg-slate-800"
            >
              <StickyNote size={16} /> Notepad
            </button>
            <button
              type="button"
              onClick={() => setShowProfile(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200 transition hover:border-blue-500/50 hover:bg-slate-800"
            >
              <UserRound size={16} /> Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/10"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mb-6 max-w-xs rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <p className="text-sm text-slate-400">Teams Assigned</p>
          <p className="mt-2 text-3xl font-bold text-blue-300">{teamsAssigned}</p>
        </div>

        <div className="mb-6">
          <label htmlFor="judge-team-search" className="sr-only">Search assigned teams</label>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              id="judge-team-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search assigned teams, projects, hackathons, or rounds..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          {!loading && assignments.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </p>
          )}
        </div>

        {/* ==================================================
            LOADING
        ================================================== */}

        {loading ? (

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">

            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

            Loading assignments...

          </div>

        ) : assignments.length === 0 ? (

          /* ==================================================
             EMPTY STATE
          ================================================== */

          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">

            <div className="text-4xl">
              ⚖️
            </div>

            <h2 className="mt-4 text-xl font-semibold">
              No assignments yet
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
              You don't currently have any teams
              assigned to you for evaluation.
            </p>

          </div>

        ) : (

          <>
            {/* ==================================================
                STATS
            ================================================== */}

            <div className="mb-8 grid gap-5 md:grid-cols-3">

              {/* TOTAL */}

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

                <p className="text-sm text-slate-400">
                  Total Assignments
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {assignments.length}
                </p>

              </div>

              {/* PENDING */}

              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">

                <p className="text-sm text-slate-400">
                  Pending
                </p>

                <p className="mt-2 text-3xl font-bold text-yellow-400">
                  {
                    assignments.filter(
                      (
                        assignment
                      ) =>
                        getAssignmentStatus(
                          assignment
                        ) ===
                        "PENDING"
                    ).length
                  }
                </p>

              </div>

              {/* EVALUATED */}

              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">

                <p className="text-sm text-slate-400">
                  Evaluated
                </p>

                <p className="mt-2 text-3xl font-bold text-green-400">
                  {
                    assignments.filter(
                      (
                        assignment
                      ) =>
                        getAssignmentStatus(
                          assignment
                        ) ===
                        "EVALUATED"
                    ).length
                  }
                </p>

              </div>

            </div>

            {/* ==================================================
                ASSIGNMENT LIST
            ================================================== */}

            <div className="space-y-5">

              {filteredAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-10 text-center text-slate-400">
                  No assigned teams, projects, hackathons, or rounds match “{searchQuery}”.
                </div>
              ) : filteredAssignments.map(
                (assignment) => {

                  const status =
                    getAssignmentStatus(
                      assignment
                    );

                  const hasProject =
                    Boolean(
                      assignment.project
                    );

                  const teamKey = assignment.team?._id || assignment._id;
                  const isHighlighted = Boolean(
                    judgeWorkspace.highlightedTeams[teamKey]
                  );

                  return (
                    <div
                      key={
                        assignment._id
                      }
                      className={`rounded-2xl border p-6 transition ${
                        isHighlighted
                          ? "border-amber-400/50 bg-amber-400/[0.06]"
                          : "border-slate-800 bg-slate-900"
                      }`}
                    >

                      {/* ==================================================
                          TOP
                      ================================================== */}

                      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

                        {/* LEFT */}

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-3">

                            {/* PROJECT NAME OR WAITING */}

                            <h2 className="text-xl font-semibold">

                              {hasProject
                                ? assignment
                                    .project
                                    ?.projectName
                                : "Project not submitted yet"}

                            </h2>

                            {/* STATUS */}

                            {hasProject ? (

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  status ===
                                  "EVALUATED"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-yellow-500/10 text-yellow-400"
                                }`}
                              >
                                {status ===
                                "EVALUATED"
                                  ? "🔒 Evaluated"
                                  : "Pending"}
                              </span>

                            ) : (

                              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                                Waiting for Project
                              </span>

                            )}

                          </div>

                          {/* TEAM */}

                          <p className="mt-2 text-sm text-slate-400">

                            Team:{" "}

                            <span className="font-medium text-white">
                              {
                                assignment
                                  .team
                                  ?.name ||
                                "Unknown Team"
                              }
                            </span>

                          </p>

                        </div>

                        {/* ==================================================
                            ACTION BUTTON
                        ================================================== */}

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            aria-pressed={isHighlighted}
                            onClick={() => setJudgeWorkspace((previous) => ({
                              ...previous,
                              highlightedTeams: {
                                ...previous.highlightedTeams,
                                [teamKey]: !previous.highlightedTeams[teamKey],
                              },
                            }))}
                            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                              isHighlighted
                                ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                                : "border-slate-700 bg-slate-800 text-slate-300 hover:border-amber-400/40 hover:text-amber-300"
                            }`}
                          >
                            <Star size={16} fill={isHighlighted ? "currentColor" : "none"} />
                            {isHighlighted ? "Highlighted" : "Highlight team"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEvaluate(assignment)}
                            disabled={!hasProject}
                            className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${
                              !hasProject
                                ? "cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500"
                                : status === "EVALUATED"
                                  ? "border border-slate-700 bg-slate-800 hover:bg-slate-700"
                                  : "bg-blue-600 hover:bg-blue-500"
                            }`}
                          >
                            {!hasProject
                              ? "Waiting for Project"
                              : status === "EVALUATED"
                                ? "View Evaluation"
                                : "Evaluate Project"}
                          </button>
                        </div>

                      </div>

                      {/* ==================================================
                          INFORMATION
                      ================================================== */}

                      <div className="mt-6 grid gap-4 md:grid-cols-3">

                        {/* ==================================================
                            HACKATHON
                        ================================================== */}

                        <div className="rounded-xl bg-slate-800/50 p-4">

                          <p className="text-xs font-medium text-slate-500">
                            HACKATHON
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {
                              assignment
                                .hackathon
                                ?.name ||
                              "Unknown Hackathon"
                            }
                          </p>

                        </div>

                        {/* ==================================================
                            ROUND
                        ================================================== */}

                        <div className="rounded-xl bg-slate-800/50 p-4">

                          <p className="text-xs font-medium text-slate-500">
                            ROUND
                          </p>

                          <p className="mt-1 text-sm font-medium">

                            {assignment
                              .round
                              ? `Round ${assignment.round.roundNumber} — ${assignment.round.name}`
                              : "Unknown Round"}

                          </p>

                        </div>

                        {/* ==================================================
                            PROJECT STATUS
                        ================================================== */}

                        <div className="rounded-xl bg-slate-800/50 p-4">

                          <p className="text-xs font-medium text-slate-500">
                            PROJECT
                          </p>

                          <p
                            className={`mt-1 text-sm font-medium ${
                              hasProject
                                ? "text-green-400"
                                : "text-yellow-400"
                            }`}
                          >

                            {hasProject
                              ? "Submitted"
                              : "Not submitted"}

                          </p>

                        </div>

                      </div>

                      {/* ==================================================
                          PROJECT DETAILS
                      ================================================== */}

                      {hasProject ? (

                        <>
                          {/* TECHNOLOGY */}

                          <div className="mt-5 border-t border-slate-800 pt-5">

                            <p className="text-xs font-medium text-slate-500">
                              TECHNOLOGY
                            </p>

                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                              {
                                assignment
                                  .project
                                  ?.technologyStack ||
                                "Not provided"
                              }
                            </p>

                          </div>

                          {/* PROJECT OVERVIEW */}

                          <div className="mt-5">

                            <p className="text-xs font-medium text-slate-500">
                              PROJECT OVERVIEW
                            </p>

                            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
                              {
                                assignment
                                  .project
                                  ?.problemStatement ||
                                "No project description available."
                              }
                            </p>

                          </div>

                        </>

                      ) : (

                        /* ==================================================
                           NO PROJECT MESSAGE
                        ================================================== */

                        <div className="mt-5 border-t border-slate-800 pt-5">

                          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">

                            <p className="text-sm font-medium text-yellow-400">
                              Project not submitted yet
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              You have been assigned to this
                              team. The team can submit its
                              project later. Once the project is
                              submitted, it will become available
                              here for evaluation.
                            </p>

                          </div>

                        </div>

                      )}

                      <div className="mt-6 border-t border-slate-800 pt-5">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <label htmlFor={`judge-note-${teamKey}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-200">
                            <StickyNote size={16} className="text-blue-300" /> Private team notes
                          </label>
                          <span className="text-xs text-slate-500">Only visible to you</span>
                        </div>
                        <textarea
                          id={`judge-note-${teamKey}`}
                          value={judgeWorkspace.notes[teamKey] || ""}
                          onChange={(event) => setJudgeWorkspace((previous) => ({
                            ...previous,
                            notes: {
                              ...previous.notes,
                              [teamKey]: event.target.value,
                            },
                          }))}
                          maxLength={2000}
                          rows={3}
                          placeholder="Add a private reminder or observation about this team..."
                          className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                        />
                        <p className="mt-2 text-right text-xs text-slate-600">
                          Saved in this browser · {(judgeWorkspace.notes[teamKey] || "").length}/2000
                        </p>
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          </>
        )}

      </div>

      {showNotepad && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowNotepad(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="judge-notepad-title"
            className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-400">
                  <StickyNote size={15} /> Private workspace
                </p>
                <h2 id="judge-notepad-title" className="mt-2 text-xl font-bold">My Notepad</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Keep general reminders and observations here while reviewing teams.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close notepad"
                onClick={() => setShowNotepad(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              autoFocus
              value={judgeWorkspace.generalNote}
              onChange={(event) => setJudgeWorkspace((previous) => ({
                ...previous,
                generalNote: event.target.value,
              }))}
              maxLength={10000}
              rows={12}
              placeholder="Write your private notes here..."
              className="mt-6 w-full resize-y rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>Saved automatically in this browser for your judge account.</span>
              <span>{judgeWorkspace.generalNote.length}/10000</span>
            </div>
          </section>
        </div>
      )}

      {showProfile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowProfile(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="judge-profile-title"
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">Judge account</p>
                <h2 id="judge-profile-title" className="mt-2 text-xl font-bold">Profile</h2>
              </div>
              <button
                type="button"
                aria-label="Close profile"
                onClick={() => setShowProfile(false)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <ProfileField label="Name" value={user?.name || "Judge"} />
              <ProfileField label="Login email" value={user?.email || "—"} />
              <ProfileField label="Role" value="Judge" />
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Your private notes and team highlights are saved in this browser under your judge account.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 break-all text-sm font-medium text-slate-100">{value}</p>
    </div>
  );
}
