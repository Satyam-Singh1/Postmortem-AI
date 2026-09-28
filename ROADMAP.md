# 🚨 PostmortemAI — Development Roadmap & Architecture

> **Incident-to-Knowledge Learning System**
> Turns messy incident data into reusable organizational memory. During a live
> incident, an AI agent surfaces *"we've seen this before — here's the root
> cause and the fix that worked."*

---

## 1. Vision & Problem

**The real-world software-industry problem:** Engineering teams repeatedly
re-fight the same outages because incident learnings are never captured or
reused. Postmortems get written and forgotten. Tribal knowledge lives in
people's heads and leaves when they do.

**What PostmortemAI does:**
1. Ingests incidents, timelines, logs, runbooks, and postmortems.
2. Builds a searchable, embeddings-backed knowledge base (RAG).
3. During a live incident, an AI agent retrieves similar past incidents,
   fetches the relevant runbook, reads current metrics, and produces a
   grounded diagnosis with recommended next actions.

---

## 2. Tech Stack (Java-free, all JavaScript)

| Layer        | Technology |
|--------------|------------|
| Frontend     | React.js (Vite), HTML, CSS, Tailwind CSS |
| Backend      | Node.js, Express.js, REST APIs |
| SQL DB       | PostgreSQL (Neon free tier) — incidents, timelines, services, action items |
| Document DB  | MongoDB (Atlas free tier) — knowledge originals, logs, metrics |
| Vector DB    | **Pinecone** (free tier) via LangChain `PineconeStore` — RAG chunk embeddings |
| RAG          | LangChain.js (text splitter + embeddings + Pinecone retrieval) |
| Agent        | LangGraph.js (stateful graph orchestration) |
| MCP          | `@modelcontextprotocol/sdk` — server + tools |
| LLM / Embeds | Google Gemini (free tier) — `gemini-embedding-001` (3072-dim) + chat |

**Config principle:** **Gemini** (`GOOGLE_API_KEY`) and **Pinecone**
(`PINECONE_API_KEY` + `PINECONE_INDEX`) are **required** — embeddings and the
vector store have no offline fallback (kept simple on purpose). Postgres and
Mongo still fall back to in-memory stores when their URLs are absent. The
embedding dimension is **3072** (Gemini `gemini-embedding-001`), which must match
the Pinecone index.

---

## 3. High-Level Architecture

```
 React (Vite + Tailwind)
        │  REST (JSON)
        ▼
 Express API  ────────────────────────────────────────────────┐
        │                                                      │
        ├──▶ LangGraph Agent                                   │
        │      retrieve → gatherTools → diagnose → respond     │
        │            │            │            │               │
        │            ▼            ▼            ▼               │
        │        RAG (LangChain)  MCP Tools    LLM             │
        │            │            │            │               │
        ├──▶ RAG engine ──────────┼────────────┘               │
        │      (PineconeStore)    │                            │
        └──▶ MCP server ──────────┘                            │
                     │                                         │
     ┌───────────────┼──────────────┬──────────────┐          │
     ▼               ▼              ▼              ▼          ▼
 PostgreSQL      MongoDB        Pinecone       Gemini API
 (Neon)          (Atlas)        (vectors)      chat + embeddings
 incidents,      knowledge,     RAG chunk      (embeddings + chat,
 timelines,      logs,          embeddings     3072-dim)
 services        metrics        + metadata
```

---

## 4. AI Agent Flow (LangGraph State Machine)

```
START
  │
  ▼
[retrieve]        RAG: PineconeStore.similaritySearch(query, k) → top-k chunks
  │
  ▼
[gatherTools]     LangChain tools:
  │                 • search_similar_incidents (Pinecone / incident match)
  │                 • fetch_runbook            (doc store)
  │                 (get_metrics — DEFERRED, add only if diagnosis needs live signals)
  ▼
[diagnose]        Gemini LLM synthesizes a grounded answer from retrieved
  │               context + tool outputs
  ▼
[respond]         Format final diagnosis + citations + next actions
  │
  ▼
END
```

**Agent state shape:**
```
{
  query: string,
  incidentId?: string,
  context: RagHit[],          // from retrieve
  similarIncidents: [...],    // from gatherTools
  runbook: {...} | null,      // from gatherTools
  answer: string              // from diagnose
}
```

---

## 5. Data Models

### MongoDB Atlas (documents) ✅ live
- **knowledge** — full runbooks/postmortems/incidents:
  `{ id, type, title, service, content }` — persisted in Atlas, survives restarts,
  shared across processes. Used by `ragIndexDocument` (write) + `fetch_runbook`
  (read via `getRunbooks`).
- **logs** — `{ id, service, ts, level, message }` — ⛔ DEFERRED (no component uses it yet)
- **metrics** — `{ id, service, ts, name, value }` — ⛔ DEFERRED (build with a live-signals enhancement)

### PostgreSQL (structured) — ⛔ DEFERRED until the incident-CRUD component (C4)
- **services** — `id, name, team, tier`
- **incidents** — `id, title, service, severity, status, summary, root_cause,
  resolution, tags[], created_at, resolved_at`
- **timeline_events** — `id, incident_id, ts, kind, message`
- **action_items** — `id, incident_id, description, owner, status`

### Pinecone (vector store, via LangChain `PineconeStore`) ✅
- One index (name from `PINECONE_INDEX`), **dimension 3072**, metric `cosine`.
- Each vector = one RAG chunk. LangChain stores:
  - `values` — the 3072-dim Gemini embedding
  - `metadata` — `{ sourceId, sourceType, title, service, text }`
- `sourceType` distinguishes `runbook` / `postmortem` / `incident` for
  filtered retrieval (e.g. `search_similar_incidents` filters `incident`).
- Chunk originals live in the doc store `knowledge`; Pinecone holds the
  searchable chunk embeddings + a copy of each chunk's text in metadata.

---

## 6. REST API Surface

| Method | Route | Purpose |
|--------|-------|---------|
| GET    | `/api/health` | Liveness + provider/DB mode |
| GET    | `/api/stats` | Dashboard counts |
| GET    | `/api/incidents` | List (filter by status/service) |
| POST   | `/api/incidents` | Create incident |
| GET    | `/api/incidents/:id` | Detail + timeline + action items |
| PATCH  | `/api/incidents/:id` | Update (status, root_cause, resolution) |
| POST   | `/api/incidents/:id/timeline` | Add timeline event |
| POST   | `/api/incidents/:id/actions` | Add action item |
| POST   | `/api/diagnose` | Run the AI agent on a query/incident |
| POST   | `/api/search` | RAG knowledge search |
| POST   | `/api/knowledge` | Index a runbook/postmortem |
| POST   | `/api/seed` | Load demo data |

---

## 7. Folder Structure

> Status: Milestone 0 built; Milestone 1 (RAG over Pinecone) in progress.
> Vectors now live in Pinecone, so there is no `vectors` collection in Mongo.

```
postmortem-ai/
├─ package.json                 # npm workspaces root         (M0) ✅
├─ .env.example                 #                             (M0) ✅
├─ .gitignore                   #                             (M0) ✅
├─ ROADMAP.md                   # (this file)                 ✅ exists
├─ README.md                    #                             (M7)
├─ server/
│  ├─ package.json              #                             (M0) ✅
│  └─ src/
│     ├─ index.js               # Express entry               (M4)
│     ├─ config/env.js          #                             (M0) ✅
│     ├─ utils/logger.js        #                             (M0) ✅
│     ├─ utils/similarity.js    # (optional after Pinecone)   (M0) ✅
│     ├─ db/postgres.js         #                             (M0) ✅
│     ├─ db/mongo.js            # knowledge/logs/metrics       (M0) ✅
│     ├─ ai/provider.js         # getEmbeddings + getVectorStore (M0/M1) ✅
│     ├─ ai/rag.js              #                             (M1)
│     ├─ mcp/tools.js           #                             (M2)
│     ├─ mcp/server.js          #                             (M2)
│     ├─ mcp/stdio.js           #                             (M2)
│     ├─ agent/graph.js         #                             (M3)
│     ├─ routes/*.js            #                             (M4)
│     └─ seed/seed.js           #                             (M5)
└─ client/
   └─ src/
      ├─ main.jsx, App.jsx      #                             (M6)
      ├─ lib/api.js             #                             (M6)
      ├─ components/*           #                             (M6)
      └─ pages/
         ├─ Dashboard.jsx       #                             (M6)
         ├─ IncidentDetail.jsx  #                             (M6)
         ├─ Diagnose.jsx        #                             (M6)
         └─ Knowledge.jsx       #                             (M6)
```

---

## 8. Milestone Plan (detailed)

Legend: ▶ next · ⬜ planned · ✅ done
Each milestone lists: goal, files, step-by-step tasks, key signatures,
gotchas, and a Definition of Done (DoD).

> ### 🧭 Build philosophy — feature-by-feature (incremental)
> We do **not** write every function in a file up front. We build **one feature
> at a time** and implement only the helper functions that feature needs, **at
> the moment it needs them** (just-in-time).
>
> - **Component-by-component, not file-by-file.** We build a whole *vertical
>   slice* that delivers value (e.g. "diagnose an incident"), wiring only the
>   functions/tools/data that slice needs. We do **not** pre-build tools, data
>   methods, or schemas just because a list mentions them.
> - When a feature (e.g. `ragIndexDocument`) needs a data method
>   (e.g. `insertKnowledge`), we add *just that method* to the data layer then.
> - Data-layer files like `db/mongo.js` therefore **grow over time** — they
>   start with only the methods currently required and gain more as later
>   components call for them.
> - The method/tool tables listed per milestone are the **eventual/possible**
>   surface (a target), not a "write it all now" checklist. Items marked
>   **DEFERRED** are built only if/when a component actually needs them.
> - Trade-off accepted: we revisit files across components, in exchange for
>   always-runnable, easy-to-understand, minimal code at each step.

---

### 🧩 Components (vertical slices) & status

| # | Component (capability) | Status | Notes |
|---|------------------------|--------|-------|
| C1 | Knowledge ingestion + retrieval (RAG over Pinecone) | ✅ done | `ragIndexDocument`, `ragSearch` |
| C2 | Agent tools (LangChain `tool()`) | 🔨 in progress | `fetch_runbook` ✅ · `search_similar_incidents` ▶ |
| C3 | Diagnosis agent (LangGraph) | ⬜ | ties tools + LLM → grounded answer |
| C4 | REST API + React UI | ⬜ | expose diagnose + browse |
| C5 | Seed / demo data | ⬜ | only what built components use |
| C6 | MCP external exposure (server + stdio) | ⬜ | showcase; wrap the same tools |
| E* | Enhancements (DEFERRED) | ⛔ | live metrics/logs tools, Postgres incident CRUD — build only when a component needs them |

---

### ▶ Milestone 0 — Foundations & Tooling

**Goal:** A runnable monorepo skeleton with config, logging, both DB layers
(real driver + in-memory fallback), and the AI provider (Gemini + mock).

**Files:** `package.json` (root), `.gitignore`, `.env.example`,
`server/package.json`, `server/src/config/env.js`, `server/src/utils/logger.js`,
`server/src/utils/similarity.js`, `server/src/db/postgres.js`,
`server/src/db/mongo.js`, `server/src/ai/provider.js`.

**Steps:**
1. **Root workspace** — `package.json` with `"workspaces": ["server","client"]`,
   `"type": "module"`, and scripts: `dev` (concurrently server+client),
   `dev:server`, `dev:client`, `start`, `seed`, `build`. Add `concurrently` as a
   devDependency.
2. **.gitignore** — `node_modules/`, `dist/`, `.env`, `*.log`, `.vite/`, etc.
3. **.env.example** — document every variable (PORT, CLIENT_ORIGIN, AI_PROVIDER,
   GOOGLE_API_KEY, GEMINI_CHAT_MODEL, GEMINI_EMBED_MODEL, DATABASE_URL,
   MONGODB_URI, MONGODB_DB). All optional — emphasize zero-config fallback.
4. **server/package.json** — `"type": "module"`; scripts `dev`
   (`node --watch src/index.js`), `start`, `seed`, `mcp`; dependencies: `express`,
   `cors`, `morgan`, `dotenv`, `pg`, `mongodb`, `nanoid`, `zod`, `langchain`,
   `@langchain/core`, `@langchain/google-genai`, `@langchain/langgraph`,
   `@langchain/textsplitters`, `@modelcontextprotocol/sdk`.
5. **config/env.js** — load `.env` (root + server), export a `config` object and
   the booleans `hasGeminiKey`, `usePostgres`, `useMongo`.
6. **utils/logger.js** — leveled logger (`debug/info/warn/error`) with scope tags.
7. **utils/similarity.js** — `cosineSimilarity(a,b)` and
   `topKBySimilarity(queryVec, docs, k)`. *(No longer used by RAG after the
   Pinecone switch; kept only if needed for ad-hoc incident matching.)*
8. **db/postgres.js** — export `initPostgres()` + `getSqlStore()`. Two classes:
   `PostgresStore` (uses `pg.Pool`, `CREATE TABLE IF NOT EXISTS` schema) and
   `MemoryStore` (arrays). Repo methods: `createService`, `listServices`,
   `createIncident`, `updateIncident`, `getIncident` (joins timeline + actions),
   `listIncidents`, `addTimelineEvent`, `addActionItem`, `stats`, `clearAll`.
9. **db/mongo.js** — export `getDocStore()` (+ `initMongo()` for real Atlas).
   Collections/arrays: `knowledge`, `logs`, `metrics` (**no `vectors`** — those
   live in Pinecone now). Methods (added just-in-time): `insertKnowledge`,
   `getRunbooks`, `insertLog`, `queryLogs`, `insertMetric`, `getMetrics`,
   `clearAll`.
10. **ai/provider.js** — export `getEmbeddings()` returning a **LangChain
    `Embeddings` object** (`GoogleGenerativeAIEmbeddings`, 3072-dim), and later
    `chat(system,user)→string`. Requires `GOOGLE_API_KEY` (no mock fallback —
    kept simple). *(RAG no longer calls a raw `embed()` — the Pinecone vector
    store consumes the `Embeddings` object directly.)*
11. **db/pinecone.js** *(new)* — export `getVectorStore()` that builds a
    `PineconeStore` from an existing Pinecone index using `getEmbeddings()`.

**Gotchas:** ESM everywhere (`import`); on Windows use `npm.cmd` if PowerShell
blocks `npm.ps1`; Neon requires SSL (`ssl: { rejectUnauthorized: false }`);
Pinecone index dimension must be **3072** and metric `cosine`.

**DoD:** `npm install` succeeds; stores initialize; `getEmbeddings().embedQuery("hi")`
returns a 3072-length vector from Gemini.

---

### ▶ Milestone 1 — RAG Engine over Pinecone (`server/src/ai/rag.js`)  *(in progress)*

**Goal:** Chunk knowledge → store embeddings in **Pinecone** via LangChain, and
retrieve top-k relevant chunks with `similaritySearch`. Built
**feature-by-feature**: vector-store access → index path → search path.

**Signatures:**
```js
async function chunkText(text)          // -> string[]
async function ragIndexDocument(doc)    // {id?,type,title,service,tags?,content} -> {docId,chunks}
async function ragSearch(query, opts)   // {k=5,service?} -> [{text,title,service,sourceType,score}]
```

**Feature 1a — Vector store access (in `ai/provider.js`):**
1. `import { Pinecone } from "@pinecone-database/pinecone"` and
   `import { PineconeStore } from "@langchain/pinecone"` (co-located with
   `getEmbeddings` — one AI file, no separate `pinecone.js`).
2. Create the client (`new Pinecone({ apiKey: config.pinecone.apiKey })`), grab
   the single default index handle (`pc.Index(config.pinecone.index)`).
3. `getVectorStore()` → `await PineconeStore.fromExistingIndex(getEmbeddings(),
   { pineconeIndex, maxConcurrency: 5 })`. Cache the instance (singleton).
4. **Config:** `config.pinecone = { apiKey, index }` in `env.js` and
   `PINECONE_API_KEY`, `PINECONE_INDEX` in `.env`. ✅ done.

**Feature 1b — Indexing (write path):**
1. `chunkText` → `new RecursiveCharacterTextSplitter({chunkSize:800,chunkOverlap:120}).splitText(text)`
   (import from `@langchain/textsplitters`; use `splitText`, not `splitDocuments`).
2. `ragIndexDocument` →
   - `getDocStore().insertKnowledge(doc)` (keep the full original in Mongo),
   - `const chunks = await chunkText(doc.content)`,
   - build LangChain `Document`s: `{ pageContent: chunk, metadata: { sourceId:
     saved.id, sourceType: doc.type, title: doc.title, service: doc.service } }`,
   - `await (await getVectorStore()).addDocuments(documents)` — LangChain embeds
     + upserts to Pinecone for you (no manual embedding loop),
   - return `{ docId: saved.id, chunks: chunks.length }`.
3. **Data-layer method needed now:** `insertKnowledge` (already exists).

**Feature 1c — Retrieval (read path):**
1. `ragSearch(query, { k = 5 })` →
   - `const store = await getVectorStore()`,
   - `const results = await store.similaritySearchWithScore(query, k)`,
   - map to `{ text: doc.pageContent, title, service, sourceType, score }`.
   (Default index only — no metadata filters/namespaces, kept simple.)

**Gotchas:** Pinecone index must exist first (dim 3072, cosine); `addDocuments`
embeds internally — don't pre-embed; metadata keys used in filters must be stored
at index time; keep chunk text in `pageContent` so search can return it.

**DoD:** `ragIndexDocument` on a sample runbook upserts vectors to Pinecone and
returns `chunks > 0`; `ragSearch("database connection pool exhausted")` returns
ranked hits with `score`, most relevant first.


---

### 🔨 Milestone 2 (Component C2) — Agent Tools (`server/src/mcp/tools.js`)

**Goal:** Build the LangChain tools the diagnosis agent (C3) actually needs —
nothing more. MCP external exposure is a separate component (C6).

**Design principle (matches M1):** define each tool ONCE with LangChain's
`tool()` helper (`@langchain/core/tools`) → a `StructuredTool` with name,
description, zod schema, and `.invoke()`. The same `tools` array plugs into
LangGraph's `ToolNode`/`createReactAgent` (C3). Prefer LangChain/Pinecone over
custom plumbing; no speculative data layers.

**Tools to build now (only what C3 needs):**
1. `fetch_runbook({ service })` → doc store `getRunbooks({ service })`. ✅ done
2. `search_similar_incidents({ query, k })` → Pinecone similarity search over
   `sourceType: 'incident'` vectors (reuses the M1 RAG/Pinecone flow); returns
   ranked `[{ title, service, score, text }]`. ▶ next
   - Needs a small helper (e.g. `ragSearch(query, { k, sourceType })` filter, or
     a dedicated incident search) — add it just-in-time.

**DEFERRED (do NOT build yet):**
- `get_metrics` / metrics + logs data methods — build only if we later decide the
  diagnosis needs live signals (an enhancement component).

**DoD:** `fetch_runbook` and `search_similar_incidents` each run via
`.invoke(args)` and return structured JSON; both are exported in the `tools`
array for C3.

---

### ⬜ Component C6 — MCP Server exposure (`server/src/mcp/server.js`, `stdio.js`)

**Goal:** Expose the *same* `tools` array over MCP for external clients (Claude
Desktop, etc.) — the project's MCP showcase. Built after the agent works (or
whenever we want external access), not before.

**Steps:**
1. **server.js** — build an MCP `Server` from `@modelcontextprotocol/sdk`;
   iterate the `tools` array: advertise each in `ListTools`
   (`name`, `description`, `zodToJsonSchema(tool.schema)`) and dispatch
   `CallTool` → `tool.invoke(args)`.
2. **stdio.js** — connect the server to `StdioServerTransport` so tools work in
   Claude Desktop / other MCP hosts. Runnable via `npm run mcp`.

**Gotchas:** the tool's zod `schema` both validates inputs and generates the MCP
JSON schema (via `zod-to-json-schema`); Pinecone is shared across processes but
the in-memory doc store is not — the external stdio path only sees doc data if
seeded in that process (the in-process agent path is fully populated).

**DoD:** `node src/mcp/stdio.js` starts and lists the tools to an MCP client.

---

### ⬜ Milestone 3 (Component C3) — LangGraph Agent (`server/src/agent/graph.js`)

**Goal:** A stateful agent that reasons over RAG + tools to diagnose incidents.

**Signature:** `async function diagnoseIncident(query, incidentId?) -> { answer, evidence }`

**Steps:**
1. Define state channels: `query, incidentId, context, similarIncidents,
   runbook, answer`.
2. Build a `StateGraph` (or `createReactAgent`) using the LangChain `tools`
   array from C2 directly (`ToolNode`) — no MCP needed in-process:
   - **retrieve** → `ragSearch(query)` into `context`.
   - **gatherTools** → invoke `search_similar_incidents` + `fetch_runbook`.
   - **diagnose** → build a grounded prompt from context + tool outputs and call
     a Gemini chat model (add `getChatModel()` to `provider.js` just-in-time).
   - **respond** → package `{ answer, evidence }`.
3. Edges: `START→retrieve→gatherTools→diagnose→respond→END`. Compile and export
   `diagnoseIncident`.

**Gotchas:** reuse the same `tools` from C2 (don't redefine); make each node
resilient (empty tool results shouldn't throw); `getChatModel()` uses
`ChatGoogleGenerativeAI` (requires `GOOGLE_API_KEY`, no mock).

**DoD:** one call returns a readable diagnosis plus the structured evidence used.

---

### ⬜ Milestone 4 — REST API (`server/src/routes/`, `server/src/index.js`)

**Goal:** Expose everything over HTTP for the frontend.

**Steps:**
1. **index.js** — create Express app: `cors({origin:CLIENT_ORIGIN})`,
   `express.json()`, `morgan('dev')`. On boot: `await initPostgres()` +
   `await initMongo()`, then `app.listen(PORT)`. Add a central error handler.
2. **routes/health.js** — `GET /api/health` → `{ ok, aiMode, sqlMode, docMode }`.
3. **routes/incidents.js** — implement the incident + timeline + action-item
   endpoints from §6 using the SQL store.
4. **routes/ai.js** — `POST /api/diagnose` (calls `diagnoseIncident`),
   `POST /api/search` (calls `ragSearch`), `POST /api/knowledge`
   (calls `ragIndexDocument`).
5. **routes/admin.js** — `GET /api/stats`, `POST /api/seed` (calls the seeder).
6. Mount all routers under `/api`.

**Gotchas:** wrap async handlers so rejections hit the error middleware; validate
request bodies with zod; return proper status codes.

**DoD:** server boots on `:4000`; every endpoint returns valid JSON against the
in-memory fallback (verify with `curl`).

---

### ⬜ Milestone 5 (Component C5) — Seed Data (`server/src/seed/seed.js`)

**Goal:** Realistic demo data so the agent finds genuine "similar incidents".
Seed **only what the built components use** — nothing speculative.

**Steps:**
1. Clear the doc store + the Pinecone index so re-seeding is idempotent.
2. Insert **runbooks** (doc store `knowledge`) for a handful of services.
3. Insert **past incidents** and index them into Pinecone via `ragIndexDocument`
   with `type/sourceType: 'incident'` so `search_similar_incidents` can find them
   (include title, service, root cause, resolution in the content).
4. (DEFERRED) logs/metrics + Postgres incident rows — only once those components
   exist.
5. Make it runnable via `npm run seed` (and later `POST /api/seed`).

**Gotchas:** keep content textually rich so retrieval works well; make it
idempotent (clear then insert); Pinecone upserts are eventually consistent —
allow a moment before searching.

**DoD:** after seeding, a diagnose call with a DB-timeout query surfaces the
matching past incident + runbook.

---

### ⬜ Milestone 6 — React Frontend (`client/`)

**Goal:** A polished dashboard to browse incidents and talk to the agent.

**Steps:**
1. Scaffold Vite React app in `client/`; install `tailwindcss postcss autoprefixer`,
   run `npx tailwindcss init -p`, add Tailwind directives to `index.css`.
2. Set a dev proxy so `/api` → `http://localhost:4000`.
3. **lib/api.js** — thin fetch wrapper (`getStats`, `listIncidents`, `getIncident`,
   `diagnose`, `searchKnowledge`, `seed`).
4. **App.jsx** — layout with sidebar nav + routes (React Router).
5. **Pages:**
   - **Dashboard** — stat cards + incident list (filter by status/service).
   - **IncidentDetail** — header, timeline, action items, "Diagnose with AI" button.
   - **Diagnose** — chat-style console; shows answer + evidence (similar incidents,
     runbook, metrics) with a provider-mode badge.
   - **Knowledge** — RAG search box + ranked results with scores.
6. **Components** — `StatCard`, `IncidentCard`, `SeverityBadge`, `EvidencePanel`,
   `Timeline`, `Loader`.

**Gotchas:** handle loading/empty/error states; show whether AI is in `gemini` or
`mock` mode; keep API base configurable.

**DoD:** full click-through demo: view dashboard → open incident → run diagnose →
search knowledge, all against the live API.

---

### ⬜ Milestone 7 — Integration, Docs & Polish

**Goal:** Ship-ready repo that a stranger can clone and run.

**Steps:**
1. Write `README.md`: overview, architecture diagram, tech stack, feature list,
   setup (Git, Neon, Atlas, Pinecone, Gemini), run commands, screenshots, MCP usage.
2. End-to-end verification: (a) Gemini embeddings + Pinecone, and
   (b) real Gemini + Neon + Atlas + Pinecone.
3. Add a short demo script / walkthrough.
4. Optional: Dockerfile/compose, basic tests, CI.

**DoD:** fresh clone → `npm install` → set `PINECONE_*` in `.env` →
`npm run seed` → `npm run dev` works and the demo flow passes.

---

## 9. Working Agreement

- **You write the code; I guide and review each step (you drive).**
- **Feature-by-feature, just-in-time:** we implement one feature at a time and
  only add the helper/data-layer functions that feature needs, when it needs
  them. Files grow incrementally; we accept revisiting them later.
- Per feature: I provide a precise spec (signatures, requirements, gotchas) →
  you implement → I review before moving on.

---

## 10. External Setup Checklist (do in parallel)

- [ ] Install **Git** (not currently on PATH) for version control.
- [ ] Create a free **Pinecone** account → API key → `PINECONE_API_KEY`, and
      create an index (**dimension 3072, metric cosine**) → `PINECONE_INDEX`.
      **Required** — the vector store has no offline fallback.
- [ ] Create a free **Gemini API key** → `GOOGLE_API_KEY`. **Required** —
      embeddings have no mock fallback.
- [ ] Create a free **Neon** PostgreSQL DB → `DATABASE_URL` (optional; in-memory
      fallback otherwise).
- [ ] Create a free **MongoDB Atlas** cluster → `MONGODB_URI` (optional; in-memory
      fallback otherwise).
- [ ] Use `npm.cmd` on Windows if PowerShell blocks `npm.ps1` (execution policy).

---

## 11. How to Run (target state)

```bash
# from postmortem-ai/
npm install           # installs server + client workspaces
cp .env.example .env  # REQUIRED: set PINECONE_API_KEY + PINECONE_INDEX
                      # optional: GOOGLE_API_KEY, DATABASE_URL, MONGODB_URI
npm run seed          # load demo data (upserts vectors to Pinecone)
npm run dev           # server (:4000) + client (:5173) together
```

---

## 12. Progress Tracker

| Component | Capability | Status |
|-----------|------------|--------|
| C1 | Knowledge ingestion + retrieval (RAG/Pinecone) | ✅ done |
| C2 | Agent tools (`fetch_runbook` ✅, `search_similar_incidents` ✅) | ✅ done |
| C3 | Diagnosis agent (LangGraph) | ✅ done |
| C4 | REST API + React UI | ▶ next |
| C5 | Seed / demo data | ⬜ planned |
| C6 | MCP external exposure (server + stdio) | ⬜ planned |
| E* | Enhancements (metrics/logs, Postgres CRUD) | ⛔ deferred until needed |


