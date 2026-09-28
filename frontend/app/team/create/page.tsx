"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Member = {
  name: string;
  email: string;
  role: string;
};

type Team = {
  _id: string;
  name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  members?: Member[];
  createdAt?: string;
};

export default function CreateTeamPage() {
  const router = useRouter();
  const { token, loading } = useAuth();

  // ======================================================
  // STATE
  // ======================================================

  const [hackathonId, setHackathonId] = useState("");

  const [teamName, setTeamName] = useState("");

  const [members, setMembers] = useState<Member[]>([
    {
      name: "",
      email: "",
      role: "Member",
    },
  ]);

  const [team, setTeam] = useState<Team | null>(null);

  const [checkingTeam, setCheckingTeam] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ======================================================
  // LOAD HACKATHON ID
  // ======================================================

  useEffect(() => {
    const storedHackathon =
      localStorage.getItem("fairjudge_hackathon");

    if (storedHackathon) {
      setHackathonId(storedHackathon);
    }
  }, []);

  // ======================================================
  // CHECK EXISTING TEAM
  // ======================================================

  useEffect(() => {
    if (!token || !hackathonId) {
      return;
    }

    checkExistingTeam();
  }, [token, hackathonId]);

  // ======================================================
  // GET EXISTING TEAM
  // ======================================================

  const checkExistingTeam = async () => {
    try {
      setCheckingTeam(true);
      setError("");

      const response = await apiRequest(
        `/teams/my/${hackathonId}`,
        {
          method: "GET",
          token,
        }
      );

      console.log(
        "Existing team response:",
        response
      );

      if (response?.team) {
        setTeam(response.team);

        // Fill team name if available
        setTeamName(
          response.team.name || ""
        );
      } else {
        setTeam(null);
      }
    } catch (err: any) {
      console.error(
        "Check existing team error:",
        err
      );

      // Don't show an error if simply no team exists
      if (
        err?.status !== 404 &&
        err?.response?.status !== 404
      ) {
        setError(
          err?.message ||
            "Failed to check existing team."
        );
      }

      setTeam(null);
    } finally {
      setCheckingTeam(false);
    }
  };

  // ======================================================
  // ADD MEMBER
  // ======================================================

  const addMember = () => {
    setMembers([
      ...members,
      {
        name: "",
        email: "",
        role: "Member",
      },
    ]);
  };

  // ======================================================
  // REMOVE MEMBER
  // ======================================================

  const removeMember = (index: number) => {
    setMembers(
      members.filter(
        (_, i) => i !== index
      )
    );
  };

  // ======================================================
  // UPDATE MEMBER
  // ======================================================

  const updateMember = (
    index: number,
    field: keyof Member,
    value: string
  ) => {
    const updated = [...members];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setMembers(updated);
  };

  // ======================================================
  // STATUS HELPER
  // ======================================================

  const getStatusColor = () => {
    if (!team) return "";

    switch (team.status) {
      case "PENDING":
        return "text-yellow-400";

      case "APPROVED":
        return "text-green-400";

      case "REJECTED":
        return "text-red-400";

      default:
        return "text-gray-400";
    }
  };

  // ======================================================
  // STATUS ICON
  // ======================================================

  const getStatusIcon = () => {
    if (!team) return "";

    switch (team.status) {
      case "PENDING":
        return "🟡";

      case "APPROVED":
        return "🟢";

      case "REJECTED":
        return "🔴";

      default:
        return "⚪";
    }
  };

  // ======================================================
  // STATUS MESSAGE
  // ======================================================

  const getStatusMessage = () => {
    if (!team) return "";

    switch (team.status) {
      case "PENDING":
        return "Your team request is waiting for organizer approval.";

      case "APPROVED":
        return "Your team has been approved by the organizer.";

      case "REJECTED":
        return "Your team request was rejected by the organizer.";

      default:
        return "";
    }
  };

  // ======================================================
  // SUBMIT TEAM
  // ======================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // --------------------------------------------------
    // Authentication
    // --------------------------------------------------

    if (!token) {
      setError(
        "Authentication token not found. Please login again."
      );

      return;
    }

    // --------------------------------------------------
    // Hackathon ID
    // --------------------------------------------------

    if (!hackathonId.trim()) {
      setError(
        "Please enter the Hackathon ID."
      );

      return;
    }

    // --------------------------------------------------
    // Existing team
    // --------------------------------------------------

    if (team) {
      setError(
        "You already have a team for this hackathon."
      );

      return;
    }

    // --------------------------------------------------
    // Team name
    // --------------------------------------------------

    if (!teamName.trim()) {
      setError(
        "Please enter a team name."
      );

      return;
    }

    // --------------------------------------------------
    // Members
    // --------------------------------------------------

    const validMembers =
      members.filter(
        (member) =>
          member.name.trim() &&
          member.email.trim()
      );

    if (validMembers.length === 0) {
      setError(
        "Please add at least one team member."
      );

      return;
    }

    // --------------------------------------------------
    // Submit
    // --------------------------------------------------

    try {
      setSubmitting(true);

      const response = await apiRequest(
        "/teams",
        {
          method: "POST",

          body: {
            hackathon:
              hackathonId.trim(),

            name: teamName.trim(),

            members: validMembers.map(
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

          token,
        }
      );

      console.log(
        "Team created:",
        response
      );

      // ------------------------------------------------
      // Save returned team
      // ------------------------------------------------

      if (response?.team) {
        setTeam(response.team);
      }

      setSuccess(
        "Team request submitted successfully!"
      );
    } catch (err: any) {
      console.error(
        "Create team error:",
        err
      );

      setError(
        err?.message ||
          "Failed to create team."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">

        {/* ==================================================
            BACK BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            router.push("/team")
          }
          className="mb-6 text-gray-400 hover:text-white transition"
        >
          ← Back to Dashboard
        </button>

        {/* ==================================================
            TITLE
        ================================================== */}

        <h1 className="text-3xl font-bold mb-2">
          Create Your Team
        </h1>

        <p className="text-gray-400 mb-8">
          Create a team for the hackathon
          and submit it for organizer
          approval.
        </p>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="mb-5 p-4 rounded-lg bg-red-900/30 border border-red-800 text-red-400">
            {error}
          </div>
        )}

        {/* ==================================================
            SUCCESS
        ================================================== */}

        {success && (
          <div className="mb-5 p-4 rounded-lg bg-green-900/30 border border-green-800 text-green-400">
            {success}
          </div>
        )}

        {/* ==================================================
            EXISTING TEAM STATUS
        ================================================== */}

        {checkingTeam && (
          <div className="mb-6 p-4 rounded-lg bg-gray-900 border border-gray-700 text-gray-400">
            Checking your team status...
          </div>
        )}

        {team && (
          <div className="mb-8 p-6 rounded-xl bg-gray-900 border border-gray-700">

            <div className="flex justify-between items-start gap-4">

              <div>
                <p className="text-sm text-gray-400 mb-1">
                  Team Request Status
                </p>

                <h2
                  className={`text-2xl font-bold ${getStatusColor()}`}
                >
                  {getStatusIcon()}{" "}
                  {team.status}
                </h2>

                <p className="text-gray-400 mt-2">
                  {getStatusMessage()}
                </p>
              </div>

              <button
                type="button"
                onClick={checkExistingTeam}
                disabled={checkingTeam}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"
              >
                {checkingTeam
                  ? "Checking..."
                  : "Refresh"}
              </button>

            </div>

            {/* Team Name */}

            <div className="mt-5 pt-5 border-t border-gray-800">

              <p className="text-sm text-gray-500">
                Team Name
              </p>

              <p className="text-lg font-semibold">
                {team.name}
              </p>

            </div>

            {/* Rejection Reason */}

            {team.status ===
              "REJECTED" &&
              team.rejectionReason && (
                <div className="mt-5 p-4 rounded-lg bg-red-900/20 border border-red-800">

                  <p className="text-sm text-red-400 font-semibold mb-1">
                    Rejection Reason
                  </p>

                  <p className="text-red-300">
                    {
                      team.rejectionReason
                    }
                  </p>

                </div>
              )}

          </div>
        )}

        {/* ==================================================
            CREATE FORM
        ================================================== */}

        {!team && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            {/* ==================================================
                HACKATHON ID
            ================================================== */}

            <div>
              <label className="block mb-2 font-medium">
                Hackathon ID
              </label>

              <input
                type="text"
                value={hackathonId}
                onChange={(e) => {
                  setHackathonId(
                    e.target.value
                  );

                  // Clear previous team
                  setTeam(null);
                }}
                placeholder="Enter Hackathon ID"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-blue-500"
              />

              <p className="mt-2 text-sm text-gray-500">
                Enter the Hackathon ID provided
                by the organizer.
              </p>
            </div>

            {/* ==================================================
                TEAM NAME
            ================================================== */}

            <div>
              <label className="block mb-2 font-medium">
                Team Name
              </label>

              <input
                type="text"
                value={teamName}
                onChange={(e) =>
                  setTeamName(
                    e.target.value
                  )
                }
                placeholder="Enter team name"
                className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* ==================================================
                MEMBERS
            ================================================== */}

            <div>

              <div className="flex justify-between items-center mb-4">

                <div>
                  <h2 className="text-xl font-semibold">
                    Team Members
                  </h2>

                  <p className="text-sm text-gray-400">
                    Add the members of your team.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addMember}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  + Add Member
                </button>

              </div>

              <div className="space-y-4">

                {members.map(
                  (member, index) => (
                    <div
                      key={index}
                      className="p-5 rounded-lg bg-gray-900 border border-gray-700"
                    >

                      <div className="grid gap-4 md:grid-cols-3">

                        {/* Name */}

                        <input
                          type="text"
                          placeholder="Member name"
                          value={
                            member.name
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
                        />

                        {/* Email */}

                        <input
                          type="email"
                          placeholder="Email"
                          value={
                            member.email
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              "email",
                              e.target.value
                            )
                          }
                          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
                        />

                        {/* Role */}

                        <input
                          type="text"
                          placeholder="Role"
                          value={
                            member.role
                          }
                          onChange={(e) =>
                            updateMember(
                              index,
                              "role",
                              e.target.value
                            )
                          }
                          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
                        />

                      </div>

                      {/* Remove */}

                      {members.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeMember(
                              index
                            )
                          }
                          className="mt-3 text-red-400 hover:text-red-300"
                        >
                          Remove Member
                        </button>
                      )}

                    </div>
                  )
                )}

              </div>

            </div>

            {/* ==================================================
                SUBMIT
            ================================================== */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? "Submitting Request..."
                : "Submit Team Request"}
            </button>

          </form>
        )}

        {/* ==================================================
            FOOTER INFORMATION
        ================================================== */}

        {team && (
          <div className="mt-6 text-center">

            <button
              type="button"
              onClick={() =>
                router.push("/team")
              }
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold"
            >
              Go to Team Dashboard
            </button>

          </div>
        )}

      </div>
    </div>
  );
}