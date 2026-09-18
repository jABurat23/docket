"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { invalidateClientCache } from "@/lib/client-cache";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function ProfileMenu({
  fullName,
  email,
  avatarUrl,
  providers = [],
  activeProvider,
}: {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  providers?: string[];
  activeProvider?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    document.cookie = "docket-provider=; path=/; max-age=0; samesite=lax";
    invalidateClientCache("budget-transactions", "goals", "pipeline-entries");
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full px-1.5 py-1 text-left transition-colors hover:bg-subtle"
        aria-label="Open profile menu"
      >
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gold text-[12px] font-mono font-medium text-ink shadow-[0_0_16px_rgba(229,182,87,0.28)]">
          {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(fullName)}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block max-w-[150px] truncate text-[12.5px] font-medium text-paper">{fullName}</span>
          <span className="block max-w-[150px] truncate text-[10.5px] text-paper/55">{email}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-[48px] z-20 w-[min(220px,calc(100vw-2rem))] rounded-xl border border-line-strong bg-elevated p-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
          <div className="mb-1.5 border-b border-line px-2.5 py-2.5">
            <div className="text-[13.5px] text-paper">{fullName}</div>
            <div className="mt-0.5 text-[11.5px] text-paper/60">{email}</div>
            {activeProvider && (
              <div className="mt-2 text-[10px] uppercase tracking-[0.12em] text-gold">
                {activeProvider} workspace
              </div>
            )}
            {providers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {providers.map((provider) => (
                  <span
                    key={provider}
                    className="rounded-full border border-line-strong bg-subtle px-1.5 py-0.5 text-[9.5px] uppercase tracking-[0.1em] text-paper/55"
                  >
                    {provider === "github" ? "GitHub" : provider === "google" ? "Google" : provider}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push("/dashboard");
            }}
            className="w-full rounded-sm px-2.5 py-2 text-left text-[13px] text-paper transition-colors hover:bg-white/5"
          >
            Overview
          </button>
          <button
            onClick={() => {
              setOpen(false);
              router.push("/dashboard/profile");
            }}
            className="w-full rounded-sm px-2.5 py-2 text-left text-[13px] text-paper transition-colors hover:bg-white/5"
          >
            Account
          </button>
          <button
            onClick={logout}
            className="mt-1 w-full rounded-sm px-2.5 py-2 text-left text-[13px] text-rust transition-colors hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
