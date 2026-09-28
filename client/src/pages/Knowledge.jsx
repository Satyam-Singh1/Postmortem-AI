import { useState } from "react";
import { BookOpen, Plus, Search, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "../lib/api.js";
import { Card, CardBody } from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Spinner from "../components/Spinner.jsx";
import Badge, { typeTone } from "../components/Badge.jsx";

const TABS = [
  { id: "add", label: "Add knowledge", icon: Plus },
  { id: "search", label: "Search", icon: Search },
];

function AddKnowledge() {
  const [form, setForm] = useState({ type: "runbook", title: "", service: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { ok, message }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim() || loading) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await api.addKnowledge(form);
      setStatus({ ok: true, message: `Indexed "${form.title}" into ${res.chunks} chunk(s).` });
      setForm({ type: form.type, title: "", service: "", content: "" });
    } catch (e) {
      setStatus({ ok: false, message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const field =
    "w-full rounded-xl border border-white/10 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <Card className="animate-fade-in">
      <CardBody className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400">Type</label>
            <select value={form.type} onChange={set("type")} className={field}>
              <option value="runbook">runbook</option>
              <option value="incident">incident</option>
              <option value="postmortem">postmortem</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-slate-400">Service</label>
            <input
              value={form.service}
              onChange={set("service")}
              placeholder="e.g. checkout"
              className={field}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Title</label>
          <input
            value={form.title}
            onChange={set("title")}
            placeholder="e.g. Checkout DB Connection Pool Runbook"
            className={field}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-slate-400">Content</label>
          <textarea
            value={form.content}
            onChange={set("content")}
            rows={7}
            placeholder="Symptoms, root cause, resolution steps…"
            className={`${field} resize-none`}
          />
        </div>

        {status && (
          <div
            className={`flex items-center gap-2 rounded-xl p-3 text-sm ${
              status.ok
                ? "bg-emerald-500/10 text-emerald-200 ring-1 ring-inset ring-emerald-400/20"
                : "bg-rose-500/10 text-rose-200 ring-1 ring-inset ring-rose-400/20"
            }`}
          >
            {status.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            )}
            {status.message}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={submit} disabled={loading || !form.title.trim() || !form.content.trim()}>
            {loading ? <Spinner /> : <Plus className="h-4 w-4" />}
            {loading ? "Indexing…" : "Index knowledge"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function SearchKnowledge() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hits, setHits] = useState(null);

  const run = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setHits(null);
    try {
      const res = await api.search(query.trim(), type ? { sourceType: type } : {});
      setHits(res.hits);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const field =
    "rounded-xl border border-white/10 bg-ink-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="Semantic search across the knowledge base…"
            className={`${field} flex-1`}
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            <option value="">all types</option>
            <option value="runbook">runbook</option>
            <option value="incident">incident</option>
            <option value="postmortem">postmortem</option>
          </select>
          <Button onClick={run} disabled={loading || !query.trim()}>
            {loading ? <Spinner /> : <Search className="h-4 w-4" />}
            Search
          </Button>
        </CardBody>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-200 ring-1 ring-inset ring-rose-400/20">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          {error}
        </div>
      )}

      {hits && hits.length === 0 && (
        <p className="rounded-xl bg-white/[0.02] p-6 text-center text-sm text-slate-500 ring-1 ring-inset ring-white/5">
          No matches found. Try a different query or add some knowledge first.
        </p>
      )}

      {hits && hits.length > 0 && (
        <div className="flex flex-col gap-3">
          {hits.map((h, i) => {
            const pct = Math.round((h.score || 0) * 100);
            return (
              <Card key={i} className="animate-fade-in transition hover:bg-white/[0.05]">
                <CardBody className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge tone={typeTone[h.sourceType] || "slate"}>{h.sourceType}</Badge>
                      <span className="font-medium text-slate-200">{h.title}</span>
                      {h.service && <span className="text-xs text-slate-500">· {h.service}</span>}
                    </div>
                    <span className="shrink-0 font-mono text-xs text-slate-400">{pct}% match</span>
                  </div>
                  <p className="line-clamp-3 text-sm text-slate-400">{h.text}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Knowledge() {
  const [tab, setTab] = useState("add");

  return (
    <div className="flex flex-col gap-6">
      <header className="animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/20">
            <BookOpen className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Knowledge base</h1>
            <p className="text-sm text-slate-400">
              Add runbooks and past incidents, then search them semantically.
            </p>
          </div>
        </div>
      </header>

      <div className="flex gap-1 rounded-xl bg-white/5 p-1 ring-1 ring-inset ring-white/10 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "bg-indigo-500/20 text-indigo-200 ring-1 ring-inset ring-indigo-400/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "add" ? <AddKnowledge /> : <SearchKnowledge />}
    </div>
  );
}
