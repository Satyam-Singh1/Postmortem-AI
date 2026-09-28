import { Search, BookOpen, Cpu, ArrowRight, Sparkles } from "lucide-react";
import Badge from "./Badge.jsx";

const toolMeta = {
  search_similar_incidents: { icon: Search, label: "Searched similar incidents", tone: "rose" },
  fetch_runbook: { icon: BookOpen, label: "Fetched runbook", tone: "emerald" },
};

function ScoreBar({ score }) {
  const pct = Math.max(0, Math.min(100, Math.round((score || 0) * 100)));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[11px] text-slate-400">{pct}%</span>
    </div>
  );
}

function ResultPreview({ name, content }) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return <p className="text-xs text-slate-400">{String(content).slice(0, 200)}</p>;
  }

  if (name === "search_similar_incidents") {
    const items = parsed.incident || [];
    if (!items.length) {
      return <p className="text-xs text-slate-500">No similar incidents found.</p>;
    }
    return (
      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg bg-white/[0.03] p-3 ring-1 ring-inset ring-white/5">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-200">{it.title}</span>
              <ScoreBar score={it.score} />
            </div>
            <p className="line-clamp-2 text-xs text-slate-400">{it.text}</p>
          </li>
        ))}
      </ul>
    );
  }

  if (name === "fetch_runbook") {
    const items = parsed.runbooks || [];
    if (!items.length) {
      return <p className="text-xs text-slate-500">No runbook found for this service.</p>;
    }
    return (
      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg bg-white/[0.03] p-3 ring-1 ring-inset ring-white/5">
            <span className="text-sm font-medium text-slate-200">{it.title}</span>
            <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-slate-400">{it.content}</p>
          </li>
        ))}
      </ul>
    );
  }

  return <pre className="overflow-x-auto text-xs text-slate-400">{content}</pre>;
}

export default function EvidenceTrace({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Cpu className="h-4 w-4 text-indigo-400" />
        Agent reasoning trace
        <Badge tone="indigo" className="ml-1">
          {steps.filter((s) => s.kind === "tool_call").length} tool calls
        </Badge>
      </div>

      <ol className="relative flex flex-col gap-3 border-l border-white/10 pl-5">
        {steps.map((step, i) => {
          const meta = toolMeta[step.name] || { icon: Sparkles, label: step.name, tone: "slate" };
          const Icon = meta.icon;
          return (
            <li key={i} className="relative animate-fade-in">
              <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full bg-ink-800 ring-1 ring-white/10">
                <Icon className="h-3 w-3 text-indigo-300" />
              </span>

              {step.kind === "tool_call" ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-300">{meta.label}</span>
                  <ArrowRight className="h-3 w-3 text-slate-600" />
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11px] text-indigo-200">
                    {JSON.stringify(step.args)}
                  </code>
                </div>
              ) : (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Result · {step.name}
                  </div>
                  <ResultPreview name={step.name} content={step.content} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
