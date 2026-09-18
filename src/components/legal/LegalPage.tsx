import Link from "next/link";

export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="text-[12px] uppercase tracking-[0.14em] text-gold hover:opacity-80">
          Docket
        </Link>
        <div className="mt-10 border-b border-line pb-6">
          <h1 className="font-display text-4xl tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-3 text-[13px] text-paper/55">Effective date: {effectiveDate}</p>
        </div>
        <article className="prose prose-invert mt-8 max-w-none text-[14px] leading-7 text-paper/75 [&_h2]:mt-9 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:tracking-[-0.03em] [&_h2]:text-paper [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium [&_h3]:text-paper [&_a]:text-gold [&_a]:underline [&_strong]:text-paper">
          {children}
        </article>
        <div className="mt-12 flex gap-4 border-t border-line pt-5 text-[12px] text-paper/55">
          <Link href="/privacy" className="hover:text-paper">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-paper">Terms of Service</Link>
        </div>
      </div>
    </main>
  );
}
