import { NavLink } from "react-router-dom";
import { Activity, Stethoscope, BookOpen, Github } from "lucide-react";
import { cn } from "../lib/cn.js";
import HealthBadge from "./HealthBadge.jsx";

const nav = [
  { to: "/", label: "Overview", icon: Activity, end: true },
  { to: "/diagnose", label: "Diagnose", icon: Stethoscope },
  { to: "/knowledge", label: "Knowledge Base", icon: BookOpen },
];

const stack = ["RAG", "LangGraph", "MCP", "Pinecone", "Gemini"];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-900/40">
        <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-slate-100">PostmortemAI</div>
        <div className="text-[11px] text-slate-500">Incident Intelligence</div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col gap-6 border-r border-white/5 bg-ink-900/60 px-5 py-6 backdrop-blur-sm">
      <Logo />

      <nav className="flex flex-col gap-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-indigo-500/15 text-indigo-200 ring-1 ring-inset ring-indigo-400/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
              )
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <div>
          <div className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Powered by
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stack.map((s) => (
              <span
                key={s}
                className="rounded-md bg-white/5 px-2 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-inset ring-white/10"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        <HealthBadge />

        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-1 text-xs text-slate-500 transition hover:text-slate-300"
        >
          <Github className="h-3.5 w-3.5" />
          View source
        </a>
      </div>
    </aside>
  );
}
