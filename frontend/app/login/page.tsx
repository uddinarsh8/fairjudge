"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  Scale,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // HANDLE LOGIN
  // =====================================================

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    // ---------------------------------------------------
    // VALIDATION
    // ---------------------------------------------------

    if (!cleanEmail || !password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      // -------------------------------------------------
      // LOGIN
      // -------------------------------------------------

      const user = await login(
        cleanEmail,
        password
      );

      console.log(
        "================================="
      );

      console.log("LOGIN SUCCESS");
      console.log("User:", user);
      console.log("User ID:", user?.id);
      console.log("User Email:", user?.email);
      console.log("User Role:", user?.role);

      console.log(
        "================================="
      );

      // -------------------------------------------------
      // VALIDATE USER
      // -------------------------------------------------

      if (!user) {
        throw new Error(
          "User information was not returned by the server."
        );
      }

      if (!user.role) {
        throw new Error(
          "User role was not returned by the server."
        );
      }

      // -------------------------------------------------
      // NORMALIZE ROLE
      // -------------------------------------------------

      const role = String(user.role)
        .trim()
        .toUpperCase();

      console.log(
        "Normalized login role:",
        role
      );

      // -------------------------------------------------
      // REDIRECT BASED ON ROLE
      // -------------------------------------------------

      switch (role) {
        // ===============================================
        // ORGANIZER
        // ===============================================

        case "ORGANIZER":
          console.log(
            "Redirecting to organizer dashboard..."
          );

          router.replace("/organizer");
          return;

        // ===============================================
        // JUDGE
        // ===============================================

        case "JUDGE":
          console.log(
            "Redirecting to judge dashboard..."
          );

          router.replace("/judge");
          return;

        // ===============================================
        // PARTICIPANT / TEAM
        // ===============================================

        case "TEAM":

        case "PARTICIPANT":

          console.log(
            "Participant/Team login detected."
          );

          console.log(
            "Redirecting to /team..."
          );

          router.replace("/team");
          return;

        // ===============================================
        // MEMBER
        // ===============================================

        case "MEMBER":

          console.log(
            "Member login detected."
          );

          /*
           * If members should use the same participant
           * dashboard, redirect them to /team.
           *
           * If you later create a separate /member
           * dashboard, change this to:
           *
           * router.replace("/member");
           */

          router.replace("/team");
          return;

        // ===============================================
        // UNKNOWN ROLE
        // ===============================================

        default:

          console.error(
            "Unknown user role received:",
            user.role
          );

          throw new Error(
            `Unknown user role: ${user.role}`
          );
      }
    } catch (error) {
      console.error(
        "================================="
      );

      console.error(
        "LOGIN ERROR:",
        error
      );

      console.error(
        "================================="
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <section className="relative hidden overflow-hidden border-r border-white/10 bg-slate-900 p-12 lg:flex lg:flex-col lg:justify-between">

          {/* LOGO */}

          <div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex items-center gap-3"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
                <Scale size={23} />
              </div>

              <span className="text-2xl font-bold tracking-tight">
                Fair
                <span className="text-blue-500">
                  Judge
                </span>
              </span>
            </button>
          </div>

          {/* HERO CONTENT */}

          <div className="max-w-xl">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              Fair. Transparent. Structured.
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Evaluate innovation
              <br />
              with{" "}
              <span className="text-blue-500">
                confidence.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
              FairJudge brings organizers, judges,
              participants, and team members together
              on one transparent platform for seamless
              hackathon evaluation.
            </p>

          </div>

          {/* FEATURES */}

          <div className="grid grid-cols-3 gap-4">

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-2xl font-bold text-blue-400">
                4
              </p>

              <p className="mt-1 text-sm text-slate-400">
                User Roles
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-2xl font-bold text-blue-400">
                Fair
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Evaluation
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <p className="text-2xl font-bold text-blue-400">
                Live
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Results
              </p>
            </div>

          </div>

          {/* BACKGROUND EFFECTS */}

          <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-600/10 blur-3xl" />

        </section>

        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mb-12 flex items-center gap-3 lg:hidden"
            >

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <Scale size={23} />
              </div>

              <span className="text-2xl font-bold">
                Fair
                <span className="text-blue-500">
                  Judge
                </span>
              </span>

            </button>

            {/* HEADER */}

            <div>

              <p className="text-sm font-medium text-blue-400">
                WELCOME BACK
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight">
                Sign in to FairJudge
              </h2>

              <p className="mt-3 text-slate-400">
                Enter your credentials to access
                your dashboard.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                <p className="text-sm leading-6 text-red-400">
                  {error}
                </p>

              </div>
            )}

            {/* LOGIN FORM */}

            <form
              onSubmit={handleLogin}
              className="mt-10 space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                    disabled={loading}
                    autoComplete="email"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    disabled={loading}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                </div>

              </div>

              {/* REMEMBER / FORGOT */}

              <div className="flex items-center justify-between">

                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-400">

                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                  />

                  Remember me

                </label>

                <button
                  type="button"
                  onClick={() => {
                    setError(
                      "Password reset is not available yet."
                    );
                  }}
                  className="text-sm text-blue-400 transition hover:text-blue-300"
                >
                  Forgot password?
                </button>

              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold transition hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In

                    <ArrowRight size={19} />
                  </>
                )}

              </button>

            </form>

            {/* REGISTER */}

            <p className="mt-8 text-center text-sm text-slate-400">

              Don't have an account?{" "}

              <button
                type="button"
                onClick={() =>
                  router.push("/register")
                }
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                Create an account
              </button>

            </p>

            {/* FOOTER */}

            <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-600">
              © 2026 FairJudge. Fair evaluation for
              better innovation.
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}