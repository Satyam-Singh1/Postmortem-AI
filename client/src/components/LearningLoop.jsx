import { useState } from "react";
import { Brain, CheckCircle2, AlertTriangle, Save, Sparkles } from "lucide-react";
import { api } from "../lib/api.js";
import { Card, CardBody } from "./Card.jsx";
import Button from "./Button.jsx";
import Spinner from "./Spinner.jsx";

// The learning loop: capture how an incident was resolved and index it back into
// the knowledge base so the agent "remembers" it for future diagnoses.
export default function LearningLoop({ query }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(query?.slice(0, 90) || "");
  const [service, setService] = useState("");
  const [resolution, setResolution] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!title.trim() || !resolution.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const content = [
        `Incident: ${title.trim()}`,
        `Problem: ${query}`,
        `Resolution: ${resolution.trim()}`,
      ].join("\n");
      await api.addKnowledge({
        type: "incident",
        title: title.trim(),
        service: service.trim(),
        content,
      });
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full rounded-xl border border-white/10 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

  if (saved) {
    return (
      <Card className="animate-scale-in border-emerald-400/20 bg-emerald-500/[0.06]">
        <CardBody className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 ring-1 ring-inset ring-emerald-400/20">
            <Sparkles className="h-5 w-5 text-emerald-300" />
          </div>
          <div>
            <p className="font-medium text-emerald-200">Added to the knowledge base</p>
            <p className="text-sm text-emerald-300/70">
              PostmortemAI will surface this incident the next time something similar happens.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-emerald-400/25 bg-emerald-500/[0.04] p-4 text-left transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.08]"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/20">
          <Brain className="h-5 w-5 text-emerald-300" />
        </div>
        <div>
          <p className="font-medium text-slate-100">Close the loop — teach PostmortemAI</p>
          <p className="text-sm text-slate-400">
            Save how this was resolved so the system remembers it next time.
          </p>
        </div>
      </button>
    );
  }

  return (
    <Card className="animate-scale-in border-emerald-400/15">
      <CardBody className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <Brain className="h-4 w-4" />
          Save resolved incident
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Service</label>
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. checkout"
              className={field}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">
            How was it resolved?
          </label>
          <textarea
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            rows={4}
            placeholder="Root cause and the exact steps that fixed it…"
            className={`${field} resize-none`}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/20">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="subtle" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={loading || !title.trim() || !resolution.trim()}
            className="!bg-gradient-to-b !from-emerald-500 !to-emerald-600 hover:!from-emerald-400 hover:!to-emerald-500"
          >
            {loading ? <Spinner /> : <Save className="h-4 w-4" />}
            {loading ? "Saving…" : "Save to knowledge base"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
