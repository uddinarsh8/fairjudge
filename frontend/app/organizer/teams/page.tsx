"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  CalendarDays,
  Eye,
  ArrowLeft,
  RefreshCw,
  Search,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

// ======================================================
// TYPES
// ======================================================

type Hackathon = {
  _id: string;
  hackathonId?: string;
  name: string;
  startDate?: string;
  endDate?: string;
};

type TeamMember = {
  name: string;
  email: string;
  role?: string;
};

type Team = {
  _id: string;
  name: string;

  status?: string;

  leader?: {
    _id?: string;
    name?: string;
    email?: string;
  };

  members?: TeamMember[];

  hackathon?:
    | string
    | {
        _id?: string;
        hackathonId?: string;
        name?: string;
      };

  createdAt?: string;
};

type HackathonsResponse = {
  hackathons?: Hackathon[];
  data?: Hackathon[];
};

type TeamsResponse = {
  success?: boolean;
  count?: number;
  teams?: Team[];
};

// ======================================================
// COMPONENT
// ======================================================

export default function OrganizerTeamsPage() {
  const router = useRouter();

  const { user, token, loading } = useAuth();

  const [hackathons, setHackathons] = useState<
    Hackathon[]
  >([]);

  const [teams, setTeams] = useState<Team[]>([]);

  const [loadingTeams, setLoadingTeams] =
    useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // ====================================================
  // AUTHENTICATION
  // ====================================================

  useEffect(() => {
    if (loading) return;

    if (!user || !token) {
      router.replace("/login");
      return;
    }

    const role = String(
      user.role || ""
    ).toUpperCase();

    if (role !== "ORGANIZER") {
      router.replace("/login");
    }
  }, [loading, user, token, router]);

  // ====================================================
  // LOAD TEAMS
  // ====================================================

  useEffect(() => {
    if (
      loading ||
      !user ||
      !token
    ) {
      return;
    }

    const role = String(
      user.role || ""
    ).toUpperCase();

    if (role !== "ORGANIZER") {
      return;
    }

    loadTeams();
  }, [loading, user, token]);

  // ====================================================
  // FETCH ORGANIZER HACKATHONS
  // THEN FETCH TEAMS FOR EACH HACKATHON
  // ====================================================

  const loadTeams = async () => {
    try {
      setLoadingTeams(true);
      setError("");

      // ----------------------------------------------
      // GET ORGANIZER HACKATHONS
      // ----------------------------------------------

      const hackathonResponse: HackathonsResponse =
        await apiRequest(
          "/hackathons/organizer",
          {
            method: "GET",
            token,
          }
        );

      const receivedHackathons =
        hackathonResponse?.hackathons ||
        hackathonResponse?.data ||
        [];

      const safeHackathons =
        Array.isArray(
          receivedHackathons
        )
          ? receivedHackathons
          : [];

      setHackathons(
        safeHackathons
      );

      // ----------------------------------------------
      // NO HACKATHONS
      // ----------------------------------------------

      if (
        safeHackathons.length ===
        0
      ) {
        setTeams([]);
        return;
      }

      // ----------------------------------------------
      // GET TEAMS FROM EVERY HACKATHON
      // ----------------------------------------------

      const teamResults =
        await Promise.all(
          safeHackathons.map(
            async (hackathon) => {
              const publicId =
                hackathon.hackathonId;

              if (!publicId) {
                return [];
              }

              try {
                const response: TeamsResponse =
                  await apiRequest(
                    `/teams/hackathon/${encodeURIComponent(
                      publicId
                    )}`,
                    {
                      method: "GET",
                      token,
                    }
                  );

                const receivedTeams =
                  response?.teams;

                if (
                  !Array.isArray(
                    receivedTeams
                  )
                ) {
                  return [];
                }

                // --------------------------------
                // Attach hackathon information
                // --------------------------------

                return receivedTeams.map(
                  (team) => ({
                    ...team,

                    hackathon:
                      team.hackathon ||
                      {
                        _id:
                          hackathon._id,
                        hackathonId:
                          hackathon.hackathonId,
                        name:
                          hackathon.name,
                      },
                  })
                );
              } catch (teamError) {
                console.error(
                  `Failed to load teams for ${hackathon.name}:`,
                  teamError
                );

                return [];
              }
            }
          )
        );

      // ----------------------------------------------
      // FLATTEN ALL TEAMS
      // ----------------------------------------------

      const allTeams =
        teamResults.flat();

      setTeams(allTeams);
    } catch (err: any) {
      console.error(
        "Failed to load organizer teams:",
        err
      );

      setError(
        err?.message ||
          "Failed to load teams."
      );
    } finally {
      setLoadingTeams(false);
    }
  };

  // ====================================================
  // FORMAT DATE
  // ====================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) return "-";

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "-";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ====================================================
  // TEAM STATUS
  // ====================================================

  const getStatusClasses = (
    status?: string
  ) => {
    switch (
      String(
        status || ""
      ).toUpperCase()
    ) {
      case "APPROVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

      case "REJECTED":
        return "bg-red-500/10 text-red-400 border-red-500/20";

      case "PENDING":
      default:
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    }
  };

  // ====================================================
  // FILTER TEAMS
  // ====================================================

  const filteredTeams =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return teams;
      }

      return teams.filter(
        (team) => {
          const teamName =
            team.name
              ?.toLowerCase() ||
            "";

          const leaderName =
            team.leader?.name
              ?.toLowerCase() ||
            "";

          const leaderEmail =
            team.leader?.email
              ?.toLowerCase() ||
            "";

          const hackathonName =
            typeof team.hackathon ===
            "object"
              ? team.hackathon?.name
                  ?.toLowerCase() ||
                ""
              : "";

          return (
            teamName.includes(
              query
            ) ||
            leaderName.includes(
              query
            ) ||
            leaderEmail.includes(
              query
            ) ||
            hackathonName.includes(
              query
            )
          );
        }
      );
    }, [teams, search]);

  // ====================================================
  // LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060D19] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />

          <p className="text-sm font-semibold mt-4">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ====================================================
  // AUTH CHECK
  // ====================================================

  if (!user || !token) {
    return (
      <div className="min-h-screen bg-[#060D19] flex items-center justify-center text-white">
        <p className="text-gray-400">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // ====================================================
  // ROLE CHECK
  // ====================================================

  if (
    String(
      user.role || ""
    ).toUpperCase() !==
    "ORGANIZER"
  ) {
    return (
      <div className="min-h-screen bg-[#060D19] flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-400 font-semibold">
            Access denied.
          </p>

          <button
            onClick={() =>
              router.replace(
                "/login"
              )
            }
            className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ====================================================
  // MAIN PAGE
  // ====================================================

  return (
    <div className="min-h-screen bg-[#060D19] text-white">
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="border-b border-white/[0.06] bg-[#08111F]">
        <div className="max-w-[1200px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  router.push(
                    "/organizer"
                  )
                }
                className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.05] transition"
                title="Back to Dashboard"
              >
                <ArrowLeft
                  size={17}
                />
              </button>

              <div>
                <h1 className="text-xl font-bold">
                  Teams
                </h1>

                <p className="text-xs text-gray-500 mt-1">
                  Manage teams registered
                  across your hackathons.
                </p>
              </div>
            </div>

            <button
              onClick={loadTeams}
              disabled={
                loadingTeams
              }
              className="px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-xs text-gray-400 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw
                size={13}
                className={
                  loadingTeams
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <main className="max-w-[1200px] mx-auto px-6 py-6">
        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* ==================================================
            STATS
        ================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
          <div className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-4">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users size={17} />
            </div>

            <p className="text-[10px] text-gray-600 mt-4">
              Total Teams
            </p>

            <p className="text-2xl font-bold mt-1">
              {loadingTeams
                ? "..."
                : teams.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-4">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CalendarDays
                size={17}
              />
            </div>

            <p className="text-[10px] text-gray-600 mt-4">
              Your Hackathons
            </p>

            <p className="text-2xl font-bold mt-1">
              {loadingTeams
                ? "..."
                : hackathons.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-4">
            <div className="w-9 h-9 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
              <Users size={17} />
            </div>

            <p className="text-[10px] text-gray-600 mt-4">
              Pending Teams
            </p>

            <p className="text-2xl font-bold mt-1">
              {loadingTeams
                ? "..."
                : teams.filter(
                    (team) =>
                      String(
                        team.status ||
                          ""
                      ).toUpperCase() ===
                      "PENDING"
                  ).length}
            </p>
          </div>
        </div>

        {/* ==================================================
            SEARCH
        ================================================== */}

        <div className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-4 mb-4">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
            />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search teams, leaders or hackathons..."
              className="w-full bg-[#08111F] border border-white/[0.08] rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-500/40"
            />
          </div>
        </div>

        {/* ==================================================
            TEAMS
        ================================================== */}

        <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="font-semibold text-sm">
              Registered Teams
            </h2>

            <p className="text-[10px] text-gray-600 mt-1">
              Teams registered across your
              hackathons.
            </p>
          </div>

          {/* LOADING */}

          {loadingTeams ? (
            <div className="px-5 py-16 text-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />

              <p className="text-xs text-gray-500 mt-4">
                Loading teams...
              </p>
            </div>
          ) : filteredTeams.length ===
            0 ? (
            /* ==================================================
               NO TEAMS
            ================================================== */

            <div className="px-5 py-16 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>

              <h3 className="text-sm font-semibold mt-4">
                No teams found
              </h3>

              <p className="text-xs text-gray-600 mt-2 max-w-sm mx-auto">
                {search
                  ? "No teams match your search."
                  : hackathons.length ===
                    0
                  ? "You haven't created any hackathons yet."
                  : "No teams have registered for your hackathons yet."}
              </p>

              {search && (
                <button
                  onClick={() =>
                    setSearch("")
                  }
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs transition"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            /* ==================================================
               TEAM TABLE
            ================================================== */

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.05] text-left">
                    <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                      Team
                    </th>

                    <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                      Hackathon
                    </th>

                    <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                      Leader
                    </th>

                    <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                      Members
                    </th>

                    <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                      Status
                    </th>

                    <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTeams.map(
                    (team) => {
                      const hackathon =
                        typeof team.hackathon ===
                        "object"
                          ? team.hackathon
                          : null;

                      return (
                        <tr
                          key={
                            team._id
                          }
                          className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition"
                        >
                          {/* TEAM */}

                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                                {team.name
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                  "T"}
                              </div>

                              <div>
                                <p className="text-xs font-medium">
                                  {team.name}
                                </p>

                                <p className="text-[9px] text-gray-600 mt-1">
                                  {team._id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* HACKATHON */}

                          <td className="px-5 py-3.5">
                            <div>
                              <p className="text-xs text-gray-300">
                                {hackathon?.name ||
                                  "Unknown Hackathon"}
                              </p>

                              <p className="text-[9px] text-gray-600 mt-1">
                                {hackathon?.hackathonId ||
                                  ""}
                              </p>
                            </div>
                          </td>

                          {/* LEADER */}

                          <td className="px-5 py-3.5">
                            <div>
                              <p className="text-xs text-gray-300">
                                {team
                                  .leader
                                  ?.name ||
                                  "Unknown"}
                              </p>

                              <p className="text-[9px] text-gray-600 mt-1">
                                {team
                                  .leader
                                  ?.email ||
                                  ""}
                              </p>
                            </div>
                          </td>

                          {/* MEMBERS */}

                          <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-300">
                              {team.members
                                ?.length ||
                                0}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full border text-[9px] font-medium ${getStatusClasses(
                                team.status
                              )}`}
                            >
                              {String(
                                team.status ||
                                  "PENDING"
                              ).toUpperCase()}
                            </span>
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-3.5">
                            <div className="flex justify-end">
                              <button
                                onClick={() =>
                                  router.push(
                                    `/organizer/hackathons/${
                                      hackathon?._id ||
                                      ""
                                    }/teams`
                                  )
                                }
                                title="View team"
                                className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                              >
                                <Eye
                                  size={
                                    14
                                  }
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}