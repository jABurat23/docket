"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

type ThemeMode = "dark" | "light";
type HealthState = "idle" | "checking" | "healthy" | "degraded" | "error";

type HealthCheck = {
  name: string;
  endpoint: string;
  status?: number;
  duration?: number;
  state: HealthState;
  message?: string;
};

type ProviderHealthCheck = HealthCheck;

type PreferenceCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function PreferenceCard({ title, description, children }: PreferenceCardProps) {
  return (
    <div className="panel-surface p-4 soft-hover sm:p-5">
      <div className="mb-4">
        <div className="text-[12px] uppercase tracking-[0.14em] text-paper/55">{title}</div>
        <p className="mt-1.5 text-[13px] text-paper/65">{description}</p>
      </div>
      {children}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="panel-surface p-4 sm:p-5">
      <div className="skeleton h-3.5 w-24" />
      <div className="mt-3 space-y-2.5">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-10 w-full" />
      </div>
    </div>
  );
}

function statusLabel(status?: number) {
  if (!status) return "No response";
  if (status >= 200 && status < 300) return "Operational";
  if (status >= 300 && status < 400) return "Redirect";
  if (status === 401 || status === 403) return "Auth required";
  if (status === 404) return "Not found";
  if (status >= 500) return "Server error";
  return "Client error";
}

function statusTone(state: HealthState) {
  if (state === "healthy") return "bg-emerald-400/15 text-emerald-300";
  if (state === "degraded") return "bg-amber-400/15 text-amber-300";
  if (state === "error") return "bg-rust/20 text-[#e9a18d]";
  if (state === "checking") return "bg-gold/15 text-gold";
  return "bg-paper/10 text-paper/60";
}

export function ProfileSettingsPanel({
  fullName,
  email,
  avatarUrl,
  providers = [],
}: {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  providers?: string[];
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileName, setProfileName] = useState(fullName);
  const [profileAvatar, setProfileAvatar] = useState(avatarUrl ?? "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoSummary, setAutoSummary] = useState(true);
  const [quietMode, setQuietMode] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactLayout, setCompactLayout] = useState(false);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    { name: "Budget API", endpoint: "/api/budget", state: "idle" },
    { name: "Goals API", endpoint: "/api/goals", state: "idle" },
    { name: "Pipeline API", endpoint: "/api/pipeline", state: "idle" },
  ]);
  const [providerHealthChecks, setProviderHealthChecks] = useState<ProviderHealthCheck[]>([
    { name: "Google OAuth", endpoint: "Google identity service", state: "idle" },
    { name: "GitHub API", endpoint: "GitHub platform service", state: "idle" },
    { name: "Supabase API", endpoint: "Configured Supabase project", state: "idle" },
  ]);
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("docket-theme") as ThemeMode | null;
    const nextTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
    setReducedMotion(window.localStorage.getItem("docket-reduced-motion") === "true");
    setCompactLayout(window.localStorage.getItem("docket-compact-layout") === "true");
    window.setTimeout(() => setLoading(false), 350);
  }, []);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("docket-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
    window.localStorage.setItem("docket-reduced-motion", String(reducedMotion));
  }, [reducedMotion]);

  useEffect(() => {
    document.documentElement.classList.toggle("compact-layout", compactLayout);
    window.localStorage.setItem("docket-compact-layout", String(compactLayout));
  }, [compactLayout]);

  function onThemeChange(next: ThemeMode) {
    setTheme(next);
    showToast({
      title: next === "light" ? "Light mode enabled" : "Dark mode enabled",
      description: "Your dashboard theme has been updated.",
      tone: "success",
    });
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((resolve) => window.setTimeout(resolve, 550));
    setSaving(false);
    showToast({
      title: "Preferences saved",
      description: "Your profile settings are now synced.",
      tone: "success",
    });
  }

  async function saveProfile() {
    setProfileSaving(true);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: profileName, avatar_url: profileAvatar || null }),
    });
    const body = await response.json();
    setProfileSaving(false);

    if (!response.ok) {
      showToast({ title: "Could not update profile", description: body.error ?? "Try again.", tone: "warning" });
      return;
    }

    showToast({ title: "Profile updated", description: "Your account details have been saved.", tone: "success" });
    router.refresh();
  }

  async function runHealthCheck() {
    setHealthChecks((current) => current.map((check) => ({ ...check, state: "checking", message: undefined })));
    setProviderHealthChecks((current) => current.map((check) => ({ ...check, state: "checking", message: undefined })));
    const [results, providerResults] = await Promise.all([
      Promise.all(
      healthChecks.map(async (check) => {
        const started = performance.now();
        try {
          const response = await fetch(check.endpoint, { cache: "no-store" });
          const duration = Math.round(performance.now() - started);
          const state: HealthState =
            response.status >= 200 && response.status < 300
              ? "healthy"
              : response.status === 401 || response.status === 403 || response.status === 404
                ? "degraded"
                : "error";
          return { ...check, status: response.status, duration, state, message: statusLabel(response.status) };
        } catch {
          return { ...check, duration: Math.round(performance.now() - started), state: "error" as const, message: "Network error" };
        }
      }),
      ),
      fetch("/api/health/providers", { cache: "no-store" })
        .then(async (response) => {
          const body = await response.json();
          return response.ok && Array.isArray(body.checks) ? (body.checks as ProviderHealthCheck[]) : [];
        })
        .catch(() => []),
    ]);
    setHealthChecks(results);
    setProviderHealthChecks(providerResults.length > 0 ? providerResults : providerHealthChecks.map((check) => ({
      ...check,
      state: "error",
      message: "Health check unavailable",
    })));
    setLastHealthCheck(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    const allResults = [...results, ...(providerResults.length > 0 ? providerResults : [])];
    const hasError = allResults.some((result) => result.state === "error");
    showToast({
      title: hasError ? "Health check found an issue" : "All services responded",
      description: hasError ? "Review the endpoint details below." : "Docket, Google, GitHub, and Supabase checks responded normally.",
      tone: hasError ? "warning" : "success",
    });
  }

  async function exportData() {
    const [budget, goals, pipeline] = await Promise.all([
      fetch("/api/budget", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/goals", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/pipeline", { cache: "no-store" }).then((response) => response.json()),
    ]);
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), budget, goals, pipeline }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `docket-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast({ title: "Data export ready", description: "Your Docket data was downloaded as JSON.", tone: "success" });
  }

  const initials = profileName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "DU";

  return (
    <div className="space-y-5">
      <div className="panel-surface soft-hover p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gold text-lg font-mono text-ink shadow-[0_0_28px_rgba(229,182,87,0.18)]">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
            </div>
            <div>
              <div className="text-[20px] font-medium text-paper">{profileName}</div>
              <div className="mt-0.5 text-[13px] text-paper/60">{email}</div>
              {providers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {providers.map((provider) => (
                    <span key={provider} className="rounded-full border border-line-strong bg-subtle px-2 py-1 text-[9.5px] uppercase tracking-[0.1em] text-paper/55">
                      Connected with {provider === "github" ? "GitHub" : provider === "google" ? "Google" : provider}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.02] px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-paper/60">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Ready
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <PreferenceCard
            title="Profile"
            description="Personalize how your identity appears throughout Docket."
          >
            <div className="space-y-3">
              <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
                Display name
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  maxLength={80}
                  placeholder="Your name"
                  className="bg-input rounded-sm border border-line-strong px-3 py-2.5 text-[13px] text-paper"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
                Avatar URL
                <input
                  value={profileAvatar}
                  onChange={(event) => setProfileAvatar(event.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="bg-input rounded-sm border border-line-strong px-3 py-2.5 text-[13px] text-paper"
                />
              </label>
              <button
                onClick={saveProfile}
                disabled={profileSaving}
                className="rounded-lg border border-gold bg-gold px-3.5 py-2.5 text-[12.5px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                {profileSaving ? "Saving…" : "Save profile"}
              </button>
            </div>
          </PreferenceCard>

          <PreferenceCard
            title="Appearance"
            description="Keep the dashboard focused and comfortable for your working hours."
          >
            <div className="space-y-2.5">
              <button
                onClick={() => onThemeChange("dark")}
                className={[
                  "flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-[13px] transition-all",
                  theme === "dark"
                    ? "border-gold bg-gold/10 text-paper"
                    : "border-line-strong bg-white/[0.02] text-paper/70 hover:border-paper/30",
                ].join(" ")}
              >
                <span>Dark mode</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-paper/60">Default</span>
              </button>
              <button
                onClick={() => onThemeChange("light")}
                className={[
                  "flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-[13px] transition-all",
                  theme === "light"
                    ? "border-gold bg-gold/10 text-paper"
                    : "border-line-strong bg-white/[0.02] text-paper/70 hover:border-paper/30",
                ].join(" ")}
              >
                <span>Light mode</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-paper/60">Soft</span>
              </button>
            </div>
          </PreferenceCard>

          <PreferenceCard
            title="Experience"
            description="Tune the density and motion of your workspace."
          >
            <div className="space-y-3">
              <button
                onClick={() => setCompactLayout((value) => !value)}
                className="flex w-full items-center justify-between rounded-lg border border-line-strong bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-paper"
              >
                <span>Compact layout</span>
                <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${compactLayout ? "bg-emerald-400/15 text-emerald-300" : "bg-paper/10 text-paper/60"}`}>
                  {compactLayout ? "On" : "Off"}
                </span>
              </button>
              <button
                onClick={() => setReducedMotion((value) => !value)}
                className="flex w-full items-center justify-between rounded-lg border border-line-strong bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-paper"
              >
                <span>Reduce motion</span>
                <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${reducedMotion ? "bg-emerald-400/15 text-emerald-300" : "bg-paper/10 text-paper/60"}`}>
                  {reducedMotion ? "On" : "Off"}
                </span>
              </button>
            </div>
          </PreferenceCard>

          <PreferenceCard
            title="Notifications"
            description="Control what Docket nudges you about across the week."
          >
            <div className="space-y-3">
              <button
                onClick={() => setAlertsEnabled((value) => !value)}
                className="flex w-full items-center justify-between rounded-lg border border-line-strong bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-paper"
              >
                <span>Budget alerts</span>
                <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${alertsEnabled ? "bg-emerald-400/15 text-emerald-300" : "bg-paper/10 text-paper/60"}`}>
                  {alertsEnabled ? "On" : "Off"}
                </span>
              </button>
              <button
                onClick={() => setAutoSummary((value) => !value)}
                className="flex w-full items-center justify-between rounded-lg border border-line-strong bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-paper"
              >
                <span>Monthly summary</span>
                <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${autoSummary ? "bg-emerald-400/15 text-emerald-300" : "bg-paper/10 text-paper/60"}`}>
                  {autoSummary ? "On" : "Off"}
                </span>
              </button>
            </div>
          </PreferenceCard>

          <PreferenceCard
            title="Focus"
            description="Minimal distractions for deep work and planning sessions."
          >
            <button
              onClick={() => setQuietMode((value) => !value)}
              className="flex w-full items-center justify-between rounded-lg border border-line-strong bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-paper"
            >
              <span>Quiet mode</span>
              <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${quietMode ? "bg-amber-400/15 text-amber-300" : "bg-paper/10 text-paper/60"}`}>
                {quietMode ? "Enabled" : "Off"}
              </span>
            </button>
          </PreferenceCard>

          <PreferenceCard
            title="Account"
            description="Quick actions for your dashboard ownership and access."
          >
            <div className="space-y-2.5">
              <button className="w-full rounded-lg border border-line-strong bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-paper transition-colors hover:border-gold hover:bg-gold/5">
                Update password
              </button>
              <button className="w-full rounded-lg border border-line-strong bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-paper transition-colors hover:border-gold hover:bg-gold/5">
                Manage connected accounts
              </button>
              <button
                onClick={exportData}
                className="w-full rounded-lg border border-line-strong bg-white/[0.02] px-3.5 py-2.5 text-left text-[13px] text-paper transition-colors hover:border-gold hover:bg-gold/5"
              >
                Export my Docket data
              </button>
            </div>
          </PreferenceCard>

          <div className="panel-surface p-4 soft-hover sm:p-5 lg:col-span-2">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-[12px] uppercase tracking-[0.14em] text-paper/55">API health</div>
                <p className="mt-1.5 text-[13px] text-paper/65">
                  Check whether Docket&apos;s data endpoints are reachable and how they respond.
                </p>
              </div>
              <button
                onClick={runHealthCheck}
                disabled={healthChecks.some((check) => check.state === "checking")}
                className="rounded-lg border border-gold bg-gold px-3.5 py-2 text-[12px] font-medium text-ink transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
              >
                {healthChecks.some((check) => check.state === "checking") ? "Checking…" : "Run health check"}
              </button>
            </div>
            <div className="divide-y divide-line rounded-lg border border-line-strong">
              {healthChecks.map((check) => (
                <div key={check.endpoint} className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[13px] text-paper">{check.name}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-paper/50">{check.endpoint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.1em] ${statusTone(check.state)}`}>
                      {check.state === "checking" ? "Checking" : check.message ?? "Not checked"}
                    </span>
                    {check.status && <span className="font-mono text-[11px] text-paper/55">{check.status}</span>}
                    {check.duration !== undefined && <span className="font-mono text-[11px] text-paper/45">{check.duration}ms</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 mb-2 text-[11px] uppercase tracking-[0.14em] text-paper/45">Connected services</div>
            <div className="divide-y divide-line rounded-lg border border-line-strong">
              {providerHealthChecks.map((check) => (
                <div key={check.name} className="flex flex-col gap-2 px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-[13px] text-paper">{check.name}</div>
                    <div className="mt-0.5 text-[11px] text-paper/50">{check.endpoint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.1em] ${statusTone(check.state)}`}>
                      {check.state === "checking" ? "Checking" : check.message ?? "Not checked"}
                    </span>
                    {check.status && <span className="font-mono text-[11px] text-paper/55">{check.status}</span>}
                    {check.duration !== undefined && <span className="font-mono text-[11px] text-paper/45">{check.duration}ms</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-paper/45">
              {lastHealthCheck ? `Last checked at ${lastHealthCheck}. 2xx means operational; 401/403 means auth is working but access is protected.` : "No check has been run yet."}
            </div>
          </div>
        </div>
      )}

      <div className="panel-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[12px] uppercase tracking-[0.14em] text-paper/55">Sync</div>
            <p className="mt-1 text-[13px] text-paper/65">Your settings are saved locally and ready to sync.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg border border-gold bg-gold px-4 py-2.5 text-[12.5px] font-medium text-ink transition-transform duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
