"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Scale,
  User,
  Users,
  ClipboardCheck,
  UserRound,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("TEAM");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);

      // NEXT_PUBLIC_API_URL should be:
      // http://localhost:5000/api
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api";

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const contentType =
        response.headers.get("content-type") || "";

      // Prevent: Unexpected token '<'
      if (!contentType.includes("application/json")) {
        const text = await response.text();

        console.error(
          "Server returned non-JSON response:",
          text
        );

        throw new Error(
          "Backend returned an invalid response. Please make sure the backend is running on port 5000."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      setSuccess(
        "Account created successfully! Redirecting to login..."
      );

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    } catch (err) {
      console.error("Registration error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT SECTION */}
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-slate-900 p-12 lg:flex lg:flex-col lg:justify-between">

          {/* LOGO */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <Scale size={23} />
            </div>

            <span className="text-2xl font-bold tracking-tight">
              Fair<span className="text-blue-500">Judge</span>
            </span>
          </button>

          {/* MAIN CONTENT */}
          <div className="relative z-10 max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              Join the Evaluation Platform
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Build better
              <br />
              <span className="text-blue-500">
                hackathons.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
              FairJudge connects organizers, judges and innovators
              through a structured and transparent hackathon
              evaluation system.
            </p>

            {/* ROLES */}
            <div className="mt-10 space-y-4">

              {/* Organizer */}
              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <Users size={20} />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Organizer
                  </h3>

                  <p className="text-sm text-slate-400">
                    Create and manage hackathons.
                  </p>
                </div>
              </div>

              {/* Judge */}
              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <ClipboardCheck size={20} />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Judge
                  </h3>

                  <p className="text-sm text-slate-400">
                    Evaluate projects using structured criteria.
                  </p>
                </div>
              </div>

              {/* Participant */}
              <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                  <UserRound size={20} />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Participant
                  </h3>

                  <p className="text-sm text-slate-400">
                    Join hackathons and submit your innovation.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* BACKGROUND EFFECTS */}
          <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl" />

        </section>

        {/* RIGHT SECTION */}
        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="mb-10 flex items-center gap-3 lg:hidden"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <Scale size={23} />
              </div>

              <span className="text-2xl font-bold">
                Fair<span className="text-blue-500">Judge</span>
              </span>
            </button>

            {/* HEADING */}
            <div>
              <p className="text-sm font-medium text-blue-400">
                GET STARTED
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                Create your account
              </h1>

              <p className="mt-3 text-slate-400">
                Join FairJudge and be part of a better
                evaluation experience.
              </p>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <div className="mt-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
                {success}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleRegister}
              className="mt-8 space-y-5"
            >

              {/* NAME */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full Name
                </label>

                <div className="relative">
                  <User
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* ROLE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Select Your Role
                </label>

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
                  disabled={loading}
                  className="w-full cursor-pointer rounded-xl border border-white/10 bg-slate-900 px-4 py-3.5 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="TEAM">
                    Participant
                  </option>

                  <option value="JUDGE">
                    Judge
                  </option>

                  <option value="ORGANIZER">
                    Organizer
                  </option>
                </select>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Account"}

                {!loading && (
                  <ArrowRight size={19} />
                )}
              </button>

            </form>

            {/* LOGIN */}
            <p className="mt-8 text-center text-sm text-slate-400">
              Already have an account?{" "}

              <button
                type="button"
                onClick={() =>
                  router.push("/login")
                }
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Sign in
              </button>
            </p>

          </div>
        </section>

      </div>
    </main>
  );
}