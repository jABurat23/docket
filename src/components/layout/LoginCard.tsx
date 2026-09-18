"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Provider = "google" | "github";

const PROVIDERS: { id: Provider; label: string; badge: string; color: string; text: string }[] = [
  { id: "google", label: "Continue with Google", badge: "G", color: "bg-[#E3B34E]", text: "text-ink" },
  { id: "github", label: "Continue with GitHub", badge: "GH", color: "bg-[#C7CBCF]", text: "text-ink" },
];

export function LoginCard() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
      ? "Sign in could not be completed. Please choose a provider and try again."
      : null,
  );

  async function signInWith(provider: Provider) {
    document.cookie = `docket-provider=${provider}; path=/; max-age=31536000; samesite=lax`;
    setLoadingProvider(provider);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (signInError) {
      setLoadingProvider(null);
      setError("Unable to start sign in. Check the provider configuration and try again.");
    }
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-line-strong bg-panel p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm sm:p-9">
      <div className="mb-7 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border border-[rgba(229,182,87,0.8)] bg-[radial-gradient(circle_at_30%_30%,rgba(229,182,87,0.2),transparent_55%)] flex items-center justify-center font-display text-[26px] text-gold shadow-[0_0_24px_rgba(229,182,87,0.2)]">
          D
        </div>
      </div>

      <div className="text-center mb-7">
        <div className="font-display text-3xl tracking-[-0.04em] mb-1.5">Docket</div>
        <p className="text-[13px] text-paper/60 leading-relaxed">
          Keep your pipeline, budget, and monthly report in one place.
        </p>
      </div>

      <div className="space-y-2.5">
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => void signInWith(p.id)}
            disabled={loadingProvider !== null}
            className="group w-full flex items-center gap-3 border border-line-strong rounded-sm px-4 py-3 text-left text-sm font-medium text-paper transition-all duration-200 hover:border-gold hover:bg-gold/5 hover:translate-y-[-1px]"
          >
            <span
              className={`w-7 h-7 rounded-sm flex items-center justify-center text-[10.5px] font-mono font-semibold ${p.color} ${p.text}`}
            >
              {p.badge}
            </span>
            <span>{loadingProvider === p.id ? "Connecting…" : p.label}</span>
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-center text-[12px] text-rust">{error}</p>}

      <div className="mt-6 pt-5 border-t border-line text-center text-[11.5px] text-paper/50">
        Secure sign in with Supabase Auth
      </div>
    </div>
  );
}
