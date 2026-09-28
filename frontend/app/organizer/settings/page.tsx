"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  ArrowLeft,
  Bell,
  Shield,
  Lock,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const router = useRouter();

  const { user, token, loading } = useAuth();

  const [emailNotifications, setEmailNotifications] =
    useState(true);

  const [publicProfile, setPublicProfile] =
    useState(false);

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
        <div className="max-w-[1000px] mx-auto px-6 py-6">
          <button
            onClick={() => router.push("/organizer")}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-white mb-4"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Settings size={20} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Settings
              </h1>

              <p className="text-xs text-gray-500 mt-1">
                Manage your FairJudge organizer preferences.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-6 py-8 space-y-5">
        <SettingCard
          icon={<Bell size={18} />}
          title="Notifications"
          description="Control how FairJudge notifies you."
        >
          <Toggle
            label="Email Notifications"
            description="Receive important updates by email."
            enabled={emailNotifications}
            setEnabled={setEmailNotifications}
          />
        </SettingCard>

        <SettingCard
          icon={<Shield size={18} />}
          title="Privacy"
          description="Manage your organizer profile visibility."
        >
          <Toggle
            label="Public Organizer Profile"
            description="Allow your organizer profile to be visible."
            enabled={publicProfile}
            setEnabled={setPublicProfile}
          />
        </SettingCard>

        <SettingCard
          icon={<Lock size={18} />}
          title="Security"
          description="Manage your account security."
        >
          <button
            onClick={() =>
              alert("Password change feature can be connected next.")
            }
            className="px-4 py-2.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.04] text-xs"
          >
            Change Password
          </button>
        </SettingCard>
      </main>
    </div>
  );
}

function SettingCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/[0.08] bg-[#0A1525] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
          {icon}
        </div>

        <div>
          <h2 className="font-semibold text-sm">
            {title}
          </h2>

          <p className="text-[10px] text-gray-600 mt-1">
            {description}
          </p>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function Toggle({
  label,
  description,
  enabled,
  setEnabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium">
          {label}
        </p>

        <p className="text-[10px] text-gray-600 mt-1">
          {description}
        </p>
      </div>

      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-11 h-6 rounded-full transition ${
          enabled
            ? "bg-blue-600"
            : "bg-gray-700"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}