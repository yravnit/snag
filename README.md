# Snag

Single-page B2B SaaS QA & PM agent. Search a company, triage review complaints into bugs, and get a RICE-prioritized action plan — streamed live through a 4-node workflow visualizer.

## Stack

- Next.js 16 (App Router), TypeScript, Tailwind CSS (dark mode only)
- `@mendable/firecrawl-js` for web search
- `@google/genai` for structured model output (`gemma-4-31b-it`, fallback `gemini-3.5-flash-lite`)
- `zod`, `@xyflow/react`, `recharts`, `lucide-react`, `docx`

## Setup

```bash
npm install
cp .env.example .env.local
# fill in FIRECRAWL_API_KEY and GEMINI_API_KEY in .env.local
npm run dev
```

Open http://localhost:3000.

## Usage

- **Run Agent** — calls `POST /api/analyze`; the route streams step status over SSE and finishes with a `complete` event containing the full audit JSON.
- **Load Instant Demo: Recruit CRM** — Loads `src/data/demo-recruit-crm.json` with zero API calls.
- Results dashboard: KPIs, issue-type/severity charts, filterable bug table, RICE table, expandable user stories, and client-side `.md` / `.docx` exports.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build (also runs TypeScript)
npm start       # production server
npx eslint .    # lint (Next 16 no longer lints during build)
```

## Layout

```
src/app/page.tsx                  single-page UI + SSE client
src/app/api/analyze/route.ts      streaming agent endpoint
src/components/AgentGraph.tsx     React Flow status visualizer
src/components/Dashboard.tsx      results dashboard
src/components/ExportButtons.tsx  .md/.docx buttons
src/lib/schemas.ts                Zod schemas + inferred types
src/lib/exportUtils.ts            client-side export builders
src/data/demo-recruit-crm.json    cached demo audit
```

No database, auth, or extra routes. API keys stay server-side in the route handler.

## Notes

Next.js 16 enables Cache Components by default, so the route does not set `runtime`/`dynamic` segment config. The structured-output model falls back from Gemma to Flash Lite when Gemma is unavailable or returns invalid JSON.
