"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// ======================================================
// HACKATHON TYPE
// ======================================================

type Hackathon = {
  _id: string;

  // PUBLIC HACKATHON ID
  // Example: HACK-7F3A91
  hackathonId: string;

  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
};

// ======================================================
// HACKATHON STATS
// ======================================================

type HackathonStats = {
  teams: number;
  judges: number;
  rounds: number;
  evaluations: number;
};

// ======================================================
// PAGE
// ======================================================

export default function HackathonManagementPage() {
  const router = useRouter();
  const params = useParams();

  const { token } = useAuth();

  // ====================================================
  // IMPORTANT
  //
  // params.id is the MONGODB _id.
  //
  // Example:
  //
  // /organizer/hackathons/68xxxxxxxxxxxx
  //
  // params.id =
  // 68xxxxxxxxxxxx
  //
  // This is NOT the public HACK-XXXXXX ID.
  // ====================================================

  const hackathonMongoId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);

  // ====================================================
  // STATE
  // ====================================================

  const [hackathon, setHackathon] =
    useState<Hackathon | null>(null);

  const [stats, setStats] =
    useState<HackathonStats>({
      teams: 0,
      judges: 0,
      rounds: 0,
      evaluations: 0,
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ====================================================
  // LOAD HACKATHON
  // ====================================================

  useEffect(() => {
    const loadHackathonData = async () => {
      if (!token || !hackathonMongoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        // ==================================================
        // GET HACKATHON
        //
        // This endpoint expects MongoDB _id.
        //
        // GET /api/hackathons/:id
        // ==================================================

        const hackathonResponse =
          await apiRequest(
            `/hackathons/${hackathonMongoId}`,
            {
              token,
            }
          );

        console.log(
          "HACKATHON RESPONSE:",
          hackathonResponse
        );

        if (
          !hackathonResponse ||
          !hackathonResponse.hackathon
        ) {
          throw new Error(
            "Hackathon data was not returned by the server"
          );
        }

        setHackathon(
          hackathonResponse.hackathon
        );

        // ==================================================
        // GET STATS
        //
        // Stats failure should NOT make the entire
        // hackathon page fail.
        // ==================================================

        try {
          const statsResponse =
            await apiRequest(
              `/organizer/hackathons/${hackathonMongoId}/stats`,
              {
                token,
              }
            );

          console.log(
            "STATS RESPONSE:",
            statsResponse
          );

          if (statsResponse?.stats) {
            setStats(
              statsResponse.stats
            );
          }
        } catch (statsError) {
          console.error(
            "Stats API error:",
            statsError
          );

          // Keep default stats instead of
          // breaking the entire page.
          setStats({
            teams: 0,
            judges: 0,
            rounds: 0,
            evaluations: 0,
          });
        }
      } catch (error) {
        console.error(
          "Load hackathon error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load hackathon"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHackathonData();
  }, [token, hackathonMongoId]);

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading hackathon...
      </main>
    );
  }

  // ====================================================
  // ERROR
  // ====================================================

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-semibold text-red-400">
              Unable to load hackathon
            </h2>

            <p className="mt-2 text-sm text-red-300">
              {error}
            </p>

            <button
              onClick={() =>
                router.push(
                  "/organizer/hackathons"
                )
              }
              className="mt-5 rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              ← Back to Hackathons
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ====================================================
  // NOT FOUND
  // ====================================================

  if (!hackathon) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Hackathon not found.
      </main>
    );
  }

  // ====================================================
  // SAFELY GET PUBLIC ID
  //
  // Example:
  // HACK-7F3A91
  //
  // This is the ID that the Teams API expects.
  // ====================================================

  const publicHackathonId =
    hackathon.hackathonId;

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
          <button
            onClick={() =>
              router.push(
                "/organizer/hackathons"
              )
            }
            className="mb-5 text-sm text-slate-400 hover:text-white"
          >
            ← My Hackathons
          </button>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">

            <div className="min-w-0">

              {/* NAME + STATUS */}

              <div className="flex flex-wrap items-center gap-3">

                <h1 className="text-3xl font-bold">
                  {hackathon.name}
                </h1>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                  {hackathon.status}
                </span>

              </div>

              {/* ==================================================
                  PUBLIC HACKATHON ID
              ================================================== */}

              <div className="mt-3 flex flex-wrap items-center gap-2">

                <span className="text-xs text-slate-500">
                  Hackathon ID:
                </span>

                <span className="rounded-md border border-blue-500/20 bg-blue-500/5 px-2.5 py-1 font-mono text-xs font-medium text-blue-400">
                  {publicHackathonId ||
                    "Not generated"}
                </span>

              </div>

              {/* DESCRIPTION */}

              <p className="mt-3 max-w-3xl text-slate-400">
                {hackathon.description}
              </p>

              {/* DATES */}

              <div className="mt-4 flex flex-wrap gap-5 text-sm text-slate-500">

                <span>
                  Start:{" "}
                  {new Date(
                    hackathon.startDate
                  ).toLocaleString()}
                </span>

                <span>
                  End:{" "}
                  {new Date(
                    hackathon.endDate
                  ).toLocaleString()}
                </span>

              </div>

            </div>

            {/* ==================================================
                HACKATHON SETTINGS
            ================================================== */}

            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/settings`
                )
              }
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium hover:bg-slate-800"
            >
              Hackathon Settings
            </button>

          </div>
        </div>

        {/* ==================================================
            LIVE STATISTICS
        ================================================== */}

        <div className="grid gap-5 md:grid-cols-4">

          <StatCard
            title="Teams"
            value={stats.teams.toString()}
            description="Registered teams"
          />

          <StatCard
            title="Judges"
            value={stats.judges.toString()}
            description="Assigned judges"
          />

          <StatCard
            title="Rounds"
            value={stats.rounds.toString()}
            description="Evaluation rounds"
          />

          <StatCard
            title="Evaluations"
            value={stats.evaluations.toString()}
            description="Submitted evaluations"
          />

        </div>

        {/* ==================================================
            SETUP PROGRESS
        ================================================== */}

        <section className="mt-8">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-semibold text-blue-400">
                HACKATHON SETUP
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Setup Progress
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Complete these steps to prepare
                your hackathon for evaluation.
              </p>

            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2">

              <span className="text-sm text-slate-400">
                Progress
              </span>

              <span className="ml-2 text-sm font-semibold text-white">
                1 / 6
              </span>

            </div>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {/* STEP 1 */}

            <SetupStep
              number="01"
              title="Create Hackathon"
              description="Basic hackathon information has been configured."
              status="Complete"
              complete
            />

            {/* STEP 2 */}

            <SetupStep
              number="02"
              title="Create Evaluation Rounds"
              description="Define the different rounds for your hackathon."
              status="Pending"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/rounds`
                )
              }
            />

            {/* STEP 3 */}

            <SetupStep
              number="03"
              title="Configure Scoring Criteria"
              description="Create standardized evaluation criteria."
              status="Pending"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/criteria`
                )
              }
            />

            {/* STEP 4 */}

            <SetupStep
              number="04"
              title="Manage Teams"
              description="Review registered teams and submitted projects."
              status="Pending"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${publicHackathonId}/teams`
                )
              }
            />

            {/* STEP 5 */}

            <SetupStep
              number="05"
              title="Assign Judges"
              description="Assign judges to teams and evaluation rounds."
              status="Pending"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/assignments`
                )
              }
            />

            {/* STEP 6 */}

            <SetupStep
              number="06"
              title="Start Evaluation"
              description="Begin the evaluation process once setup is complete."
              status="Locked"
            />

          </div>

        </section>

        {/* ==================================================
            HACKATHON CONFIGURATION
        ================================================== */}

        <section className="mt-8">

          <h2 className="text-xl font-semibold">
            Hackathon Configuration
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {/* ROUNDS */}

            <ManagementCard
              icon="🔄"
              title="Evaluation Rounds"
              description="Create and manage different evaluation rounds."
              action="Manage Rounds"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/rounds`
                )
              }
            />

            {/* CRITERIA */}

            <ManagementCard
              icon="📊"
              title="Scoring Criteria"
              description="Define standardized criteria and scoring levels."
              action="Configure Criteria"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/criteria`
                )
              }
            />

            {/* ASSIGNMENTS */}

            <ManagementCard
              icon="⚖️"
              title="Judge Assignments"
              description="Assign judges to teams and evaluation rounds."
              action="Manage Assignments"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/assignments`
                )
              }
            />

            {/* TEAMS */}

            <ManagementCard
              icon="👥"
              title="Teams"
              description="View registered teams and their submitted projects."
              action="Manage Teams"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${publicHackathonId}/teams`
                )
              }
            />

            {/* EVALUATIONS */}

            <ManagementCard
              icon="📋"
              title="Evaluations"
              description="View submitted judge evaluations and integrity records."
              action="View Evaluations"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/evaluations`
                )
              }
            />

            {/* LEADERBOARD */}

            <ManagementCard
              icon="🏆"
              title="Leaderboard"
              description="View final rankings calculated from locked evaluations."
              action="View Leaderboard"
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/leaderboard`
                )
              }
            />

          </div>

        </section>

        {/* ==================================================
            JUDGE ASSIGNMENT
        ================================================== */}

        <section className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>

              <div className="flex items-center gap-3">

                <span className="text-2xl">
                  ⚖️
                </span>

                <h2 className="text-xl font-semibold">
                  Judge Assignment
                </h2>

              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Assign judges to specific teams and
                evaluation rounds. Judges can only
                evaluate projects assigned to them.
              </p>

            </div>

            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/assignments`
                )
              }
              className="whitespace-nowrap rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500"
            >
              Manage Judges
            </button>

          </div>

        </section>

        {/* ==================================================
            LEADERBOARD
        ================================================== */}

        <section className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

            <div>

              <div className="flex items-center gap-3">

                <span className="text-2xl">
                  🏆
                </span>

                <h2 className="text-xl font-semibold">
                  Final Rankings
                </h2>

              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                View team rankings calculated
                exclusively from locked judge
                evaluations.
              </p>

            </div>

            <button
              onClick={() =>
                router.push(
                  `/organizer/hackathons/${hackathonMongoId}/leaderboard`
                )
              }
              className="whitespace-nowrap rounded-lg bg-yellow-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-yellow-400"
            >
              View Leaderboard
            </button>

          </div>

        </section>

        {/* ==================================================
            INTEGRITY
        ================================================== */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="flex items-center gap-3">

                <span className="text-2xl">
                  🔒
                </span>

                <h2 className="text-xl font-semibold">
                  Evaluation Integrity
                </h2>

              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                Submitted judge evaluations are
                immutable. Organizers can view
                evaluation records and audit
                information but cannot silently
                change submitted scores.
              </p>

            </div>

            <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-5 py-4">

              <p className="text-sm font-medium text-green-400">
                Integrity Protection
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Enabled
              </p>

            </div>

          </div>

        </section>

      </div>
    </main>
  );
}

// ======================================================
// STAT CARD
// ======================================================

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

// ======================================================
// MANAGEMENT CARD
// ======================================================

function ManagementCard({
  icon,
  title,
  description,
  action,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-slate-700">

      <div className="flex items-start justify-between gap-3">

        <span className="text-2xl">
          {icon}
        </span>

        <button
          onClick={onClick}
          className="text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          {action} →
        </button>

      </div>

      <h3 className="mt-5 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>

    </div>
  );
}

// ======================================================
// SETUP STEP
// ======================================================

function SetupStep({
  number,
  title,
  description,
  status,
  complete = false,
  onClick,
}: {
  number: string;
  title: string;
  description: string;
  status: string;
  complete?: boolean;
  onClick?: () => void;
}) {
  const statusStyles = complete
    ? "border-green-500/30 bg-green-500/10 text-green-400"
    : status === "Locked"
      ? "border-slate-700 bg-slate-800 text-slate-500"
      : "border-blue-500/30 bg-blue-500/10 text-blue-400";

  return (
    <div
      className={`group rounded-2xl border p-5 transition ${
        complete
          ? "border-green-500/20 bg-slate-900"
          : "border-slate-800 bg-slate-900 hover:border-blue-500/40"
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${
            complete
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-slate-700 bg-slate-800 text-slate-300"
          }`}
        >
          {complete ? "✓" : number}
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles}`}
        >
          {status}
        </span>

      </div>

      <h3 className="mt-5 text-base font-semibold text-white">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>

      {onClick && (
        <button
          onClick={onClick}
          className="mt-5 text-sm font-medium text-blue-400 transition hover:text-blue-300"
        >
          Configure →
        </button>
      )}

    </div>
  );
}