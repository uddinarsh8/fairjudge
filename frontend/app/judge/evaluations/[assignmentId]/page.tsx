"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type ScoringLevel = {
  name: string;
  score: number;
  description: string;
};

type Criterion = {
  _id: string;
  name: string;
  description: string;
  weight: number;
  scoringLevels: ScoringLevel[];
};

type ScoreInput = {
  criterionId: string;
  score: number | "";
  feedback: string;
};

type Assignment = {
  _id: string;

  team: {
    _id: string;
    name: string;
  };

  project: {
    _id: string;
    projectName: string;
    problemStatement?: string;
    solution?: string;
    technologyStack?: string;
    githubUrl?: string;
    demoUrl?: string;
    presentationUrl?: string;
  };

  round: {
    _id: string;
    name: string;
    roundNumber: number;
    status: string;
  };

  hackathon: {
    _id: string;
    name: string;
    status: string;
  };
};

export default function JudgeEvaluationPage() {
  const params = useParams();
  const router = useRouter();

  const { token } = useAuth();

  const assignmentId =
    params.assignmentId as string;

  const [assignment, setAssignment] =
    useState<Assignment | null>(null);

  const [criteria, setCriteria] =
    useState<Criterion[]>([]);

  const [scores, setScores] =
    useState<ScoreInput[]>([]);

  const [overallFeedback, setOverallFeedback] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [submitted, setSubmitted] =
    useState(false);

  // ==========================================
  // LOAD EVALUATION DATA
  // ==========================================

  useEffect(() => {
    const loadEvaluationData = async () => {
      if (!token || !assignmentId) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await apiRequest(
            `/evaluations/${assignmentId}/data`,
            {
              token,
            }
          );

        setAssignment(
          response.assignment
        );

        setCriteria(
          response.criteria || []
        );

        // --------------------------------------
        // Check if already submitted
        // --------------------------------------

        if (
          response.evaluation &&
          response.evaluation.status ===
            "SUBMITTED"
        ) {
          setSubmitted(true);

          setOverallFeedback(
            response.evaluation
              .overallFeedback || ""
          );

          setScores(
            response.evaluation.scores.map(
              (item: {
                criterion: string;
                score: number;
                feedback: string;
              }) => ({
                criterionId:
                  typeof item.criterion ===
                  "string"
                    ? item.criterion
                    : item.criterion._id,
                score: item.score,
                feedback:
                  item.feedback || "",
              })
            )
          );
        } else {
          // ------------------------------------
          // Initialize empty scores
          // ------------------------------------

          setScores(
            (response.criteria || []).map(
              (criterion: Criterion) => ({
                criterionId:
                  criterion._id,
                score: "",
                feedback: "",
              })
            )
          );
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load evaluation"
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvaluationData();
  }, [token, assignmentId]);

  // ==========================================
  // UPDATE SCORE
  // ==========================================

  const updateScore = (
    criterionId: string,
    score: number
  ) => {
    if (submitted) return;

    setScores((previous) =>
      previous.map((item) =>
        item.criterionId === criterionId
          ? {
              ...item,
              score,
            }
          : item
      )
    );
  };

  // ==========================================
  // UPDATE FEEDBACK
  // ==========================================

  const updateFeedback = (
    criterionId: string,
    feedback: string
  ) => {
    if (submitted) return;

    setScores((previous) =>
      previous.map((item) =>
        item.criterionId === criterionId
          ? {
              ...item,
              feedback,
            }
          : item
      )
    );
  };

  // ==========================================
  // CALCULATE PREVIEW SCORE
  // ==========================================

  const calculateTotal = () => {
    let total = 0;

    for (const criterion of criteria) {
      const selectedScore =
        scores.find(
          (item) =>
            item.criterionId ===
            criterion._id
        );

      if (
        !selectedScore ||
        selectedScore.score === ""
      ) {
        continue;
      }

      const maxScore =
        Math.max(
          ...criterion.scoringLevels.map(
            (level) =>
              Number(level.score)
          )
        );

      total +=
        (Number(selectedScore.score) /
          maxScore) *
        Number(criterion.weight);
    }

    return total.toFixed(2);
  };

  // ==========================================
  // SUBMIT EVALUATION
  // ==========================================

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (submitted) {
      return;
    }

    // ------------------------------------------
    // Ensure every criterion has a score
    // ------------------------------------------

    const incompleteScore =
      scores.find(
        (item) => item.score === ""
      );

    if (incompleteScore) {
      setError(
        "Please provide a score for every evaluation criterion"
      );

      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response =
        await apiRequest(
          `/evaluations/${assignmentId}`,
          {
            method: "POST",
            token,

            body: {
              scores: scores.map(
                (item) => ({
                  criterionId:
                    item.criterionId,
                  score:
                    Number(item.score),
                  feedback:
                    item.feedback,
                })
              ),

              overallFeedback,
            },
          }
        );

      setSubmitted(true);

      setSuccess(
        response.message ||
          "Evaluation submitted successfully"
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit evaluation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading evaluation...
      </main>
    );
  }

  // ==========================================
  // ERROR WITHOUT ASSIGNMENT
  // ==========================================

  if (!assignment) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md text-center">

          <h1 className="text-xl font-semibold">
            Unable to load evaluation
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            {error ||
              "The assignment could not be found."}
          </p>

          <button
            onClick={() =>
              router.push("/judge")
            }
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
          >
            Back to Dashboard
          </button>

        </div>
      </main>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        {/* BACK */}

        <button
          onClick={() =>
            router.back()
          }
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back
        </button>

        {/* HEADER */}

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-start">

          <div>
            <p className="text-sm text-blue-400">
              Round {assignment.round.roundNumber}
              : {assignment.round.name}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Evaluate Project
            </h1>

            <p className="mt-2 text-slate-400">
              {assignment.hackathon.name}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4 text-right">

            <p className="text-xs text-slate-500">
              Current Score
            </p>

            <p className="mt-1 text-3xl font-bold text-blue-400">
              {calculateTotal()}%
            </p>

          </div>

        </div>

        {/* SUCCESS */}

        {success && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* SUBMITTED STATUS */}

        {submitted && (
          <div className="mb-8 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-300">
            This evaluation has already been submitted and can no longer be modified.
          </div>
        )}

        {/* PROJECT DETAILS */}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-xl font-semibold">
            Project Details
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <InfoItem
              label="Team"
              value={assignment.team.name}
            />

            <InfoItem
              label="Project"
              value={
                assignment.project.projectName
              }
            />

          </div>

          {assignment.project.problemStatement && (
            <ProjectSection
              title="Problem Statement"
              content={
                assignment.project
                  .problemStatement
              }
            />
          )}

          {assignment.project.solution && (
            <ProjectSection
              title="Solution"
              content={
                assignment.project.solution
              }
            />
          )}

          {assignment.project.technologyStack && (
            <ProjectSection
              title="Technology Stack"
              content={
                assignment.project
                  .technologyStack
              }
            />
          )}

          {/* PROJECT LINKS */}

          <div className="mt-6 flex flex-wrap gap-3">

            {assignment.project.githubUrl && (
              <a
                href={
                  assignment.project
                    .githubUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                View GitHub
              </a>
            )}

            {assignment.project.demoUrl && (
              <a
                href={
                  assignment.project.demoUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                View Demo
              </a>
            )}

            {assignment.project.presentationUrl && (
              <a
                href={
                  assignment.project
                    .presentationUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
              >
                View Presentation
              </a>
            )}

          </div>

        </section>

        {/* EVALUATION FORM */}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Evaluation Criteria
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Select the most appropriate score
                for each criterion.
              </p>
            </div>

            <div className="space-y-6">

              {criteria.map(
                (criterion) => {
                  const currentScore =
                    scores.find(
                      (item) =>
                        item.criterionId ===
                        criterion._id
                    );

                  return (
                    <div
                      key={criterion._id}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                    >

                      {/* CRITERION HEADER */}

                      <div className="flex flex-col justify-between gap-3 md:flex-row">

                        <div>
                          <h3 className="font-semibold">
                            {criterion.name}
                          </h3>

                          {criterion.description && (
                            <p className="mt-1 text-sm text-slate-400">
                              {
                                criterion.description
                              }
                            </p>
                          )}
                        </div>

                        <span className="h-fit rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
                          Weight:{" "}
                          {criterion.weight}%
                        </span>

                      </div>

                      {/* SCORE OPTIONS */}

                      <div className="mt-5 grid gap-3 md:grid-cols-5">

                        {criterion.scoringLevels.map(
                          (level) => (
                            <button
                              key={level.name}
                              type="button"
                              disabled={submitted}
                              onClick={() =>
                                updateScore(
                                  criterion._id,
                                  Number(
                                    level.score
                                  )
                                )
                              }
                              className={`rounded-xl border p-4 text-left transition ${
                                currentScore?.score ===
                                Number(level.score)
                                  ? "border-blue-500 bg-blue-500/10"
                                  : "border-slate-800 bg-slate-900 hover:border-slate-600"
                              } ${
                                submitted
                                  ? "cursor-default"
                                  : ""
                              }`}
                            >

                              <p className="text-xs font-medium text-blue-400">
                                {level.name}
                              </p>

                              <p className="mt-2 text-2xl font-bold">
                                {level.score}
                              </p>

                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                {
                                  level.description
                                }
                              </p>

                            </button>
                          )
                        )}

                      </div>

                      {/* CRITERION FEEDBACK */}

                      <textarea
                        rows={3}
                        disabled={submitted}
                        value={
                          currentScore?.feedback ||
                          ""
                        }
                        onChange={(event) =>
                          updateFeedback(
                            criterion._id,
                            event.target.value
                          )
                        }
                        placeholder="Optional feedback for this criterion..."
                        className="mt-5 w-full resize-none rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                      />

                    </div>
                  );
                }
              )}

            </div>

          </section>

          {/* OVERALL FEEDBACK */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <h2 className="text-xl font-semibold">
              Overall Feedback
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Provide overall feedback for the team.
            </p>

            <textarea
              rows={5}
              disabled={submitted}
              value={overallFeedback}
              onChange={(event) =>
                setOverallFeedback(
                  event.target.value
                )
              }
              placeholder="Write your overall feedback..."
              className="mt-5 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            />

          </section>

          {/* SUBMIT */}

          {!submitted && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting Evaluation..."
                : "Submit Evaluation"}
            </button>
          )}

        </form>

      </div>
    </main>
  );
}


// ==========================================
// INFO ITEM
// ==========================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-950 p-4">

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-medium">
        {value}
      </p>

    </div>
  );
}


// ==========================================
// PROJECT SECTION
// ==========================================

function ProjectSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="mt-6">

      <h3 className="text-sm font-medium text-slate-300">
        {title}
      </h3>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
        {content}
      </p>

    </div>
  );
}