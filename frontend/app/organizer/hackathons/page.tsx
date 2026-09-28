"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// =====================================================
// TYPES
// =====================================================

type Hackathon = {
  _id: string;
  hackathonId?: string;

  name: string;
  description: string;

  startDate: string;
  endDate: string;

  status:
    | "DRAFT"
    | "UPCOMING"
    | "ACTIVE"
    | "COMPLETED";

  organizer?: string;

  createdAt?: string;
  updatedAt?: string;

  // Real counts returned by backend
  teamCount?: number;
  judgeCount?: number;
  roundCount?: number;
  evaluationCount?: number;

  // Alternative names supported
  teamsCount?: number;
  judgesCount?: number;
  roundsCount?: number;
  evaluationsCount?: number;
};

// =====================================================
// API RESPONSE
// =====================================================

type HackathonsResponse = {
  success?: boolean;
  message?: string;

  hackathons?: Hackathon[];

  stats?: {
    teams?: number;
    judges?: number;
    rounds?: number;
    evaluations?: number;
    submissions?: number;
  };
};

// =====================================================
// PAGE
// =====================================================

export default function HackathonsPage() {
  const router = useRouter();

  // =====================================================
  // AUTH
  // =====================================================

  const {
    token,
    user,
    loading: authLoading,
  } = useAuth();

  // =====================================================
  // STATE
  // =====================================================

  const [hackathons, setHackathons] =
    useState<Hackathon[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [totalTeams, setTotalTeams] =
    useState(0);

  // =====================================================
  // GET ORGANIZER HACKATHONS
  //
  // apiRequest already contains /api.
  //
  // Therefore:
  //
  // /hackathons/organizer
  //
  // becomes:
  //
  // /api/hackathons/organizer
  // =====================================================

  const fetchHackathons = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log(
        "Fetching organizer hackathons..."
      );

      const response =
        (await apiRequest(
          "/hackathons/organizer",
          {
            method: "GET",
            token,
          }
        )) as HackathonsResponse;

      console.log(
        "Organizer hackathons response:",
        response
      );

      // -------------------------------------------------
      // HACKATHONS
      // -------------------------------------------------

      const receivedHackathons =
        Array.isArray(
          response?.hackathons
        )
          ? response.hackathons
          : [];

      setHackathons(
        receivedHackathons
      );

      // -------------------------------------------------
      // TOTAL TEAMS
      //
      // Prefer backend global stats.
      // Fallback to summing individual counts.
      // -------------------------------------------------

      const backendTotalTeams =
        Number(
          response?.stats?.teams || 0
        );

      if (
        backendTotalTeams > 0
      ) {
        setTotalTeams(
          backendTotalTeams
        );
      } else {
        const calculatedTotal =
          receivedHackathons.reduce(
            (
              total,
              hackathon
            ) =>
              total +
              Number(
                hackathon.teamCount ??
                  hackathon.teamsCount ??
                  0
              ),
            0
          );

        setTotalTeams(
          calculatedTotal
        );
      }
    } catch (err) {
      console.error(
        "Fetch hackathons error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch hackathons"
      );

      setHackathons([]);
      setTotalTeams(0);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD HACKATHONS
  // =====================================================

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    // -------------------------------------------------
    // ORGANIZER ROLE CHECK
    // -------------------------------------------------

    if (
      user &&
      String(user.role || "")
        .trim()
        .toUpperCase() !==
        "ORGANIZER"
    ) {
      setError(
        "You are not authorized to access organizer hackathons."
      );

      setLoading(false);
      return;
    }

    fetchHackathons();
  }, [
    token,
    user,
    authLoading,
    router,
  ]);

  // =====================================================
  // DELETE HACKATHON
  // =====================================================

  const handleDelete = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this hackathon?"
      );

    if (!confirmed) {
      return;
    }

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setError("");

      console.log(
        "Deleting hackathon:",
        id
      );

      await apiRequest(
        `/hackathons/${id}`,
        {
          method: "DELETE",
          token,
        }
      );

      // -------------------------------------------------
      // REMOVE FROM UI
      // -------------------------------------------------

      setHackathons(
        (prev) =>
          prev.filter(
            (hackathon) =>
              hackathon._id !== id
          )
      );

      // -------------------------------------------------
      // REFRESH COUNTS
      // -------------------------------------------------

      await fetchHackathons();
    } catch (err) {
      console.error(
        "Delete hackathon error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete hackathon"
      );
    }
  };

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = (
    date: string
  ) => {
    try {
      const parsedDate =
        new Date(date);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return date;
      }

      return parsedDate.toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  };

  // =====================================================
  // DATE RANGE
  // =====================================================

  const formatDateRange = (
    startDate: string,
    endDate: string
  ) => {
    return `${formatDate(
      startDate
    )} - ${formatDate(
      endDate
    )}`;
  };

  // =====================================================
  // STATUS LABEL
  // =====================================================

  const getStatusLabel = (
    status: Hackathon["status"]
  ) => {
    switch (status) {
      case "DRAFT":
        return "Draft";

      case "UPCOMING":
        return "Upcoming";

      case "ACTIVE":
        return "Active";

      case "COMPLETED":
        return "Completed";

      default:
        return status;
    }
  };

  // =====================================================
  // STATUS STYLE
  // =====================================================

  const getStatusStyle = (
    status: Hackathon["status"]
  ) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500/10 text-green-400";

      case "UPCOMING":
        return "bg-blue-500/10 text-blue-400";

      case "COMPLETED":
        return "bg-purple-500/10 text-purple-400";

      case "DRAFT":
        return "bg-yellow-500/10 text-yellow-400";

      default:
        return "bg-slate-500/10 text-slate-400";
    }
  };

  // =====================================================
  // STATS
  // =====================================================

  const activeHackathons =
    hackathons.filter(
      (hackathon) =>
        hackathon.status ===
        "ACTIVE"
    ).length;

  // =====================================================
  // AUTH LOADING
  // =====================================================

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

          <p className="text-slate-400">
            Checking authentication...
          </p>

        </div>
      </main>
    );
  }

  // =====================================================
  // PAGE LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />

          <p className="text-slate-400">
            Loading hackathons...
          </p>

        </div>
      </main>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-800 bg-slate-950">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div>

            {/* IMPORTANT:
                Organizer Dashboard route is /organizer
            */}

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/organizer"
                )
              }
              className="mb-2 text-sm text-slate-400 transition hover:text-white"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold">
              My Hackathons
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Manage your hackathons and evaluation workflow.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/organizer/hackathons/create"
              )
            }
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
          >
            + Create Hackathon
          </button>

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* =================================================
            HERO
        ================================================= */}

        <section className="mb-10">

          <p className="text-sm font-semibold tracking-wider text-blue-400">
            HACKATHON MANAGEMENT
          </p>

          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Organize. Evaluate. Decide fairly.
          </h2>

          <p className="mt-3 max-w-2xl leading-7 text-slate-400">
            Manage teams, configure evaluation
            rounds, define scoring criteria,
            assign judges and track evaluation
            progress from one centralized platform.
          </p>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-8 flex items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">

            <div>

              <p className="font-semibold">
                Error
              </p>

              <p className="mt-1">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>

          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <section className="mb-10 grid gap-5 md:grid-cols-3">

          {/* TOTAL HACKATHONS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Total Hackathons
            </p>

            <p className="mt-3 text-3xl font-bold">
              {hackathons.length}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Events created on FairJudge
            </p>

          </div>

          {/* ACTIVE EVENTS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Active Events
            </p>

            <p className="mt-3 text-3xl font-bold text-green-400">
              {activeHackathons}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Currently active hackathons
            </p>

          </div>

          {/* TOTAL TEAMS */}

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Total Teams
            </p>

            <p className="mt-3 text-3xl font-bold text-blue-400">
              {totalTeams}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Registered across your hackathons
            </p>

          </div>

        </section>

        {/* =================================================
            SECTION HEADER
        ================================================= */}

        <div className="mb-6 flex items-center justify-between">

          <div>

            <h2 className="text-xl font-bold">
              Your Hackathons
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Select an event to manage its evaluation process.
            </p>

          </div>

          <span className="hidden rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-400 sm:block">
            {hackathons.length} Events
          </span>

        </div>

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {hackathons.length === 0 &&
          !error && (

            <div className="mb-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-12 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl text-blue-400">
                🏆
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                No hackathons yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first hackathon and
                start managing teams, judges and
                evaluations.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/organizer/hackathons/create"
                  )
                }
                className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
              >
                + Create Hackathon
              </button>

            </div>
          )}

        {/* =================================================
            HACKATHON CARDS
        ================================================= */}

        <section className="grid gap-6 md:grid-cols-2">

          {hackathons.map(
            (hackathon) => {

              const teamCount =
                hackathon.teamCount ??
                hackathon.teamsCount ??
                0;

              const roundCount =
                hackathon.roundCount ??
                hackathon.roundsCount ??
                0;

              const judgeCount =
                hackathon.judgeCount ??
                hackathon.judgesCount ??
                0;

              return (
                <div
                  key={
                    hackathon._id
                  }
                  className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition duration-300 hover:-translate-y-1 hover:border-slate-600 hover:shadow-2xl"
                >

                  {/* =================================================
                      CARD TOP
                  ================================================= */}

                  <div className="border-b border-slate-800 bg-gradient-to-br from-blue-600/20 via-slate-900 to-slate-900 p-6">

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
                        🏆
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                          hackathon.status
                        )}`}
                      >
                        {getStatusLabel(
                          hackathon.status
                        )}
                      </span>

                    </div>

                    <h3 className="mt-6 text-xl font-bold">
                      {hackathon.name}
                    </h3>

                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-400">
                      {hackathon.description}
                    </p>

                    <div className="mt-4 text-xs text-slate-500">
                      📅{" "}
                      {formatDateRange(
                        hackathon.startDate,
                        hackathon.endDate
                      )}
                    </div>

                    {/* PUBLIC ID */}

                    {hackathon.hackathonId && (
                      <div className="mt-3">

                        <span className="text-xs text-slate-600">
                          Public ID:
                        </span>

                        <span className="ml-2 rounded-md border border-blue-500/20 bg-blue-500/5 px-2 py-1 font-mono text-xs text-blue-400">
                          {
                            hackathon.hackathonId
                          }
                        </span>

                      </div>
                    )}

                  </div>

                  {/* =================================================
                      REAL STATS
                  ================================================= */}

                  <div className="grid grid-cols-3 divide-x divide-slate-800 border-b border-slate-800">

                    {/* TEAMS */}

                    <div className="p-5 text-center">

                      <p className="text-xl font-bold">
                        {teamCount}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Teams
                      </p>

                    </div>

                    {/* ROUNDS */}

                    <div className="p-5 text-center">

                      <p className="text-xl font-bold">
                        {roundCount}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Rounds
                      </p>

                    </div>

                    {/* JUDGES */}

                    <div className="p-5 text-center">

                      <p className="text-xl font-bold">
                        {judgeCount}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Judges
                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      ACTIONS
                  ================================================= */}

                  <div className="flex gap-3 p-5">

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/organizer/hackathons/${hackathon._id}`
                        )
                      }
                      className="flex-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
                    >
                      Manage Hackathon →
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          hackathon._id
                        )
                      }
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                    >
                      Delete
                    </button>

                  </div>

                </div>
              );
            }
          )}

          {/* =================================================
              CREATE NEW CARD
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              router.push(
                "/organizer/hackathons/create"
              )
            }
            className="flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center transition hover:border-blue-500 hover:bg-slate-900"
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl text-blue-400">
              +
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              Create New Hackathon
            </h3>

            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
              Start a new innovation event and
              configure your teams, judges and
              evaluation process.
            </p>

          </button>

        </section>

      </div>

    </main>
  );
}