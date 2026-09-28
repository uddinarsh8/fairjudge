"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Scale,
  ShieldCheck,
  Trophy,
  Users,
  Star,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* ================= NAVBAR ================= */}

      <nav className="sticky top-0 z-50 border-b border-slate-800/70 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Scale size={21} />
            </div>

            <span className="text-xl font-bold tracking-tight">
              Fair<span className="text-blue-500">Judge</span>
            </span>
          </button>

          <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>

            <a href="#how-it-works" className="hover:text-white">
              How It Works
            </a>

            <a href="#roles" className="hover:text-white">
              Platform
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="hidden text-sm font-medium text-slate-300 hover:text-white sm:block"
            >
              Login
            </button>

            <button
              onClick={() => router.push("/register")}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
            >
              Get Started
            </button>
          </div>

        </div>
      </nav>


      {/* ================= HERO ================= */}

      <section className="relative px-6 pb-24 pt-20 lg:pb-32 lg:pt-28">

        {/* Background Glow */}

        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl">

          <div className="mx-auto max-w-4xl text-center">

            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              <ShieldCheck size={16} />
              Fair • Transparent • Structured Evaluation
            </div>

            <h1 className="mt-8 text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Make Hackathon Evaluation
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Fair & Transparent.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
              FairJudge helps hackathon organizers create structured
              evaluation rounds, assign judges, define scoring criteria,
              and generate transparent results.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">

              <button
                onClick={() => router.push("/register")}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-semibold transition hover:bg-blue-500"
              >
                Create Your Hackathon
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => {
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }}
                className="rounded-xl border border-slate-700 bg-slate-900 px-7 py-4 font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
              >
                Explore Platform
              </button>

            </div>

          </div>


          {/* ================= DASHBOARD PREVIEW ================= */}

          <div className="relative mx-auto mt-20 max-w-6xl">

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-3 shadow-2xl shadow-blue-950/40">

              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">

                {/* Fake Dashboard Header */}

                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

                  <div>
                    <p className="text-xs text-slate-500">
                      ORGANIZER DASHBOARD
                    </p>

                    <h3 className="mt-1 text-lg font-semibold">
                      Smart India Hackathon 2026
                    </h3>
                  </div>

                  <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Evaluation Active
                  </div>

                </div>


                {/* Dashboard Stats */}

                <div className="grid gap-4 p-6 md:grid-cols-4">

                  <DashboardStat
                    title="Teams"
                    value="48"
                    icon={<Users size={19} />}
                  />

                  <DashboardStat
                    title="Judges"
                    value="12"
                    icon={<Star size={19} />}
                  />

                  <DashboardStat
                    title="Rounds"
                    value="3"
                    icon={<ClipboardCheck size={19} />}
                  />

                  <DashboardStat
                    title="Evaluated"
                    value="82%"
                    icon={<BarChart3 size={19} />}
                  />

                </div>


                {/* Evaluation Preview */}

                <div className="grid gap-6 border-t border-slate-800 p-6 lg:grid-cols-[1.4fr_1fr]">

                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

                    <div className="flex items-center justify-between">

                      <div>
                        <p className="text-sm font-semibold">
                          Evaluation Progress
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Round 2 — Prototype Evaluation
                        </p>
                      </div>

                      <span className="text-sm font-semibold text-blue-400">
                        82%
                      </span>

                    </div>

                    <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full w-[82%] rounded-full bg-blue-500" />
                    </div>

                    <div className="mt-6 space-y-3">

                      <ProgressRow
                        label="Innovation"
                        value="95%"
                      />

                      <ProgressRow
                        label="Technical Feasibility"
                        value="84%"
                      />

                      <ProgressRow
                        label="Market Potential"
                        value="72%"
                      />

                    </div>

                  </div>


                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

                    <p className="text-sm font-semibold">
                      Top Projects
                    </p>

                    <div className="mt-5 space-y-4">

                      <ProjectRank
                        rank="01"
                        name="HealthSync AI"
                        score="94.8"
                      />

                      <ProjectRank
                        rank="02"
                        name="GreenTech Solutions"
                        score="91.4"
                      />

                      <ProjectRank
                        rank="03"
                        name="SafeRoute"
                        score="89.7"
                      />

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= FEATURES ================= */}

      <section
        id="features"
        className="border-y border-slate-800 bg-slate-900/40 px-6 py-24"
      >

        <div className="mx-auto max-w-7xl">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Powerful Evaluation System
            </p>

            <h2 className="mt-4 text-4xl font-bold">
              Everything You Need for
              Fair Evaluation
            </h2>

            <p className="mt-4 text-slate-400">
              Manage the entire hackathon evaluation workflow from one
              structured platform.
            </p>

          </div>


          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <FeatureCard
              icon={<Scale size={24} />}
              title="Fair Evaluation"
              description="Structured scoring ensures every project is evaluated using the same standards."
            />

            <FeatureCard
              icon={<ClipboardCheck size={24} />}
              title="Custom Criteria"
              description="Create evaluation criteria with weighted scoring levels for every round."
            />

            <FeatureCard
              icon={<Users size={24} />}
              title="Judge Management"
              description="Assign judges to specific teams and projects across multiple rounds."
            />

            <FeatureCard
              icon={<Trophy size={24} />}
              title="Transparent Results"
              description="Automatically calculate scores and generate clear project rankings."
            />

          </div>

        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}

      <section
        id="how-it-works"
        className="px-6 py-28"
      >

        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Simple Workflow
            </p>

            <h2 className="mt-4 text-4xl font-bold">
              From Registration to Results
            </h2>

            <p className="mt-4 text-slate-400">
              FairJudge organizes the complete hackathon evaluation process
              into a simple and transparent workflow.
            </p>

          </div>


          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-5">

            <StepCard
              number="01"
              title="Create Hackathon"
              description="Set up your hackathon and configure basic details."
            />

            <StepCard
              number="02"
              title="Add Rounds"
              description="Create multiple evaluation rounds."
            />

            <StepCard
              number="03"
              title="Set Criteria"
              description="Define weighted scoring criteria."
            />

            <StepCard
              number="04"
              title="Assign Judges"
              description="Assign judges to projects for evaluation."
            />

            <StepCard
              number="05"
              title="Generate Results"
              description="Calculate scores and rank projects."
            />

          </div>

        </div>

      </section>


      {/* ================= ROLE SECTION ================= */}

      <section
        id="roles"
        className="bg-slate-900/40 px-6 py-28"
      >

        <div className="mx-auto max-w-7xl">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Built For Everyone
            </p>

            <h2 className="mt-4 text-4xl font-bold">
              One Platform. Three Roles.
            </h2>

          </div>


          <div className="mt-16 grid gap-6 md:grid-cols-3">

            <RoleCard
              icon={<BarChart3 size={28} />}
              role="Organizer"
              description="Create hackathons, manage rounds, criteria, judges and monitor evaluation progress."
              points={[
                "Create hackathons",
                "Configure evaluation rounds",
                "Assign judges",
                "View results",
              ]}
            />

            <RoleCard
              icon={<ClipboardCheck size={28} />}
              role="Judge"
              description="Review assigned projects and evaluate them using structured scoring criteria."
              points={[
                "View assignments",
                "Review projects",
                "Score criteria",
                "Submit evaluations",
              ]}
            />

            <RoleCard
              icon={<Trophy size={28} />}
              role="Participant"
              description="Join hackathons, manage teams, submit projects and track evaluation results."
              points={[
                "Create teams",
                "Submit projects",
                "Track progress",
                "View results",
              ]}
            />

          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}

      <section className="px-6 py-28">

        <div className="mx-auto max-w-5xl rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 to-slate-900 p-10 text-center md:p-16">

          <h2 className="text-4xl font-bold md:text-5xl">
            Ready to Make Evaluation Fair?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
            Create your hackathon, organize evaluation rounds,
            assign judges, and generate transparent results with FairJudge.
          </p>

          <button
            onClick={() => router.push("/register")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-semibold transition hover:bg-blue-500"
          >
            Get Started for Free
            <ArrowRight size={18} />
          </button>

        </div>

      </section>


      {/* ================= FOOTER ================= */}

      <footer className="border-t border-slate-800 px-6 py-10">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-sm text-slate-500 md:flex-row">

          <div className="flex items-center gap-2">

            <Scale
              size={18}
              className="text-blue-500"
            />

            <span>
              © 2026 FairJudge. Fair evaluation for better innovation.
            </span>

          </div>

          <div className="flex gap-6">

            <a
              href="#features"
              className="hover:text-slate-300"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="hover:text-slate-300"
            >
              Platform
            </a>

            <button
              onClick={() => router.push("/login")}
              className="hover:text-slate-300"
            >
              Login
            </button>

          </div>

        </div>

      </footer>

    </main>
  );
}


// ======================================================
// DASHBOARD STAT
// ======================================================

function DashboardStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

      <div className="flex items-center justify-between">

        <span className="text-xs text-slate-500">
          {title}
        </span>

        <span className="text-blue-400">
          {icon}
        </span>

      </div>

      <p className="mt-3 text-2xl font-bold">
        {value}
      </p>

    </div>
  );
}


// ======================================================
// PROGRESS ROW
// ======================================================

function ProgressRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <div className="flex justify-between text-xs">

        <span className="text-slate-400">
          {label}
        </span>

        <span className="text-slate-300">
          {value}
        </span>

      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">

        <div
          className="h-full rounded-full bg-blue-500"
          style={{
            width: value,
          }}
        />

      </div>

    </div>
  );
}


// ======================================================
// PROJECT RANK
// ======================================================

function ProjectRank({
  rank,
  name,
  score,
}: {
  rank: string;
  name: string;
  score: string;
}) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-3">

        <span className="text-sm font-bold text-blue-400">
          {rank}
        </span>

        <span className="text-sm text-slate-300">
          {name}
        </span>

      </div>

      <span className="text-sm font-semibold">
        {score}
      </span>

    </div>
  );
}


// ======================================================
// FEATURE CARD
// ======================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 transition hover:-translate-y-1 hover:border-blue-500/40">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>

    </div>
  );
}


// ======================================================
// STEP CARD
// ======================================================

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>

      <span className="text-5xl font-bold text-slate-800">
        {number}
      </span>

      <h3 className="mt-5 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>

    </div>
  );
}


// ======================================================
// ROLE CARD
// ======================================================

function RoleCard({
  icon,
  role,
  description,
  points,
}: {
  icon: React.ReactNode;
  role: string;
  description: string;
  points: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-7">

      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        {icon}
      </div>

      <h3 className="mt-6 text-2xl font-bold">
        {role}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {description}
      </p>

      <div className="mt-6 space-y-3">

        {points.map((point) => (
          <div
            key={point}
            className="flex items-center gap-3 text-sm text-slate-300"
          >
            <CheckCircle2
              size={16}
              className="text-blue-400"
            />

            {point}

          </div>
        ))}

      </div>

    </div>
  );
}