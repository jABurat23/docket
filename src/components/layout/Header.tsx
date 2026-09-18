import Link from "next/link";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

export function Header({
  userEmail,
  fullName,
  avatarUrl,
  providers,
  activeProvider,
}: {
  userEmail: string;
  fullName: string;
  avatarUrl?: string | null;
  providers?: string[];
  activeProvider?: string;
}) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-line pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-5 sm:pb-5">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.02] px-2.5 py-1 text-[10.5px] font-mono uppercase tracking-[0.18em] text-paper/60">
          personal finance
        </div>
        <Link href="/dashboard" className="block transition-opacity duration-200 hover:opacity-80" aria-label="Go to overview">
          <img src="/docket-brand.jpg" alt="Docket" className="h-12 w-40 rounded object-cover object-center sm:h-14 sm:w-48" />
        </Link>
        <div className="font-mono text-[10px] text-paper/60 sm:text-[12px]">{today}</div>
      </div>

      <div className="self-start rounded-full border border-line-strong bg-white/[0.02] px-2.5 py-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm sm:self-auto">
        <ProfileMenu
          fullName={fullName}
          email={userEmail}
          avatarUrl={avatarUrl}
          providers={providers}
          activeProvider={activeProvider}
        />
      </div>
    </header>
  );
}
