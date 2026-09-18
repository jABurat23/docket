import Link from "next/link";
import { ProfileSettingsPanel } from "@/components/profile/ProfileSettingsPanel";
import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function ProfilePage() {
  const context = await getActiveWorkspace();
  const supabase = context?.supabase ?? createClient();
  const user = context?.user;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user?.id)
    .single();
  const providers = [...new Set((user?.identities ?? []).map((identity) => identity.provider))];

  return (
    <section className="space-y-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[28px] tracking-[-0.04em]">Account</h2>
          <p className="mt-1 text-[13px] text-paper/60">Your profile, preferences, and focus controls.</p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-sm border border-line-strong bg-white/[0.02] px-3.5 py-2 text-[12.5px] text-paper transition-colors hover:border-gold hover:bg-gold/5"
        >
          ← Overview
        </Link>
      </div>

      <ProfileSettingsPanel
        fullName={context?.identity.name ?? profile?.full_name ?? user?.email ?? "Account"}
        email={context?.identity.email ?? user?.email ?? "No email on file"}
        avatarUrl={context?.identity.avatarUrl ?? profile?.avatar_url ?? null}
        providers={providers}
      />
    </section>
  );
}
