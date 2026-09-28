"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type Team = {
  _id: string;
  name: string;
  hackathon: {
    _id: string;
    name: string;
    status: string;
  };
};

export default function ProjectPage() {
  const router = useRouter();
  const { token } = useAuth();

  const [team, setTeam] = useState<Team | null>(null);

  const [projectName, setProjectName] = useState("");
  const [problemStatement, setProblemStatement] =
    useState("");
  const [solution, setSolution] = useState("");
  const [technologyStack, setTechnologyStack] =
    useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [presentationUrl, setPresentationUrl] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadTeam = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest("/teams/my", {
          token,
        });

        if (!response.teams?.length) {
          setError(
            "You need to register a team before submitting a project."
          );
          return;
        }

        setTeam(response.teams[0]);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load team"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!team) {
      setError("Team information is missing.");
      return;
    }

    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await apiRequest("/projects", {
        method: "POST",
        token: token || undefined,
        body: {
          teamId: team._id,
          projectName,
          problemStatement,
          solution,
          technologyStack,
          githubUrl,
          demoUrl,
          presentationUrl,
        },
      });

      setSuccess(
        "Project submitted successfully."
      );

      setTimeout(() => {
        router.push("/team");
      }, 1200);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit project"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.push("/team")}
          className="mb-6 text-sm text-slate-400 hover:text-white"
        >
          ← Team Dashboard
        </button>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
          <div className="mb-8">
            <p className="text-sm font-medium text-blue-400">
              PROJECT SUBMISSION
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Submit Your Project
            </h1>

            {team && (
              <p className="mt-2 text-slate-400">
                Team: {team.name} •{" "}
                {team.hackathon.name}
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Project Name
              </label>

              <input
                type="text"
                value={projectName}
                onChange={(e) =>
                  setProjectName(e.target.value)
                }
                placeholder="Enter your project name"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Problem Statement
              </label>

              <textarea
                value={problemStatement}
                onChange={(e) =>
                  setProblemStatement(e.target.value)
                }
                placeholder="What problem are you solving?"
                rows={5}
                required
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Solution
              </label>

              <textarea
                value={solution}
                onChange={(e) =>
                  setSolution(e.target.value)
                }
                placeholder="Explain your solution..."
                rows={6}
                required
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Technology Stack
              </label>

              <textarea
                value={technologyStack}
                onChange={(e) =>
                  setTechnologyStack(e.target.value)
                }
                placeholder="React, Node.js, MongoDB, Python..."
                rows={3}
                required
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  GitHub URL
                </label>

                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) =>
                    setGithubUrl(e.target.value)
                  }
                  placeholder="https://github.com/..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Demo URL
                </label>

                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) =>
                    setDemoUrl(e.target.value)
                  }
                  placeholder="https://..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Presentation URL
              </label>

              <input
                type="url"
                value={presentationUrl}
                onChange={(e) =>
                  setPresentationUrl(e.target.value)
                }
                placeholder="Google Drive / Slides / other URL"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <div className="flex gap-3">
                <span>⚠️</span>

                <div>
                  <p className="font-medium text-yellow-400">
                    Review before submitting
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Make sure all project information is correct
                    before submission. We will add deadline-based
                    locking in the next stage.
                  </p>
                </div>
              </div>
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
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Project"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}