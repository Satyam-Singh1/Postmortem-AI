import { useEffect, useState } from "react";
import { cn } from "../lib/cn.js";
import { api } from "../lib/api.js";

// Polls /api/health and shows a live connection indicator.
export default function HealthBadge() {
  const [status, setStatus] = useState("checking"); // checking | online | offline

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        await api.health();
        if (alive) setStatus("online");
      } catch {
        if (alive) setStatus("offline");
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const map = {
    checking: { dot: "bg-amber-400", text: "Checking…", ring: "bg-amber-400/60" },
    online: { dot: "bg-emerald-400", text: "API online", ring: "bg-emerald-400/60" },
    offline: { dot: "bg-rose-400", text: "API offline", ring: "bg-rose-400/60" },
  };
  const s = map[status];

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-inset ring-white/10">
      <span className="relative flex h-2.5 w-2.5">
        {status !== "offline" && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              s.ring,
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", s.dot)} />
      </span>
      <span className="text-xs font-medium text-slate-300">{s.text}</span>
    </div>
  );
}
