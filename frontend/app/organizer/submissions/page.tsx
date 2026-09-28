"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  ArrowLeft,
  Search,
  Upload,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function SubmissionsPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user || !token) {
      router.replace("/login");
      return;
    }

    if (String(user.role).toUpperCase() !== "ORGANIZER") {
      router.replace("/login");
    }
  }, [loading, user, token, router]);

  if (loading || !user || !token) {
    return (
      <div className="min-h-screen bg-[#060D19] flex items-center justify-center text-white">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060D19] text-white">
      <header className="border-b border-white/[0.06]">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <button
            onClick={() => router.push("/organizer")}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-white mb-4"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <FileText size={20} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Submissions
                </h1>

                <p className="text-xs text-gray-500 mt-1">
                  Review project submissions from participating teams.
                </p>
              </div>
            </div>

            <button
              onClick={() => alert("Submission import feature coming next.")}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium flex items-center gap-2"
            >
              <Upload size={14} />
              Import
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard title="Total Submissions" value="0" />
          <StatCard title="Pending Review" value="0" />
          <StatCard title="Evaluated" value="0" />
        </div>

        <section className="rounded-xl border border-white/[0.08] bg-[#0A1525]">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">
                All Submissions
              </h2>

              <p className="text-[10px] text-gray-600 mt-1">
                Team project submissions will appear here.
              </p>
            </div>

            <div className="flex items-center gap-2 border border-white/[0.08] rounded-lg px-3 py-2">
              <Search size={13} className="text-gray-600" />

              <input
                placeholder="Search..."
                className="bg-transparent outline-none text-xs text-white placeholder:text-gray-600 w-32"
              />
            </div>
          </div>

          <div className="py-20 text-center">
            <div className="w-14 h-14 mx-auto rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <FileText size={25} />
            </div>

            <h3 className="mt-5 font-semibold">
              No submissions yet
            </h3>

            <p className="mt-2 text-xs text-gray-600 max-w-sm mx-auto">
              Once teams submit their projects, you will be able to
              review them from this section.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0A1525] p-5">
      <p className="text-[10px] text-gray-600">
        {title}
      </p>

      <p className="text-2xl font-bold mt-2">
        {value}
      </p>
    </div>
  );
}