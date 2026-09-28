"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  Rocket,
  ClipboardCheck,
  LogOut,
  ChevronRight,
  Copy,
  Check,
  Plus,
  X,
  CalendarDays,
  UserCircle,
  Menu,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";

// =====================================================
// TYPES
// =====================================================

type TeamMember = {
  name: string;
  email: string;
  role: string;
};

type Team = {
  _id: string;

  // Public Team ID
  // Example: TEAM-A7F29C
  teamId?: string;

  name: string;

  hackathon: any;

  leader:
    | string
    | {
        _id: string;
        name: string;
        email: string;
        role: string;
      };

  members: TeamMember[];

  project?: {
    _id: string;
    projectName: string;
    status?: string;
  } | null;

  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | string;

  rejectionReason?: string;
};

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

  status:
    | "DRAFT"
    | "SUBMITTED"
    | "LOCKED";

  submittedAt?: string | null;

  lockedAt?: string | null;

  createdAt?: string;

  updatedAt?: string;
};

type Hackathon = {
  _id: string;

  hackathonId?: string;

  name: string;

  description?: string;

  startDate?: string;

  endDate?: string;

  status?: string;

  isPublished?: boolean;
};

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
// PAGE
// =====================================================

export default function TeamDashboard() {
  const router = useRouter();

  const {
    user,
    logout,
    token,
    loading: authLoading,
  } = useAuth();

  // ===================================================
  // SIDEBAR
  // ===================================================

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // ===================================================
  // HACKATHON
  // ===================================================

  const [hackathonId, setHackathonId] =
    useState("");

  const [hackathon, setHackathon] =
    useState<Hackathon | null>(null);

  const [hackathonLoading, setHackathonLoading] =
    useState(false);

  // ===================================================
  // CHANGE HACKATHON
  // ===================================================

  const [showJoinHackathon, setShowJoinHackathon] =
    useState(false);

  const [joinHackathonInput, setJoinHackathonInput] =
    useState("");

  const [joinHackathonLoading, setJoinHackathonLoading] =
    useState(false);

  const [joinHackathonError, setJoinHackathonError] =
    useState("");

  // ===================================================
  // TEAM
  // ===================================================

  const [team, setTeam] =
    useState<Team | null>(null);

  const [teamLoading, setTeamLoading] =
    useState(true);

  const [teamActionLoading, setTeamActionLoading] =
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
  // JOIN TEAM
  // ===================================================

  const [showJoinTeam, setShowJoinTeam] =
    useState(false);

  const [joinTeamId, setJoinTeamId] =
    useState("");

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

  const [projectError, setProjectError] =
    useState("");

  // ===================================================
  // MESSAGE
  // ===================================================

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "success" | "error" | "info"
    >("info");

  // ===================================================
  // COPY
  // ===================================================

  const [copiedTeamId, setCopiedTeamId] =
    useState(false);

  // ===================================================
  // LOAD SAVED HACKATHON
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
  // SAVE HACKATHON
  // ===================================================

  useEffect(() => {
    const cleanId =
      hackathonId
        .trim()
        .toUpperCase();

    if (cleanId) {
      localStorage.setItem(
        "fairjudge_hackathon",
        cleanId
      );
    }
  }, [hackathonId]);

  // ===================================================
  // LOAD HACKATHON
  // ===================================================

  useEffect(() => {
    const loadHackathon =
      async () => {
        const publicId =
          hackathonId
            .trim()
            .toUpperCase();

        if (!publicId) {
          setHackathon(null);
          setHackathonLoading(false);
          return;
        }

        try {
          setHackathonLoading(true);

          const response =
            await apiRequest(
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

          if (
            response?.success &&
            response?.hackathon
          ) {
            setHackathon(
              response.hackathon
            );
          } else {
            setHackathon(null);
          }
        } catch (error) {
          console.error(
            "Load hackathon error:",
            error
          );

          setHackathon(null);
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
    const loadTeam =
      async () => {
        const publicId =
          hackathonId
            .trim()
            .toUpperCase();

        if (
          authLoading ||
          !token ||
          !publicId
        ) {
          if (!authLoading) {
            setTeamLoading(false);
          }

          return;
        }

        try {
          setTeamLoading(true);

          const response =
            await apiRequest(
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

          setTeam(
            response?.team ||
              null
          );
        } catch (error) {
          console.error(
            "Load team error:",
            error
          );

          setTeam(null);
        } finally {
          setTeamLoading(false);
        }
      };

    loadTeam();
  }, [
    token,
    hackathonId,
    authLoading,
  ]);

  // ===================================================
  // LOAD MY PROJECT
  // ===================================================

  useEffect(() => {
    const loadProject =
      async () => {
        const publicId =
          hackathonId
            .trim()
            .toUpperCase();

        if (
          authLoading ||
          !token ||
          !publicId ||
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
                publicId
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

          setProject(
            response?.project ||
              null
          );
        } catch (error) {
          console.log(
            "Project not submitted yet:",
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
    authLoading,
  ]);

  // ===================================================
  // CHANGE HACKATHON
  // ===================================================

  const handleHackathonChange = (
    value: string
  ) => {
    const formatted =
      value
        .toUpperCase()
        .replace(/\s+/g, "");

    setHackathonId(
      formatted
    );

    setHackathon(null);
    setTeam(null);
    setProject(null);

    setMessage("");
    setMessageType(
      "info"
    );
  };

  // ===================================================
  // OPEN JOIN ANOTHER HACKATHON
  // ===================================================

  const openJoinAnotherHackathon =
    () => {
      setJoinHackathonInput("");
      setJoinHackathonError("");
      setShowJoinHackathon(true);
      setSidebarOpen(false);
    };

  // ===================================================
  // SWITCH HACKATHON
  // ===================================================

  const handleJoinAnotherHackathon =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setJoinHackathonError("");

      const publicId =
        joinHackathonInput
          .trim()
          .toUpperCase();

      if (!publicId) {
        setJoinHackathonError(
          "Please enter a Hackathon ID."
        );

        return;
      }

      setJoinHackathonLoading(
        true
      );

      try {
        const response =
          await apiRequest(
            `/hackathons/public/${encodeURIComponent(
              publicId
            )}`,
            {
              method: "GET",
            }
          );

        if (
          !response?.success ||
          !response?.hackathon
        ) {
          throw new Error(
            "Hackathon not found."
          );
        }

        handleHackathonChange(
          publicId
        );

        setShowJoinHackathon(
          false
        );

        setMessage(
          `Switched to ${response.hackathon.name}.`
        );

        setMessageType(
          "success"
        );
      } catch (error) {
        console.error(
          "Join another hackathon error:",
          error
        );

        setJoinHackathonError(
          error instanceof Error
            ? error.message
            : "Hackathon not found."
        );
      } finally {
        setJoinHackathonLoading(
          false
        );
      }
    };

  // ===================================================
  // CREATE TEAM
  // ===================================================

  const handleCreateTeam =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setMessage("");

      if (!token) {
        setMessage(
          "Authentication required. Please log in again."
        );

        setMessageType(
          "error"
        );

        return;
      }

      const publicHackathonId =
        hackathonId
          .trim()
          .toUpperCase();

      if (!publicHackathonId) {
        setMessage(
          "Please enter a Hackathon ID."
        );

        setMessageType(
          "error"
        );

        return;
      }

      if (!hackathon) {
        setMessage(
          "Please enter a valid Hackathon ID."
        );

        setMessageType(
          "error"
        );

        return;
      }

      if (!teamName.trim()) {
        setMessage(
          "Please enter a team name."
        );

        setMessageType(
          "error"
        );

        return;
      }

      setTeamActionLoading(
        true
      );

      try {
        const response =
          await apiRequest(
            "/teams",
            {
              method: "POST",

              token,

              body: {
                hackathon:
                  publicHackathonId,

                name:
                  teamName.trim(),

                members:
                  members
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
                          member.role
                            ?.trim() ||
                          "Member",
                      })
                    ),
              },
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
              "Failed to create team."
          );
        }

        setTeam(
          response.team ||
            null
        );

        setShowCreateTeam(
          false
        );

        setTeamName("");
        setMembers([]);

        setMessage(
          response.message ||
            "Team created successfully. Waiting for organizer approval."
        );

        setMessageType(
          "success"
        );
      } catch (error) {
        console.error(
          "Create team error:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to create team."
        );

        setMessageType(
          "error"
        );
      } finally {
        setTeamActionLoading(
          false
        );
      }
    };

  // ===================================================
  // JOIN TEAM
  // ===================================================

  const handleJoinTeam =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setMessage("");

      if (!token) {
        setMessage(
          "Authentication required. Please log in again."
        );

        setMessageType(
          "error"
        );

        return;
      }

      if (!hackathon) {
        setMessage(
          "Please enter a valid Hackathon ID."
        );

        setMessageType(
          "error"
        );

        return;
      }

      const publicHackathonId =
        hackathonId
          .trim()
          .toUpperCase();

      const publicTeamId =
        joinTeamId
          .trim()
          .toUpperCase();

      if (!publicTeamId) {
        setMessage(
          "Please enter the Team ID."
        );

        setMessageType(
          "error"
        );

        return;
      }

      setTeamActionLoading(
        true
      );

      try {
        const response =
          await apiRequest(
            "/teams/join",
            {
              method: "POST",

              token,

              body: {
                hackathon:
                  publicHackathonId,

                teamId:
                  publicTeamId,
              },
            }
          );

        console.log(
          "Join team response:",
          response
        );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to join team."
          );
        }

        setTeam(
          response.team ||
            null
        );

        setShowJoinTeam(
          false
        );

        setJoinTeamId("");

        setMessage(
          response.message ||
            "You joined the team successfully."
        );

        setMessageType(
          "success"
        );
      } catch (error) {
        console.error(
          "Join team error:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to join team."
        );

        setMessageType(
          "error"
        );
      } finally {
        setTeamActionLoading(
          false
        );
      }
    };

  // ===================================================
  // LEAVE HACKATHON
  // ===================================================

  const handleLeaveHackathon =
    async () => {
      if (!token) {
        setMessage(
          "Authentication required. Please log in again."
        );

        setMessageType(
          "error"
        );

        return;
      }

      if (!hackathonId.trim()) {
        setMessage(
          "No hackathon is currently selected."
        );

        setMessageType(
          "error"
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Are you sure you want to leave ${
            hackathon?.name ||
            "this hackathon"
          }?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setTeamActionLoading(
          true
        );

        setMessage("");

        const response =
          await apiRequest(
            "/teams/leave-hackathon",
            {
              method: "POST",

              token,

              body: {
                hackathon:
                  hackathonId
                    .trim()
                    .toUpperCase(),
              },
            }
          );

        if (
          !response?.success
        ) {
          throw new Error(
            response?.message ||
              "Failed to leave hackathon."
          );
        }

        // Clear team/project state
        setTeam(null);
        setProject(null);

        setMessage(
          response.message ||
            "You left the hackathon successfully."
        );

        setMessageType(
          "success"
        );
      } catch (error) {
        console.error(
          "Leave hackathon error:",
          error
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Failed to leave hackathon."
        );

        setMessageType(
          "error"
        );
      } finally {
        setTeamActionLoading(
          false
        );
      }
    };

  // ===================================================
  // ADD MEMBER
  // ===================================================

  const addMember = () => {
    setMembers(
      (previous) => [
        ...previous,
        {
          name: "",
          email: "",
          role: "Member",
        },
      ]
    );
  };

  // ===================================================
  // REMOVE MEMBER
  // ===================================================

  const removeMember = (
    index: number
  ) => {
    setMembers(
      (previous) =>
        previous.filter(
          (_, memberIndex) =>
            memberIndex !==
            index
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
    setMembers(
      (previous) => {
        const updated =
          [...previous];

        updated[index] = {
          ...updated[index],
          [field]: value,
        };

        return updated;
      }
    );
  };

  // ===================================================
  // OPEN CREATE TEAM
  // ===================================================

  const openCreateTeam = () => {
    setMessage("");

    if (!hackathon) {
      setMessage(
        "Enter a valid Hackathon ID first."
      );

      setMessageType(
        "error"
      );

      return;
    }

    setShowCreateTeam(
      true
    );

    setSidebarOpen(false);
  };

  // ===================================================
  // OPEN JOIN TEAM
  // ===================================================

  const openJoinTeam = () => {
    setMessage("");

    if (!hackathon) {
      setMessage(
        "Enter a valid Hackathon ID first."
      );

      setMessageType(
        "error"
      );

      return;
    }

    setShowJoinTeam(
      true
    );

    setSidebarOpen(false);
  };

  // ===================================================
  // UPDATE PROJECT FIELD
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
    setProjectError("");

    if (!team) {
      setProjectError(
        "Create or join a team first."
      );

      return;
    }

    if (
      team.status !==
      "APPROVED"
    ) {
      setProjectError(
        team.status ===
        "PENDING"
          ? "Your team is waiting for organizer approval."
          : "This team has been rejected and cannot submit a project."
      );

      return;
    }

    if (project) {
      setProjectError(
        "This team already has a submitted project."
      );

      return;
    }

    setProjectForm(
      initialProjectForm
    );

    setShowProjectModal(
      true
    );
  };

  // ===================================================
  // SUBMIT PROJECT
  // ===================================================

  const handleSubmitProject =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setProjectError("");

      if (!token) {
        setProjectError(
          "Authentication required. Please log in again."
        );

        return;
      }

      if (!team) {
        setProjectError(
          "Create or join a team first."
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

      if (project) {
        setProjectError(
          "This team already has a project."
        );

        return;
      }

      const projectName =
        projectForm.projectName.trim();

      const problemStatement =
        projectForm.problemStatement.trim();

      const solution =
        projectForm.solution.trim();

      const technologyStack =
        projectForm.technologyStack.trim();

      if (!projectName) {
        setProjectError(
          "Project name is required."
        );

        return;
      }

      if (!problemStatement) {
        setProjectError(
          "Problem statement is required."
        );

        return;
      }

      if (!solution) {
        setProjectError(
          "Solution is required."
        );

        return;
      }

      if (!technologyStack) {
        setProjectError(
          "Technology stack is required."
        );

        return;
      }

      setProjectSubmitting(
        true
      );

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

                projectName,

                problemStatement,

                solution,

                technologyStack,

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

        setProject(
          response.project ||
            null
        );

        setTeam(
          (previous) =>
            previous
              ? {
                  ...previous,
                  project:
                    response.project
                      ? {
                          _id:
                            response.project
                              ._id,
                          projectName:
                            response.project
                              .projectName,
                          status:
                            response.project
                              .status,
                        }
                      : previous.project,
                }
              : previous
        );

        setShowProjectModal(
          false
        );

        setProjectForm(
          initialProjectForm
        );

        setMessage(
          "Project submitted successfully."
        );

        setMessageType(
          "success"
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
  // COPY TEAM ID
  // ===================================================

  const copyTeamId = async () => {
    if (!team?.teamId) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        team.teamId
      );

      setCopiedTeamId(
        true
      );

      window.setTimeout(
        () => {
          setCopiedTeamId(
            false
          );
        },
        2000
      );
    } catch (error) {
      console.error(
        "Copy Team ID error:",
        error
      );

      setMessage(
        "Unable to copy Team ID."
      );

      setMessageType(
        "error"
      );
    }
  };

  // ===================================================
  // LOGOUT
  // ===================================================

  const handleLogout = () => {
    setSidebarOpen(
      false
    );

    logout();

    router.replace(
      "/login"
    );
  };

  // ===================================================
  // SCROLL
  // ===================================================

  const goToSection = (
    id: string
  ) => {
    setSidebarOpen(
      false
    );

    const element =
      document.getElementById(
        id
      );

    if (element) {
      element.scrollIntoView({
        behavior:
          "smooth",
        block:
          "start",
      });
    }
  };

  // ===================================================
  // STATUS CLASSES
  // ===================================================

  const getTeamStatusClass =
    (
      status?: string
    ) => {
      switch (
        String(
          status || ""
        ).toUpperCase()
      ) {
        case "APPROVED":
          return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";

        case "REJECTED":
          return "border-red-500/20 bg-red-500/10 text-red-400";

        default:
          return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
      }
    };

  const getProjectStatusClass =
    (
      status?: string
    ) => {
      switch (
        String(
          status || ""
        ).toUpperCase()
      ) {
        case "SUBMITTED":
          return "border-blue-500/20 bg-blue-500/10 text-blue-400";

        case "LOCKED":
          return "border-purple-500/20 bg-purple-500/10 text-purple-400";

        case "DRAFT":
          return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";

        default:
          return "border-slate-700 bg-slate-800 text-slate-400";
      }
    };

  // ===================================================
  // USER INITIAL
  // ===================================================

  const userInitial =
    user?.name
      ?.charAt(0)
      ?.toUpperCase() ||
    "P";

  // ===================================================
  // AVOID DUPLICATE LEADER
  // ===================================================

  const displayedMembers =
    team
      ? (
          team.members ||
          []
        ).filter(
          (member) => {
            if (
              typeof team.leader !==
              "object"
            ) {
              return true;
            }

            return (
              member.email
                .trim()
                .toLowerCase() !==
              team.leader.email
                .trim()
                .toLowerCase()
            );
          }
        )
      : [];

  // ===================================================
  // AUTH LOADING
  // ===================================================

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050B16] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p className="mt-4 text-sm text-slate-400">
            Restoring your session...
          </p>
        </div>
      </main>
    );
  }

  // ===================================================
  // NO AUTH
  // ===================================================

  if (!token || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050B16] text-white">
        <div className="text-center">
          <p className="text-slate-400">
            Redirecting to login...
          </p>
        </div>
      </main>
    );
  }

  // ===================================================
  // MAIN PAGE
  // ===================================================

  return (
    <main className="min-h-screen bg-[#050B16] text-white">

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setSidebarOpen(
              false
            )
          }
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[250px] flex-col border-r border-white/[0.06] bg-[#08111F] transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* LOGO */}

        <div className="flex h-[78px] items-center justify-between border-b border-white/[0.06] px-5">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <span className="text-lg">
                ⚖
              </span>
            </div>

            <div>
              <p className="text-base font-bold">
                Fair
                <span className="text-blue-500">
                  Judge
                </span>
              </p>

              <p className="text-[10px] text-slate-500">
                Participant Portal
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
            className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>

        </div>

        {/* USER CARD */}

        <div className="px-4 py-4">

          <div className="rounded-2xl border border-white/[0.07] bg-[#0A1525] p-3">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-bold">
                {userInitial}
              </div>

              <div className="min-w-0">

                <p className="text-xs font-semibold text-blue-400">
                  PARTICIPANT
                </p>

                <p className="mt-1 truncate text-sm font-medium">
                  {user.name ||
                    "Participant"}
                </p>

                <p className="truncate text-[10px] text-slate-500">
                  {user.email}
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 overflow-y-auto px-3">

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
            Navigation
          </p>

          <button
            type="button"
            onClick={() =>
              goToSection(
                "top"
              )
            }
            className="mb-1 flex w-full items-center gap-3 rounded-xl bg-blue-600/15 px-3 py-3 text-left text-sm font-medium text-blue-400 transition hover:bg-blue-600/20"
          >
            <LayoutDashboard size={17} />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              goToSection(
                "team-section"
              )
            }
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <Users size={17} />
            My Team
          </button>

          <button
            type="button"
            onClick={() =>
              goToSection(
                "project-section"
              )
            }
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <Rocket size={17} />
            My Project
          </button>

          <button
            type="button"
            onClick={() =>
              goToSection(
                "evaluation-section"
              )
            }
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
          >
            <ClipboardCheck size={17} />
            Evaluation
          </button>

          {/* HACKATHON */}

          <div className="mt-7">

            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              Hackathon
            </p>

            <button
              type="button"
              onClick={
                openJoinAnotherHackathon
              }
              className="mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
            >

              <span className="flex items-center gap-3">
                <CalendarDays size={17} />
                Join Another
              </span>

              <Plus size={15} />

            </button>

            <button
              type="button"
              onClick={
                handleLeaveHackathon
              }
              disabled={
                !hackathon ||
                teamActionLoading
              }
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogOut size={17} />
              Leave Hackathon
            </button>

          </div>

          {/* TEAM ACTIONS */}

          <div className="mt-7">

            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              Team Actions
            </p>

            <button
              type="button"
              onClick={
                openCreateTeam
              }
              disabled={
                Boolean(team)
              }
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={17} />
              Create Team
            </button>

            <button
              type="button"
              onClick={
                openJoinTeam
              }
              disabled={
                Boolean(team)
              }
              className="mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Users size={17} />
              Join Existing Team
            </button>

          </div>

        </nav>

        {/* ACCOUNT */}

        <div className="border-t border-white/[0.06] p-3">

          <div className="mb-2 rounded-xl bg-[#0A1525] px-3 py-2">

            <div className="flex items-center gap-2">

              <UserCircle
                size={16}
                className="text-slate-500"
              />

              <p className="text-xs text-slate-500">
                Account
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="flex w-full items-center gap-3 rounded-xl bg-red-500/10 px-3 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/15"
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN AREA
      ================================================= */}

      <div
        id="top"
        className="min-h-screen lg:pl-[250px]"
      >

        {/* TOP BAR */}

        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#050B16]/95 backdrop-blur">

          <div className="flex h-[68px] items-center justify-between px-4 sm:px-6 lg:px-8">

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(
                    true
                  )
                }
                className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:text-white lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="hidden sm:block">

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400">
                  Participant Dashboard
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Manage your hackathon journey
                </p>

              </div>

              <div className="sm:hidden">

                <p className="text-sm font-bold">
                  Fair
                  <span className="text-blue-500">
                    Judge
                  </span>
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              {hackathon && (
                <button
                  type="button"
                  onClick={
                    openJoinAnotherHackathon
                  }
                  className="hidden items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500/30 hover:text-white sm:flex"
                >
                  <CalendarDays
                    size={14}
                  />
                  Change Hackathon
                </button>
              )}

              <div className="hidden text-right md:block">

                <p className="text-xs font-medium">
                  {user.name ||
                    "Participant"}
                </p>

                <p className="text-[10px] text-slate-500">
                  {user.email}
                </p>

              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold">
                {userInitial}
              </div>

            </div>

          </div>

        </header>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">

          {/* WELCOME */}

          <section className="mb-8">

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              PARTICIPANT AREA
            </p>

            <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">

              <div>

                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Welcome,{" "}
                  {user.name ||
                    "Participant"}{" "}
                  👋
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                  Manage your team, project and
                  evaluation progress from one place.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  openJoinAnotherHackathon
                }
                className="flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold transition hover:bg-blue-500"
              >
                <Plus size={16} />
                Join Another Hackathon
              </button>

            </div>

          </section>

          {/* MESSAGE */}

          {message && (
            <div
              className={`mb-7 rounded-xl border p-4 text-sm ${
                messageType ===
                "success"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : messageType ===
                    "error"
                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                  : "border-blue-500/20 bg-blue-500/10 text-blue-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* =================================================
              CURRENT HACKATHON
          ================================================= */}

          <section className="mb-8 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-600/[0.08] via-slate-900 to-slate-900">

            <div className="p-6 md:p-7">

              <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                      Current Hackathon
                    </span>

                    {hackathon?.status && (
                      <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                        {
                          hackathon.status
                        }
                      </span>
                    )}

                  </div>

                  <h2 className="mt-3 text-2xl font-bold">
                    {hackathon
                      ? hackathon.name
                      : "No hackathon selected"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    Hackathon ID:{" "}
                    <span className="font-mono font-semibold text-blue-400">
                      {hackathonId ||
                        "—"}
                    </span>
                  </p>

                </div>

                <div className="flex flex-wrap gap-3">

                  <button
                    type="button"
                    onClick={
                      openJoinAnotherHackathon
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-blue-500/40 hover:text-white"
                  >
                    <CalendarDays size={16} />
                    Switch Hackathon
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleLeaveHackathon
                    }
                    disabled={
                      !hackathon ||
                      teamActionLoading
                    }
                    className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <LogOut size={16} />
                    Leave Hackathon
                  </button>

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              QUICK TEAM ACTIONS
          ================================================= */}

          {hackathon &&
            !team && (
              <section className="mb-8">

                <div className="grid gap-4 md:grid-cols-2">

                  <button
                    type="button"
                    onClick={
                      openCreateTeam
                    }
                    className="group rounded-2xl border border-blue-500/20 bg-slate-900 p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-500/40"
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                        <Plus size={21} />
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-400"
                      />

                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      Create a New Team
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Create your own team and receive a
                      unique Team ID to share.
                    </p>

                  </button>

                  <button
                    type="button"
                    onClick={
                      openJoinTeam
                    }
                    className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-600"
                  >

                    <div className="flex items-start justify-between">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                        <Users size={21} />
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-white"
                      />

                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      Join an Existing Team
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Enter a teammate's Team ID to join
                      their team.
                    </p>

                  </button>

                </div>

              </section>
            )}

          {/* =================================================
              TEAM SECTION
          ================================================= */}

          <section
            id="team-section"
            className="scroll-mt-24"
          >

            {teamLoading ? (

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                <p className="mt-4 text-sm text-slate-400">
                  Checking your team...
                </p>

              </div>

            ) : team ? (

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-7">

                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">

                  <div>

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-400">
                        Your Team
                      </span>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${getTeamStatusClass(
                          team.status
                        )}`}
                      >
                        {
                          team.status
                        }
                      </span>

                    </div>

                    <h2 className="mt-3 text-2xl font-bold">
                      {team.name}
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Team Leader:{" "}
                      <span className="font-medium text-slate-200">
                        {typeof team.leader ===
                        "object"
                          ? team.leader.name
                          : "Team Leader"}
                      </span>
                    </p>

                  </div>

                  {/* TEAM ID */}

                  <div className="min-w-0 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 lg:w-[300px]">

                    <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-400">

                      <ShieldCheck size={14} />
                      Team ID

                    </div>

                    <div className="mt-2 flex items-center gap-2">

                      <p className="min-w-0 flex-1 break-all font-mono text-lg font-bold tracking-wide">
                        {team.teamId ||
                          "Not available"}
                      </p>

                      {team.teamId && (
                        <button
                          type="button"
                          onClick={
                            copyTeamId
                          }
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                        >
                          {copiedTeamId ? (
                            <>
                              <Check size={13} />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              Copy
                            </>
                          )}
                        </button>
                      )}

                    </div>

                    <p className="mt-2 text-[11px] leading-5 text-slate-500">
                      Share this Team ID with teammates.
                    </p>

                  </div>

                </div>

                {/* REJECTION */}

                {team.status ===
                  "REJECTED" &&
                  team.rejectionReason && (
                    <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4">

                      <p className="text-sm font-semibold text-red-400">
                        Team Rejected
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {
                          team.rejectionReason
                        }
                      </p>

                    </div>
                  )}

                {/* MEMBERS */}

                <div className="mt-7">

                  <h3 className="text-lg font-semibold">
                    Team Members
                  </h3>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">

                    {/* LEADER */}

                    {typeof team.leader ===
                      "object" && (
                      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                        <div className="flex items-center justify-between gap-3">

                          <div>
                            <p className="font-medium">
                              {
                                team
                                  .leader
                                  .name
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                team
                                  .leader
                                  .email
                              }
                            </p>
                          </div>

                          <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] text-blue-400">
                            Leader
                          </span>

                        </div>

                      </div>
                    )}

                    {/* MEMBERS */}

                    {displayedMembers.map(
                      (
                        member,
                        index
                      ) => (
                        <div
                          key={`${member.email}-${index}`}
                          className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                        >

                          <div className="flex items-center justify-between gap-3">

                            <div>

                              <p className="font-medium">
                                {
                                  member.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  member.email
                                }
                              </p>

                            </div>

                            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] text-slate-400">
                              {
                                member.role ||
                                "Member"
                              }
                            </span>

                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>

              </div>

            ) : (

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  👥
                </div>

                <h2 className="mt-5 text-2xl font-bold">
                  No team yet
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">
                  Create your own team or join an existing
                  team using a Team ID.
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={
                      openCreateTeam
                    }
                    disabled={
                      !hackathon
                    }
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + Create Team
                  </button>

                  <button
                    type="button"
                    onClick={
                      openJoinTeam
                    }
                    disabled={
                      !hackathon
                    }
                    className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Join Existing Team
                  </button>

                </div>

              </div>
            )}

          </section>

          {/* =================================================
              STATUS CARDS
          ================================================= */}

          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatusCard
              icon={<Users size={17} />}
              title="Team"
              value={
                team
                  ? team.status
                  : "Not Created"
              }
              description={
                team
                  ? "Your team status"
                  : "Create or join a team"
              }
            />

            <StatusCard
              icon={<Rocket size={17} />}
              title="Project"
              value={
                project
                  ? project.status
                  : "Not Submitted"
              }
              description={
                project
                  ? "Project status"
                  : "Submit after approval"
              }
            />

            <StatusCard
              icon={<ClipboardCheck size={17} />}
              title="Evaluation"
              value={
                project
                  ? "Pending"
                  : "Waiting"
              }
              description={
                project
                  ? "Judge evaluation"
                  : "Project required"
              }
            />

            <StatusCard
              icon={<ShieldCheck size={17} />}
              title="Final Result"
              value="Not Released"
              description="Marks and rank remain hidden"
            />

          </section>

          {/* =================================================
              PROJECT
          ================================================= */}

          <section
            id="project-section"
            className="mt-8 scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-7"
          >

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  PROJECT SUBMISSION
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Your Project
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Submit your team's project after approval.
                </p>

              </div>

              {!project && (
                <button
                  type="button"
                  onClick={
                    openProjectModal
                  }
                  disabled={
                    !team ||
                    team.status !==
                      "APPROVED" ||
                    projectLoading
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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

            {projectLoading ? (

              <div className="mt-6 rounded-xl bg-slate-800/40 p-10 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

                <p className="mt-3 text-sm text-slate-400">
                  Loading project...
                </p>

              </div>

            ) : project ? (

              <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5 md:p-6">

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-400">
                      Submitted Project
                    </p>

                    <h3 className="mt-2 text-2xl font-bold">
                      {
                        project.projectName
                      }
                    </h3>

                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${getProjectStatusClass(
                      project.status
                    )}`}
                  >
                    {
                      project.status
                    }
                  </span>

                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Problem Statement
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                      {
                        project.problemStatement
                      }
                    </p>

                  </div>

                  <div>

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Technology Stack
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                      {
                        project.technologyStack
                      }
                    </p>

                  </div>

                </div>

                <div className="mt-5">

                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Solution
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                    {
                      project.solution
                    }
                  </p>

                </div>

                <div className="mt-6 flex flex-wrap gap-3">

                  {project.githubUrl && (
                    <a
                      href={
                        project.githubUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
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
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
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
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      Presentation ↗
                    </a>
                  )}

                </div>

                {project.submittedAt && (
                  <p className="mt-5 text-xs text-slate-500">
                    Submitted on{" "}
                    {new Date(
                      project.submittedAt
                    ).toLocaleString()}
                  </p>
                )}

              </div>

            ) : (

              <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-8 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                  🚀
                </div>

                <p className="mt-4 font-medium text-slate-300">
                  No project submitted yet
                </p>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Once your team is approved, submit your
                  project here for evaluation.
                </p>

                {!team && (
                  <p className="mt-3 text-sm text-yellow-500">
                    Create or join a team first.
                  </p>
                )}

                {team?.status ===
                  "PENDING" && (
                  <p className="mt-3 text-sm text-yellow-500">
                    Waiting for team approval.
                  </p>
                )}

                {team?.status ===
                  "REJECTED" && (
                  <p className="mt-3 text-sm text-red-400">
                    This team has been rejected.
                  </p>
                )}

              </div>
            )}

          </section>

          {/* =================================================
              EVALUATION
          ================================================= */}

          <section
            id="evaluation-section"
            className="mt-8 scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-7"
          >

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                EVALUATION
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Evaluation Progress
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Follow your evaluation progress round by round.
                Round feedback can be released after each round,
                while marks remain hidden until the final result.
              </p>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              <RoundCard
                number="01"
                title="Round 1"
                status={
                  project
                    ? "Evaluation pending"
                    : "Waiting for project"
                }
              />

              <RoundCard
                number="02"
                title="Round 2"
                status="Not started"
              />

              <RoundCard
                number="03"
                title="Final Result"
                status="Not released"
              />

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <ClipboardCheck size={18} />
                  </div>

                  <div>

                    <p className="font-semibold text-blue-400">
                      Round Feedback
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Feedback becomes visible when the organizer
                      releases that round.
                    </p>

                  </div>

                </div>

              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                    <ShieldCheck size={18} />
                  </div>

                  <div>

                    <p className="font-semibold text-yellow-400">
                      Final Marks
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      Final score and rank remain hidden until
                      the organizer releases final results.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-5">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>

                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    FINAL RESULT
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    Results have not been released
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Final score and rank will appear here after
                    the organizer declares the result.
                  </p>

                </div>

                <div className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-500">
                  Locked
                </div>

              </div>

            </div>

          </section>

        </div>

      </div>

      {/* =================================================
          JOIN ANOTHER HACKATHON MODAL
      ================================================= */}

      {showJoinHackathon && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4">

          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0A1525] p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  HACKATHON
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Join Another Hackathon
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Enter the public Hackathon ID provided by
                  the organizer.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowJoinHackathon(
                    false
                  )
                }
                disabled={
                  joinHackathonLoading
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            {joinHackathonError && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">

                <p className="text-sm text-red-400">
                  {
                    joinHackathonError
                  }
                </p>

              </div>
            )}

            <form
              onSubmit={
                handleJoinAnotherHackathon
              }
              className="mt-6 space-y-5"
            >

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Hackathon ID
                </label>

                <input
                  type="text"
                  value={
                    joinHackathonInput
                  }
                  onChange={(event) =>
                    setJoinHackathonInput(
                      event.target.value
                        .toUpperCase()
                    )
                  }
                  placeholder="HACK-7F3A91"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono uppercase tracking-wide text-white outline-none focus:border-blue-500"
                />

              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                <p className="text-sm font-medium text-blue-400">
                  What happens next?
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  FairJudge verifies the Hackathon ID and
                  switches your dashboard to that event.
                </p>

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowJoinHackathon(
                      false
                    )
                  }
                  disabled={
                    joinHackathonLoading
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    joinHackathonLoading ||
                    !joinHackathonInput.trim()
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {joinHackathonLoading
                    ? "Checking..."
                    : "Continue"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          CREATE TEAM MODAL
      ================================================= */}

      {showCreateTeam && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-8">

          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-[#0A1525] p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  TEAM SETUP
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Create Your Team
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  A unique Team ID should be generated by
                  the backend.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateTeam(
                    false
                  )
                }
                disabled={
                  teamActionLoading
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                handleCreateTeam
              }
              className="mt-6 space-y-5"
            >

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Team Name
                </label>

                <input
                  type="text"
                  value={
                    teamName
                  }
                  onChange={(
                    event
                  ) =>
                    setTeamName(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Dream Innovators"
                  maxLength={
                    100
                  }
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm font-medium text-slate-300">
                      Add Teammates
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Optional. Teammates can join later
                      using the Team ID.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={
                      addMember
                    }
                    disabled={
                      teamActionLoading
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
                      You can create the team now and
                      share its Team ID afterwards.
                    </p>

                  </div>
                )}

                <div className="mt-3 space-y-3">

                  {members.map(
                    (
                      member,
                      index
                    ) => (
                      <div
                        key={
                          index
                        }
                        className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                      >

                        <div className="grid gap-3 md:grid-cols-2">

                          <input
                            type="text"
                            placeholder="Member name"
                            value={
                              member.name
                            }
                            onChange={(
                              event
                            ) =>
                              updateMember(
                                index,
                                "name",
                                event.target.value
                              )
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                          />

                          <input
                            type="email"
                            placeholder="Member email"
                            value={
                              member.email
                            }
                            onChange={(
                              event
                            ) =>
                              updateMember(
                                index,
                                "email",
                                event.target.value
                              )
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                          />

                        </div>

                        <div className="mt-3 flex gap-3">

                          <input
                            type="text"
                            placeholder="Role"
                            value={
                              member.role
                            }
                            onChange={(
                              event
                            ) =>
                              updateMember(
                                index,
                                "role",
                                event.target.value
                              )
                            }
                            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeMember(
                                index
                              )
                            }
                            className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                          >
                            Remove
                          </button>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                <p className="text-sm font-medium text-blue-400">
                  Current Hackathon
                </p>

                <p className="mt-1 font-medium text-white">
                  {hackathon?.name}
                </p>

                <p className="mt-1 font-mono text-xs text-slate-500">
                  {hackathonId}
                </p>

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateTeam(
                      false
                    )
                  }
                  disabled={
                    teamActionLoading
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    teamActionLoading ||
                    !hackathon
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {teamActionLoading
                    ? "Creating..."
                    : "Create Team"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          JOIN TEAM MODAL
      ================================================= */}

      {showJoinTeam && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4">

          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0A1525] p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  JOIN TEAM
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Join an Existing Team
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Ask the team leader for their unique
                  Team ID.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowJoinTeam(
                    false
                  )
                }
                disabled={
                  teamActionLoading
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            <form
              onSubmit={
                handleJoinTeam
              }
              className="mt-6 space-y-5"
            >

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Team ID
                </label>

                <input
                  type="text"
                  value={
                    joinTeamId
                  }
                  onChange={(
                    event
                  ) =>
                    setJoinTeamId(
                      event.target.value
                        .toUpperCase()
                    )
                  }
                  placeholder="TEAM-A7F29C"
                  autoFocus
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono uppercase tracking-wide text-white outline-none focus:border-blue-500"
                />

              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">

                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Current Hackathon
                </p>

                <p className="mt-1 font-medium">
                  {hackathon?.name}
                </p>

                <p className="mt-1 font-mono text-xs text-slate-500">
                  {hackathonId}
                </p>

              </div>

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                <p className="text-sm font-medium text-blue-400">
                  Important
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  You can belong to only one team in the
                  same hackathon.
                </p>

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowJoinTeam(
                      false
                    )
                  }
                  disabled={
                    teamActionLoading
                  }
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    teamActionLoading ||
                    !joinTeamId.trim()
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {teamActionLoading
                    ? "Joining..."
                    : "Join Team"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =================================================
          PROJECT MODAL
      ================================================= */}

      {showProjectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-8">

          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-[#0A1525] p-6 shadow-2xl">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  PROJECT SUBMISSION
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Submit Your Project
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Team:{" "}
                  <span className="font-medium text-white">
                    {team?.name}
                  </span>
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  if (!projectSubmitting) {
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
                className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                <X size={19} />
              </button>

            </div>

            {projectError && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                <p className="text-sm text-red-400">
                  {projectError}
                </p>

              </div>
            )}

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
                  onChange={(
                    event
                  ) =>
                    updateProjectField(
                      "projectName",
                      event.target.value
                    )
                  }
                  placeholder="e.g. FairJudge"
                  required
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* PROBLEM */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Problem Statement *
                </label>

                <textarea
                  value={
                    projectForm.problemStatement
                  }
                  onChange={(
                    event
                  ) =>
                    updateProjectField(
                      "problemStatement",
                      event.target.value
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
                  onChange={(
                    event
                  ) =>
                    updateProjectField(
                      "solution",
                      event.target.value
                    )
                  }
                  placeholder="Explain your proposed solution."
                  required
                  rows={6}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* TECHNOLOGY */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Technology Stack *
                </label>

                <textarea
                  value={
                    projectForm.technologyStack
                  }
                  onChange={(
                    event
                  ) =>
                    updateProjectField(
                      "technologyStack",
                      event.target.value
                    )
                  }
                  placeholder="Next.js, React, Node.js, MongoDB..."
                  required
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* LINKS */}

              <div className="grid gap-5 md:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    GitHub URL
                  </label>

                  <input
                    type="url"
                    value={
                      projectForm.githubUrl
                    }
                    onChange={(
                      event
                    ) =>
                      updateProjectField(
                        "githubUrl",
                        event.target.value
                      )
                    }
                    placeholder="https://github.com/..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Demo URL
                  </label>

                  <input
                    type="url"
                    value={
                      projectForm.demoUrl
                    }
                    onChange={(
                      event
                    ) =>
                      updateProjectField(
                        "demoUrl",
                        event.target.value
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
                  onChange={(
                    event
                  ) =>
                    updateProjectField(
                      "presentationUrl",
                      event.target.value
                    )
                  }
                  placeholder="Google Drive / OneDrive / presentation link"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">

                <p className="text-sm font-semibold text-yellow-400">
                  Before submitting
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Check your project information carefully.
                  Your current backend submits the project
                  immediately.
                </p>

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">

                <button
                  type="button"
                  onClick={() => {
                    if (!projectSubmitting) {
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
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    projectSubmitting
                  }
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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

// =====================================================
// STATUS CARD
// =====================================================

function StatusCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="flex items-center justify-between">

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
          {icon}
        </div>

        <ChevronRight
          size={15}
          className="text-slate-700"
        />

      </div>

      <p className="mt-5 text-xs text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-[11px] leading-5 text-slate-600">
        {description}
      </p>

    </div>
  );
}

// =====================================================
// ROUND CARD
// =====================================================

function RoundCard({
  number,
  title,
  status,
}: {
  number: string;
  title: string;
  status: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

      <div className="flex items-start justify-between gap-3">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-xs font-bold text-blue-400">
            {number}
          </div>

          <div>

            <p className="font-semibold">
              {title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {status}
            </p>

          </div>

        </div>

        <ClipboardCheck
          size={17}
          className="text-slate-700"
        />

      </div>

    </div>
  );
}