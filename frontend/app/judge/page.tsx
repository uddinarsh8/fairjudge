"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    if (
      String(
        assignment.status || ""
      ).toUpperCase() ===
      "EVALUATED"
    ) {
      return "EVALUATED";
    }

    return "PENDING";
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
      `/judge/evaluation/${assignment._id}`
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

        <div className="mb-8">

          <p className="text-sm font-medium text-blue-400">
            JUDGE PANEL
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            My Assignments
          </h1>

          <p className="mt-2 text-slate-400">
            Review the projects assigned to you and
            submit your evaluations.
          </p>

        </div>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

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

              {assignments.map(
                (assignment) => {

                  const status =
                    getAssignmentStatus(
                      assignment
                    );

                  const hasProject =
                    Boolean(
                      assignment.project
                    );

                  return (
                    <div
                      key={
                        assignment._id
                      }
                      className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
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

                        <button
                          type="button"
                          onClick={() =>
                            handleEvaluate(
                              assignment
                            )
                          }
                          disabled={
                            !hasProject
                          }
                          className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${
                            !hasProject
                              ? "cursor-not-allowed border border-slate-700 bg-slate-800 text-slate-500"
                              : status ===
                                "EVALUATED"
                              ? "border border-slate-700 bg-slate-800 hover:bg-slate-700"
                              : "bg-blue-600 hover:bg-blue-500"
                          }`}
                        >

                          {!hasProject
                            ? "Waiting for Project"
                            : status ===
                              "EVALUATED"
                            ? "View Evaluation"
                            : "Evaluate Project"}

                        </button>

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

                    </div>
                  );
                }
              )}

            </div>
          </>
        )}

      </div>
    </main>
  );
}