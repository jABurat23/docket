"use client";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="panel-surface p-6 text-center">
      <h2 className="font-display text-2xl">Something went wrong</h2>
      <p className="mt-2 text-[13px] text-paper/60">Docket could not load this dashboard view.</p>
      <button
        onClick={reset}
        className="mt-5 rounded-sm border border-gold bg-gold px-4 py-2 text-[12.5px] font-medium text-ink"
      >
        Try again
      </button>
    </div>
  );
}
