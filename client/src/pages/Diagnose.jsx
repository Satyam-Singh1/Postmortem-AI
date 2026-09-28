import { useState } from "react";
import { Stethoscope, AlertTriangle, Sparkles, RotateCcw } from "lucide-react";
import { api } from "../lib/api.js";
import { Card, CardBody } from "../components/Card.jsx";
import Button from "../components/Button.jsx";
import Spinner from "../components/Spinner.jsx";
import Markdown from "../components/Markdown.jsx";
import EvidenceTrace from "../components/EvidenceTrace.jsx";
import LearningLoop from "../components/LearningLoop.jsx";

const examples = [
  "Checkout is timing out and database connections are maxed during a flash sale.",
  "Payments API returning 503s after the latest deploy.",
  "Search service latency spiked; cache hit rate dropped to near zero.",
];

const loadingStages = [
  "Retrieving similar incidents…",
  "Fetching service runbook…",
  "Reasoning over the evidence…",
];

export default function Diagnose() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [diagnosedQuery, setDiagnosedQuery] = useState("");
  const [stage, setStage] = useState(0);

  const run = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setStage(0);
    const ticker = setInterval(
      () => setStage((s) => (s + 1) % loadingStages.length),
      1400,
    );
    try {
      const data = await api.diagnose(query.trim());
      setResult(data);
      setDiagnosedQuery(query.trim());
    } catch (e) {
      setError(e.message);
    } finally {
      clearInterval(ticker);
      setLoading(false);
    }
  };

  const reset = () => {
    setQuery("");
    setResult(null);
    setError("");
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/20">
            <Stethoscope className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Diagnose an incident</h1>
            <p className="text-sm text-slate-400">
              Describe the symptoms — the agent will gather evidence and propose a grounded fix.
            </p>
          </div>
        </div>
      </header>

      {/* Input */}
      <Card className="animate-fade-in">
        <CardBody className="flex flex-col gap-4">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            rows={4}
            placeholder="e.g. Checkout is timing out and DB connections are maxed during a sale…"
            className="w-full resize-none rounded-xl border border-white/10 bg-ink-950/60 p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-400/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <div className="flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400 ring-1 ring-inset ring-white/10 transition hover:bg-white/10 hover:text-slate-200"
              >
                {ex.length > 46 ? ex.slice(0, 46) + "…" : ex}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">⌘/Ctrl</kbd> +{" "}
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono">Enter</kbd>
            </span>
            <div className="flex gap-2">
              {(result || error) && (
                <Button variant="subtle" size="md" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              )}
              <Button onClick={run} disabled={loading || !query.trim()}>
                {loading ? <Spinner /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Diagnosing…" : "Diagnose"}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="animate-scale-in">
          <CardBody className="flex items-center gap-3 text-sm text-slate-300">
            <Spinner className="text-indigo-400" />
            <span>{loadingStages[stage]}</span>
          </CardBody>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200 animate-fade-in">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <p className="font-medium">Diagnosis failed</p>
            <p className="text-rose-300/80">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <Card className="animate-scale-in">
                <CardBody>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-300">
                    <Sparkles className="h-4 w-4" />
                    Diagnosis
                  </div>
                  <Markdown>{result.answer}</Markdown>
                </CardBody>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card className="animate-fade-in">
                <CardBody>
                  <EvidenceTrace steps={result.steps} />
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Learning loop — teach the system from this incident */}
          <LearningLoop key={diagnosedQuery} query={diagnosedQuery} />
        </>
      )}
    </div>
  );
}
