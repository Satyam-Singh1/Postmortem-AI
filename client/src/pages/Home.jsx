import { Link } from "react-router-dom";
import {
  Stethoscope,
  BookOpen,
  Search,
  Cpu,
  Database,
  Network,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardBody } from "../components/Card.jsx";
import Button from "../components/Button.jsx";

const features = [
  {
    icon: Search,
    title: "Retrieval-Augmented Memory",
    desc: "Past incidents and runbooks are embedded with Gemini and stored in Pinecone for semantic recall.",
  },
  {
    icon: Cpu,
    title: "Autonomous LangGraph Agent",
    desc: "A ReAct agent decides which tools to call, gathers evidence, and reasons to a grounded diagnosis.",
  },
  {
    icon: Network,
    title: "MCP-Style Tooling",
    desc: "fetch_runbook and search_similar_incidents are LangChain tools the agent invokes on demand.",
  },
  {
    icon: Database,
    title: "Grounded, Not Hallucinated",
    desc: "Answers cite the actual similar incident and runbook steps — only what the tools return.",
  },
];

const pipeline = [
  { label: "Incident", tone: "text-rose-300" },
  { label: "RAG retrieve", tone: "text-indigo-300" },
  { label: "Agent + tools", tone: "text-violet-300" },
  { label: "Grounded fix", tone: "text-emerald-300" },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      {/* Hero */}
      <section className="animate-fade-in">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-inset ring-white/10">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          Incident-to-Knowledge Learning System
        </div>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-100 sm:text-5xl">
          Diagnose incidents with{" "}
          <span className="text-gradient">institutional memory</span>.
        </h1>
        <p className="mt-4 max-w-xl text-base text-slate-400">
          PostmortemAI turns messy incident history into reusable knowledge. During
          a live incident, the agent surfaces{" "}
          <span className="text-slate-200">
            "we've seen this before — here's the fix that worked."
          </span>
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button as={Link} to="/diagnose" size="lg">
            <Stethoscope className="h-4.5 w-4.5" />
            Start diagnosing
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button as={Link} to="/knowledge" variant="ghost" size="lg">
            <BookOpen className="h-4.5 w-4.5" />
            Manage knowledge
          </Button>
        </div>

        {/* Pipeline */}
        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
          {pipeline.map((p, i) => (
            <div key={p.label} className="flex items-center gap-2">
              <span
                className={`rounded-lg bg-white/5 px-3 py-1.5 font-medium ring-1 ring-inset ring-white/10 ${p.tone}`}
              >
                {p.label}
              </span>
              {i < pipeline.length - 1 && (
                <ArrowRight className="h-4 w-4 text-slate-600" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="transition hover:bg-white/[0.05]">
            <CardBody className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500/10 ring-1 ring-inset ring-indigo-400/20">
                <Icon className="h-5 w-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-100">{title}</h3>
                <p className="mt-1 text-sm text-slate-400">{desc}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </section>
    </div>
  );
}
