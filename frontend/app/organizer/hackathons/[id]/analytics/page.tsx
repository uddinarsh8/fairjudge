"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Analytics = {
  totalTeams: number;
  totalJudges: number;
  totalRounds: number;
  totalAssignments: number;
  totalEvaluations: number;
  submittedEvaluations: number;
  pendingEvaluations: number;
  averageScore: number;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();

  const hackathonId = params.id as string;

  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!token || !hackathonId) return;

      try {
        setLoading(true);
        setError("");

        const response = await apiRequest(
          `/organizer/hackathons/${hackathonId}/analytics`,
          {
            token,
          }
        );

        setAnalytics(response.analytics);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load analytics"
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [token, hackathonId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading analytics...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-6xl">

          <button
            onClick={() =>
              router.push(
                `/organizer/hackathons/${hackathonId}`
              )
            }
            className="mb-6 text-sm text-slate-400 hover:text-white"
          >
            ← Back to Hackathon
          </button>

          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-semibold text-red-400">
              Unable to load analytics
            </h2>

            <p className="mt-2 text-sm text-red-300">
              {error}
            </p>
          </div>

        </div>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        No analytics available.
      </main>
    );
  }

  const completionRate =
    analytics.totalAssignments > 0
      ? Math.round(
          (analytics.submittedEvaluations /
            analytics.totalAssignments) *
            100
        )
      : 0;

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">

      <div className="mx-auto max-w-7xl">

        {/* BACK */}

        <button
          onClick={() =>
            router.push(
              `/organizer/hackathons/${hackathonId}`
            )
          }
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Back to Hackathon
        </button>

        {/* HEADER */}

        <div className="mb-10">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
              📊
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                Hackathon Analytics
              </h1>

              <p className="mt-1 text-slate-400">
                Track participation, evaluations and scoring progress.
              </p>
            </div>

          </div>

        </div>

        {/* OVERVIEW CARDS */}

        <section>

          <h2 className="mb-5 text-xl font-semibold">
            Overview
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <AnalyticsCard
              title="Total Teams"
              value={analytics.totalTeams}
              description="Registered teams"
              icon="👥"
            />

            <AnalyticsCard
              title="Total Judges"
              value={analytics.totalJudges}
              description="Active judges"
              icon="⚖️"
            />

            <AnalyticsCard
              title="Evaluation Rounds"
              value={analytics.totalRounds}
              description="Configured rounds"
              icon="🔄"
            />

            <AnalyticsCard
              title="Assignments"
              value={analytics.totalAssignments}
              description="Judge-team assignments"
              icon="📋"
            />

          </div>

        </section>

        {/* EVALUATION PROGRESS */}

        <section className="mt-10">

          <h2 className="mb-5 text-xl font-semibold">
            Evaluation Progress
          </h2>

          <div className="grid gap-5 lg:grid-cols-3">

            <AnalyticsCard
              title="Total Evaluations"
              value={analytics.totalEvaluations}
              description="Evaluation records created"
              icon="📝"
            />

            <AnalyticsCard
              title="Submitted"
              value={analytics.submittedEvaluations}
              description="Completed evaluations"
              icon="✅"
            />

            <AnalyticsCard
              title="Pending"
              value={analytics.pendingEvaluations}
              description="Awaiting submission"
              icon="⏳"
            />

          </div>

        </section>

        {/* PERFORMANCE */}

        <section className="mt-10 grid gap-6 lg:grid-cols-2">

          {/* COMPLETION RATE */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  Evaluation Completion
                </p>

                <h2 className="mt-2 text-4xl font-bold">
                  {completionRate}%
                </h2>

              </div>

              <div className="text-4xl">
                📈
              </div>

            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">

              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${completionRate}%`,
                }}
              />

            </div>

            <p className="mt-4 text-sm text-slate-500">
              {analytics.submittedEvaluations} of{" "}
              {analytics.totalAssignments} assignments
              have been completed.
            </p>

          </div>

          {/* AVERAGE SCORE */}

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-7">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-blue-300">
                  Overall Average Score
                </p>

                <h2 className="mt-2 text-4xl font-bold">
                  {analytics.averageScore.toFixed(2)}
                </h2>

              </div>

              <div className="text-4xl">
                🎯
              </div>

            </div>

            <p className="mt-6 text-sm leading-6 text-slate-400">
              This score represents the average across all
              submitted evaluations in the hackathon.
            </p>

          </div>

        </section>

        {/* INSIGHT */}

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-7">

          <h2 className="text-xl font-semibold">
            Hackathon Insights
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-3">

            <InsightCard
              title="Participation"
              value={`${analytics.totalTeams} Teams`}
              description="Teams currently registered."
            />

            <InsightCard
              title="Evaluation Status"
              value={`${completionRate}% Complete`}
              description="Progress of assigned evaluations."
            />

            <InsightCard
              title="Performance"
              value={analytics.averageScore.toFixed(2)}
              description="Average score across evaluations."
            />

          </div>

        </section>

      </div>

    </main>
  );
}

function AnalyticsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-sm text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>

        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-2xl">
          {icon}
        </div>

      </div>

    </div>
  );
}

function InsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-xl font-bold text-blue-400">
        {value}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}