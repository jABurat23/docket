"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/budget", label: "Budget" },
  { href: "/dashboard/report", label: "Report" },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/pipeline", label: "Pipeline" },
];

export function SpineNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[96px] shrink-0 border-r border-line bg-nav backdrop-blur-md md:flex md:flex-col md:items-center md:py-6">
        <Link
          href="/dashboard"
          className="mb-8 flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-[radial-gradient(circle_at_30%_30%,rgba(229,182,87,0.18),transparent_55%)] font-display text-[18px] text-gold shadow-[0_0_24px_rgba(229,182,87,0.18)] transition-transform duration-200 hover:scale-105"
          aria-label="Go to overview"
        >
          D
        </Link>

        <nav className="flex w-full flex-1 flex-col items-center justify-center gap-4">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex w-full items-center justify-center border-l-2 py-2 text-[11px] font-medium tracking-[0.14em] uppercase transition-all duration-200 [writing-mode:vertical-rl] ${
                  active
                    ? "border-gold text-paper"
                    : "border-transparent text-paper/45 hover:border-paper/40 hover:text-paper"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="sticky top-0 z-20 border-b border-line bg-nav px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong bg-[radial-gradient(circle_at_30%_30%,rgba(229,182,87,0.18),transparent_55%)] font-display text-[15px] text-gold"
            aria-label="Go to overview"
          >
            D
          </Link>

          <nav className="flex min-w-0 flex-1 items-center justify-start gap-1.5 overflow-x-auto pl-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] transition-all duration-200 ${
                    active
                      ? "border-gold bg-gold/10 text-paper"
                      : "border-line-strong bg-white/[0.02] text-paper/60 hover:border-paper/30 hover:text-paper"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
