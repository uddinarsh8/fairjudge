"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function TeamRegisterPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [hackathonId, setHackathonId] = useState("");
  const [teamName, setTeamName] = useState("");

  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");

  const [members, setMembers] = useState<
    {
      name: string;
      email: string;
      role: string;
    }[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const addMember = () => {
    if (!memberName || !memberEmail) {
      setError("Enter member name and email");
      return;
    }

    setMembers((current) => [
      ...current,
      {
        name: memberName,
        email: memberEmail,
        role: current.length === 0 ? "Team Leader" : "Member",
      },
    ]);

    setMemberName("");
    setMemberEmail("");
    setError("");
  };

  const removeMember = (index: number) => {
    setMembers((current) =>
      current.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!hackathonId) {
      setError("Enter the hackathon ID");
      return;
    }

    if (members.length === 0) {
      setError("Add at least one team member");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/teams", {
        method: "POST",
        token: token || undefined,
        body: {
          hackathonId,
          name: teamName,
          members,
        },
      });

      setSuccess("Team registered successfully!");

      setTimeout(() => {
        router.push("/team");
      }, 1000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to register team"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/team")}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Team Dashboard
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <h1 className="text-3xl font-bold">
            Register Your Team
          </h1>

          <p className="mt-2 text-slate-400">
            Register your team for a FairJudge hackathon.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Hackathon ID
              </label>

              <input
                type="text"
                value={hackathonId}
                onChange={(e) =>
                  setHackathonId(e.target.value)
                }
                placeholder="Paste hackathon ID"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <p className="mt-1 text-xs text-slate-500">
                We'll improve this with a hackathon selector later.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Team Name
              </label>

              <input
                type="text"
                value={teamName}
                onChange={(e) =>
                  setTeamName(e.target.value)
                }
                placeholder="e.g. Team Innovators"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="border-t border-slate-800 pt-6">
              <h2 className="text-xl font-semibold">
                Team Members
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add all members of your team.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) =>
                    setMemberName(e.target.value)
                  }
                  placeholder="Member name"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) =>
                    setMemberEmail(e.target.value)
                  }
                  placeholder="Member email"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={addMember}
                className="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800"
              >
                + Add Member
              </button>

              {members.length > 0 && (
                <div className="mt-5 space-y-3">
                  {members.map((member, index) => (
                    <div
                      key={`${member.email}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-slate-800/50 p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {member.name}
                        </p>

                        <p className="text-sm text-slate-500">
                          {member.email} • {member.role}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeMember(index)
                        }
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Registering..."
                : "Register Team"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}