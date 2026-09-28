"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Plus,
  Users,
  Gavel,
  FileText,
  Trophy,
  User,
  Settings,
  LogOut,
  Eye,
  Pencil,
  MoreVertical,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ClipboardCheck,
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
  description?: string;

  startDate: string;
  endDate: string;

  status: string;
  isPublished?: boolean;

  organizer?:
    | string
    | {
        _id: string;
        name?: string;
        email?: string;
      };

  createdAt?: string;

  // These are supported if your backend returns them.
  // They are NOT fake values.
  teamsCount?: number;
  teamCount?: number;

  evaluationsCount?: number;
  evaluationCount?: number;

  submissionsCount?: number;
  submissionCount?: number;

  judgesCount?: number;
  judgeCount?: number;
};

type Stats = {
  teams: number;
  judges: number;
  evaluations: number;
  submissions: number;
};

type DashboardResponse = {
  hackathons?: Hackathon[];
  data?: Hackathon[];

  stats?: {
    teams?: number;
    judges?: number;
    rounds?: number;
    evaluations?: number;
    submissions?: number;
  };
};

// ======================================================
// COMPONENT
// ======================================================

export default function OrganizerPage() {
  const router = useRouter();

  const { user, token, loading, logout } = useAuth();

  const [hackathons, setHackathons] = useState<Hackathon[]>([]);

  const [stats, setStats] = useState<Stats>({
    teams: 0,
    judges: 0,
    evaluations: 0,
    submissions: 0,
  });

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const [error, setError] = useState("");

  // ====================================================
  // AUTHENTICATION
  // ====================================================

  useEffect(() => {
    if (loading) return;

    if (!user || !token) {
      router.replace("/login");
      return;
    }

    const role = String(user.role || "").toUpperCase();

    if (role !== "ORGANIZER") {
      router.replace("/login");
    }
  }, [loading, user, token, router]);

  // ====================================================
  // LOAD DASHBOARD
  // ====================================================

  useEffect(() => {
    if (loading || !user || !token) return;

    const role = String(user.role || "").toUpperCase();

    if (role !== "ORGANIZER") return;

    loadDashboard();
  }, [loading, user, token]);

  const loadDashboard = async () => {
    try {
      setLoadingDashboard(true);
      setError("");

      const response: DashboardResponse =
        await apiRequest("/hackathons/organizer", {
          method: "GET",
          token,
        });

      const receivedHackathons =
        response?.hackathons ||
        response?.data ||
        [];

      const safeHackathons = Array.isArray(
        receivedHackathons
      )
        ? receivedHackathons
        : [];

      setHackathons(safeHackathons);

      setStats({
        teams: Number(response?.stats?.teams || 0),
        judges: Number(response?.stats?.judges || 0),
        evaluations: Number(
          response?.stats?.evaluations || 0
        ),
        submissions: Number(
          response?.stats?.submissions || 0
        ),
      });
    } catch (err: any) {
      console.error(
        "Failed to load organizer dashboard:",
        err
      );

      setError(
        err?.message ||
          "Failed to load organizer dashboard"
      );
    } finally {
      setLoadingDashboard(false);
    }
  };

  // ====================================================
  // LOGOUT
  // ====================================================

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  // ====================================================
  // NAVIGATION
  // ====================================================

  const go = (path: string) => {
    router.push(path);
  };

  const handleOpenHackathon = (id: string) => {
    if (!id) return;

    router.push(
      `/organizer/hackathons/${encodeURIComponent(id)}`
    );
  };

  // ====================================================
  // DATE HELPERS
  // ====================================================

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "-";
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateRange = (
    hackathon: Hackathon
  ) => {
    return `${formatDate(
      hackathon.startDate
    )} - ${formatDate(hackathon.endDate)}`;
  };

  // ====================================================
  // STATUS
  // ====================================================

  const getStatus = (hackathon: Hackathon) => {
    const status = String(
      hackathon.status || ""
    ).toUpperCase();

    switch (status) {
      case "ACTIVE":
        return "Ongoing";

      case "COMPLETED":
        return "Completed";

      case "UPCOMING":
        return "Upcoming";

      case "DRAFT":
      default:
        return "Draft";
    }
  };

  const getStatusClasses = (
    status: string
  ) => {
    switch (status) {
      case "Ongoing":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

      case "Completed":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";

      case "Upcoming":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";

      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  // ====================================================
  // RECENT HACKATHONS
  // ====================================================

  const recentHackathons = useMemo(() => {
    return [...hackathons]
      .sort((a, b) => {
        const dateA = new Date(
          a.createdAt || a.startDate
        ).getTime();

        const dateB = new Date(
          b.createdAt || b.startDate
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 4);
  }, [hackathons]);

  // ====================================================
  // ACTIVITY
  //
  // REAL DATA:
  // Number of hackathons created on each of the
  // previous seven days.
  // ====================================================

  const activityData = useMemo(() => {
    const now = new Date();

    const days = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(now);

        date.setHours(0, 0, 0, 0);

        date.setDate(
          now.getDate() - (6 - index)
        );

        return date;
      }
    );

    return days.map((day) => {
      const nextDay = new Date(day);

      nextDay.setDate(
        day.getDate() + 1
      );

      const count = hackathons.filter(
        (hackathon) => {
          const created = new Date(
            hackathon.createdAt ||
              hackathon.startDate
          );

          return (
            created >= day &&
            created < nextDay
          );
        }
      ).length;

      return {
        label: day.toLocaleDateString(
          "en-IN",
          {
            month: "short",
            day: "numeric",
          }
        ),
        value: count,
      };
    });
  }, [hackathons]);

  const maxActivity = Math.max(
    ...activityData.map(
      (item) => item.value
    ),
    1
  );

  // ====================================================
  // USER INITIAL
  // ====================================================

  const userInitial =
    user?.name?.charAt(0)?.toUpperCase() ||
    "O";

  // ====================================================
  // AUTH LOADING
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060D19] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />

          <p className="text-lg font-semibold mt-4">
            Loading...
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Checking authentication
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
    String(user.role || "").toUpperCase() !==
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
              router.replace("/login")
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
  // DASHBOARD
  // ====================================================

  return (
    <div className="min-h-screen bg-[#060D19] text-white flex">
      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="fixed left-0 top-0 bottom-0 w-[168px] bg-[#08111F] border-r border-white/[0.08] flex flex-col z-40">
        {/* LOGO */}

        <div className="h-[106px] px-4 flex items-center border-b border-white/[0.05]">
          <button
            onClick={() => go("/organizer")}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <span className="text-white font-bold text-sm">
                ⚖
              </span>
            </div>

            <span className="text-white font-bold text-lg">
              Fair<span className="text-blue-500">Judge</span>
            </span>
          </button>
        </div>

        {/* USER */}

        <div className="px-3 pt-4">
          <button
            onClick={() =>
              go("/organizer/profile")
            }
            className="w-full rounded-xl border border-white/[0.08] bg-[#0A1525] p-3 text-left hover:bg-white/[0.03] transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-semibold">
                {userInitial}
              </div>

              <div className="min-w-0">
                <p className="text-[8px] uppercase tracking-wider text-blue-400 font-semibold">
                  Organizer
                </p>

                <p className="text-xs font-medium truncate mt-1">
                  {user.name || "Organizer"}
                </p>

                <p className="text-[8px] text-gray-500 truncate mt-0.5">
                  {user.email || ""}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="px-3 mt-3 flex-1 overflow-y-auto">
          {/* DASHBOARD */}

          <button
            onClick={() =>
              go("/organizer")
            }
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium mb-1"
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>

          {/* HACKATHONS */}

          <div className="mt-5">
            <p className="px-2 text-[9px] uppercase tracking-wider text-gray-600 mb-2">
              Hackathons
            </p>

            <button
              onClick={() =>
                go("/organizer/hackathons")
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs transition"
            >
              <CalendarDays size={15} />
              My Hackathons
            </button>

            <button
              onClick={() =>
                go(
                  "/organizer/hackathons/create"
                )
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs transition"
            >
              <Plus size={15} />
              Create Hackathon
            </button>
          </div>

          {/* MANAGEMENT */}

          <div className="mt-5">
            <p className="px-2 text-[9px] uppercase tracking-wider text-gray-600 mb-2">
              Management
            </p>

            <button
              onClick={() =>
                go("/organizer/teams")
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs transition"
            >
              <Users size={15} />
              Teams
            </button>

            <button
              onClick={() =>
                go("/organizer/judges")
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs transition"
            >
              <Gavel size={15} />
              Judges
            </button>
          </div>

          {/* EVALUATION */}

          <div className="mt-5">
            <p className="px-2 text-[9px] uppercase tracking-wider text-gray-600 mb-2">
              Evaluation
            </p>

            <button
              onClick={() =>
                go("/organizer/submissions")
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs transition"
            >
              <FileText size={15} />
              Submissions
            </button>

            <button
              onClick={() =>
                go("/organizer/results")
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs transition"
            >
              <Trophy size={15} />
              Results
            </button>
          </div>

          {/* SETTINGS */}

          <div className="mt-5 pb-5">
            <p className="px-2 text-[9px] uppercase tracking-wider text-gray-600 mb-2">
              Settings
            </p>

            <button
              onClick={() =>
                go("/organizer/profile")
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs transition"
            >
              <User size={15} />
              Profile
            </button>

            <button
              onClick={() =>
                go("/organizer/settings")
              }
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs transition"
            >
              <Settings size={15} />
              Settings
            </button>
          </div>
        </nav>

        {/* LOGOUT */}

        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/15 text-xs transition"
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* ==================================================
          MAIN AREA
      ================================================== */}

      <div className="ml-[168px] flex-1 min-w-0">
        {/* ==================================================
            TOP BAR
        ================================================== */}

        <div className="h-[46px] border-b border-white/[0.06] bg-[#060D19] flex items-center justify-between px-5">
          <p className="text-[9px] uppercase tracking-[0.18em] text-blue-400 font-semibold">
            Organizer Dashboard
          </p>

          <div className="flex items-center gap-3">
            <button className="text-gray-500 hover:text-white transition">
              <Bell size={15} />
            </button>

            <button
              onClick={() =>
                go("/organizer/profile")
              }
              className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-xs font-semibold"
            >
              {userInitial}
            </button>

            <ChevronDown
              size={13}
              className="text-gray-600"
            />
          </div>
        </div>

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="border-b border-white/[0.06] bg-[#060D19]">
          <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                Welcome back,{" "}
                {user.name || "Organizer"} 👋
              </h1>

              <p className="text-xs text-gray-500 mt-1">
                Here's what's happening with your
                hackathons.
              </p>
            </div>

            <button
              onClick={() =>
                go(
                  "/organizer/hackathons/create"
                )
              }
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-medium text-xs flex items-center gap-2"
            >
              <Plus size={14} />
              Create Hackathon
            </button>
          </div>
        </header>

        {/* ==================================================
            MAIN CONTENT
        ================================================== */}

        <main className="max-w-[1200px] mx-auto px-6 py-5">
          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 mb-4">
            {/* HACKATHONS */}

            <StatCard
              icon={
                <CalendarDays size={17} />
              }
              iconClass="bg-purple-500/10 text-purple-400"
              title="Total Hackathons"
              value={
                loadingDashboard
                  ? "..."
                  : hackathons.length
              }
            />

            {/* TEAMS */}

            <StatCard
              icon={<Users size={17} />}
              iconClass="bg-blue-500/10 text-blue-400"
              title="Total Teams"
              value={
                loadingDashboard
                  ? "..."
                  : stats.teams
              }
            />

            {/* SUBMISSIONS */}

            <StatCard
              icon={
                <ClipboardCheck size={17} />
              }
              iconClass="bg-emerald-500/10 text-emerald-400"
              title="Total Submissions"
              value={
                loadingDashboard
                  ? "..."
                  : stats.submissions
              }
            />

            {/* JUDGES */}

            <StatCard
              icon={<Gavel size={17} />}
              iconClass="bg-orange-500/10 text-orange-400"
              title="Total Judges"
              value={
                loadingDashboard
                  ? "..."
                  : stats.judges
              }
            />
          </div>

          {/* ==================================================
              OVERVIEW + RECENT
          ================================================== */}

          <div className="grid grid-cols-1 xl:grid-cols-[1.65fr_1fr] gap-3.5 mb-4">
            {/* OVERVIEW */}

            <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-sm">
                    Hackathon Overview
                  </h2>

                  <p className="text-[10px] text-gray-600 mt-1">
                    Hackathons created during the last
                    7 days
                  </p>
                </div>

                <span className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] text-[10px] text-gray-500">
                  Activity
                </span>
              </div>

              <div className="p-5">
                <div className="h-[205px] relative">
                  {/* GRID */}

                  <div className="absolute inset-0 flex flex-col justify-between">
                    {[0, 1, 2, 3, 4].map(
                      (line) => (
                        <div
                          key={line}
                          className="border-t border-white/[0.05]"
                        />
                      )
                    )}
                  </div>

                  {/* SVG GRAPH */}

                  <svg
                    className="absolute inset-0 w-full h-full overflow-visible"
                    viewBox="0 0 700 205"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="areaGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3B82F6"
                          stopOpacity="0.28"
                        />

                        <stop
                          offset="100%"
                          stopColor="#3B82F6"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>

                    {(() => {
                      const width = 700;
                      const height = 205;

                      const points =
                        activityData.map(
                          (item, index) => {
                            const x =
                              (index /
                                Math.max(
                                  activityData.length -
                                    1,
                                  1
                                )) *
                              width;

                            const y =
                              height -
                              (item.value /
                                maxActivity) *
                                170 -
                              10;

                            return {
                              x,
                              y,
                            };
                          }
                        );

                      const linePath =
                        points
                          .map(
                            (point, index) =>
                              `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
                          )
                          .join(" ");

                      const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;

                      return (
                        <>
                          <path
                            d={areaPath}
                            fill="url(#areaGradient)"
                          />

                          <path
                            d={linePath}
                            fill="none"
                            stroke="#3B82F6"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                          />

                          {points.map(
                            (
                              point,
                              index
                            ) => (
                              <circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r="3"
                                fill="#3B82F6"
                              />
                            )
                          )}
                        </>
                      );
                    })()}
                  </svg>

                  {/* Y AXIS */}

                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[9px] text-gray-700">
                    <span>
                      {maxActivity}
                    </span>

                    <span>
                      {Math.round(
                        maxActivity * 0.75
                      )}
                    </span>

                    <span>
                      {Math.round(
                        maxActivity * 0.5
                      )}
                    </span>

                    <span>
                      {Math.round(
                        maxActivity * 0.25
                      )}
                    </span>

                    <span>0</span>
                  </div>
                </div>

                {/* X AXIS */}

                <div className="ml-7 flex justify-between mt-3">
                  {activityData.map(
                    (item) => (
                      <span
                        key={item.label}
                        className="text-[9px] text-gray-600"
                      >
                        {item.label}
                      </span>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* RECENT */}

            <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="font-semibold text-sm">
                  Recent Hackathons
                </h2>

                <button
                  onClick={() =>
                    go(
                      "/organizer/hackathons"
                    )
                  }
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                >
                  View All
                </button>
              </div>

              {loadingDashboard ? (
                <div className="p-8 text-center text-xs text-gray-600">
                  Loading...
                </div>
              ) : recentHackathons.length ===
                0 ? (
                <div className="p-8 text-center">
                  <p className="text-xs text-gray-600">
                    No hackathons yet.
                  </p>

                  <button
                    onClick={() =>
                      go(
                        "/organizer/hackathons/create"
                      )
                    }
                    className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs"
                  >
                    Create Hackathon
                  </button>
                </div>
              ) : (
                <div>
                  {recentHackathons.map(
                    (hackathon) => {
                      const status =
                        getStatus(
                          hackathon
                        );

                      return (
                        <button
                          key={
                            hackathon._id
                          }
                          onClick={() =>
                            handleOpenHackathon(
                              hackathon._id
                            )
                          }
                          className="w-full px-5 py-3.5 border-b border-white/[0.05] last:border-0 flex items-center gap-3 text-left hover:bg-white/[0.025] transition"
                        >
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                            H
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">
                              {
                                hackathon.name
                              }
                            </p>

                            <p className="text-[9px] text-gray-600 mt-1">
                              {formatDate(
                                hackathon.startDate
                              )}{" "}
                              -{" "}
                              {formatDate(
                                hackathon.endDate
                              )}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 px-2 py-1 rounded-md border text-[9px] ${getStatusClasses(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ==================================================
              ALL HACKATHONS
          ================================================== */}

          <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm">
                  All Hackathons
                </h2>

                <p className="text-[10px] text-gray-600 mt-1">
                  Manage your active and upcoming events.
                </p>
              </div>

              <button
                onClick={() =>
                  go(
                    "/organizer/hackathons"
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-[10px] transition"
              >
                View All Hackathons
              </button>
            </div>

            {loadingDashboard ? (
              <div className="px-5 py-14 text-center text-gray-600 text-xs">
                Loading your hackathons...
              </div>
            ) : hackathons.length ===
              0 ? (
              <div className="px-5 py-14 text-center">
                <p className="text-gray-600 text-xs">
                  You haven't created any
                  hackathons yet.
                </p>

                <button
                  onClick={() =>
                    go(
                      "/organizer/hackathons/create"
                    )
                  }
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs"
                >
                  Create Your First Hackathon
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.05] text-left">
                      <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                        Hackathon
                      </th>

                      <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                        Dates
                      </th>

                      <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                        Teams
                      </th>

                      <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                        Evaluations
                      </th>

                      <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium">
                        Status
                      </th>

                      <th className="px-5 py-3 text-[9px] uppercase tracking-wider text-gray-600 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {hackathons.map(
                      (hackathon) => {
                        const status =
                          getStatus(
                            hackathon
                          );

                        const teamCount =
                          hackathon.teamsCount ??
                          hackathon.teamCount;

                        const evaluationCount =
                          hackathon.evaluationsCount ??
                          hackathon.evaluationCount;

                        return (
                          <tr
                            key={
                              hackathon._id
                            }
                            className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition"
                          >
                            {/* HACKATHON */}

                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                                  H
                                </div>

                                <div>
                                  <p className="text-xs font-medium">
                                    {
                                      hackathon.name
                                    }
                                  </p>

                                  <p className="text-[9px] text-gray-600 mt-1">
                                    {hackathon.hackathonId ||
                                      hackathon._id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* DATES */}

                            <td className="px-5 py-3.5">
                              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                {formatDateRange(
                                  hackathon
                                )}
                              </span>
                            </td>

                            {/* TEAMS */}

                            <td className="px-5 py-3.5">
                              <span className="text-xs text-gray-300">
                                {teamCount ??
                                  "—"}
                              </span>
                            </td>

                            {/* EVALUATIONS */}

                            <td className="px-5 py-3.5">
                              <span className="text-xs text-gray-300">
                                {evaluationCount ??
                                  "—"}
                              </span>
                            </td>

                            {/* STATUS */}

                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex px-2 py-1 rounded-full border text-[9px] font-medium ${getStatusClasses(
                                  status
                                )}`}
                              >
                                {status}
                              </span>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-5 py-3.5">
                              <div className="flex justify-end items-center gap-1">
                                <button
                                  title="View"
                                  onClick={() =>
                                    handleOpenHackathon(
                                      hackathon._id
                                    )
                                  }
                                  className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                                >
                                  <Eye
                                    size={
                                      14
                                    }
                                  />
                                </button>

                                <button
                                  title="Edit"
                                  onClick={() =>
                                    handleOpenHackathon(
                                      hackathon._id
                                    )
                                  }
                                  className="p-1.5 rounded-md text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition"
                                >
                                  <Pencil
                                    size={
                                      14
                                    }
                                  />
                                </button>

                                <button
                                  title="More"
                                  onClick={() =>
                                    handleOpenHackathon(
                                      hackathon._id
                                    )
                                  }
                                  className="p-1.5 rounded-md text-gray-500 hover:text-white hover:bg-white/5 transition"
                                >
                                  <MoreVertical
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

          {/* ==================================================
              BOTTOM CARDS
          ================================================== */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
            {/* TEAMS */}

            <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs">
                  Top Teams
                </h3>

                <Users
                  size={15}
                  className="text-blue-400"
                />
              </div>

              <p className="text-2xl font-bold mt-5">
                {stats.teams}
              </p>

              <p className="text-[10px] text-gray-600 mt-1">
                Teams registered across your
                hackathons
              </p>

              <button
                onClick={() =>
                  go("/organizer/teams")
                }
                className="mt-4 text-[10px] text-blue-400 hover:text-blue-300"
              >
                View Teams →
              </button>
            </section>

            {/* JUDGES */}

            <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs">
                  Top Judges
                </h3>

                <Gavel
                  size={15}
                  className="text-purple-400"
                />
              </div>

              <p className="text-2xl font-bold mt-5">
                {stats.judges}
              </p>

              <p className="text-[10px] text-gray-600 mt-1">
                Judges assigned to your
                hackathons
              </p>

              <button
                onClick={() =>
                  go("/organizer/judges")
                }
                className="mt-4 text-[10px] text-blue-400 hover:text-blue-300"
              >
                View Judges →
              </button>
            </section>

            {/* QUICK ACTIONS */}

            <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-5">
              <h3 className="font-semibold text-xs">
                Quick Actions
              </h3>

              <div className="grid grid-cols-2 gap-2 mt-5">
                <button
                  onClick={() =>
                    go(
                      "/organizer/hackathons/create"
                    )
                  }
                  className="px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-[10px] text-gray-400 transition"
                >
                  + Create
                </button>

                <button
                  onClick={() =>
                    go(
                      "/organizer/hackathons"
                    )
                  }
                  className="px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-[10px] text-gray-400 transition"
                >
                  Hackathons
                </button>

                <button
                  onClick={() =>
                    go("/organizer/teams")
                  }
                  className="px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-[10px] text-gray-400 transition"
                >
                  Teams
                </button>

                <button
                  onClick={() =>
                    go("/organizer/judges")
                  }
                  className="px-3 py-2 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-[10px] text-gray-400 transition"
                >
                  Judges
                </button>
              </div>
            </section>
          </div>

          {/* ==================================================
              FOOTER LOGOUT
          ================================================== */}

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 text-[10px] transition flex items-center gap-2"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

// ======================================================
// STAT CARD
// ======================================================

function StatCard({
  icon,
  iconClass,
  title,
  value,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-4">
      <div className="flex items-start justify-between">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconClass}`}
        >
          {icon}
        </div>

        <ArrowUpRight
          size={13}
          className="text-emerald-400"
        />
      </div>

      <p className="text-[10px] text-gray-600 mt-4">
        {title}
      </p>

      <p className="text-2xl font-bold mt-1">
        {value}
      </p>
    </div>
  );
}