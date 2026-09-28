import { cn } from "../lib/cn.js";

const tones = {
  indigo: "bg-indigo-500/15 text-indigo-300 ring-indigo-400/20",
  violet: "bg-violet-500/15 text-violet-300 ring-violet-400/20",
  emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
  amber: "bg-amber-500/15 text-amber-300 ring-amber-400/20",
  rose: "bg-rose-500/15 text-rose-300 ring-rose-400/20",
  slate: "bg-slate-500/15 text-slate-300 ring-slate-400/20",
};

// Map a knowledge sourceType to a tone.
export const typeTone = {
  incident: "rose",
  runbook: "emerald",
  postmortem: "amber",
};

export default function Badge({ tone = "slate", className, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone] || tones.slate,
        className,
      )}
    >
      {children}
    </span>
  );
}
