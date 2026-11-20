# Progress

> Rule: Keep this ultra-brief. Only list what is done and a 1-line note on how it was implemented. No timestamps, no fluff.

- [x] **Project Setup & Schemas** — Next.js 16 App Router + Tailwind scaffold; Zod schemas in `src/lib/schemas.ts` shared by Gemini and types.
- [x] **SSE Backend (`/api/analyze`)** — Streaming `ReadableStream` route: 3 Firecrawl searches, dedupe, two structured model calls, `complete` event. `gemma-4-31b-it` primary with `gemini-3.5-flash-lite` fallback.
- [x] **Cached Demo Data (`demo-recruit-crm.json`)** — Realistic Recruit CRM audit matching `AuditReportSchema` (16 bugs, 5 RICE items, 3 stories).
- [x] **n8n Workflow Graph (`AgentGraph.tsx`)** — React Flow 4-node status visualizer, locked pan/zoom/drag, animated incoming edges.
- [x] **Dashboard UI (`Dashboard.tsx`)** — 4 KPIs, 2 Recharts charts, filterable bug table, RICE table, expandable user stories.
- [x] **MD & DOCX Exports (`ExportButtons.tsx`)** — Client-side Blob `.md` + `docx` Packer `.docx`, no backend.
- [x] **Integration & Build Check (`page.tsx`)** — SSE consumer + 2.5s demo animation wired; `npm run build` and `npx eslint .` both clean.
- [x] **AgentGraph Polish** — Widened cards (224px) so sublabels/badges no longer wrap or truncate; removed first/last outer handles so nothing clips at container edges; added icon chips, shadows, dividers. Swapped Geist for Inter (body) + Plus Jakarta Sans (display) in `layout.tsx`/`globals.css`.
- [x] **ui-sdk Setup** — Installed `@ui-sdk/react` + `@ui-sdk/core`; `globals.css` starts with `@layer ui-sdk` / Tailwind / `@ui-sdk/core/web.css` layer(components); AGENTS.md note added; `ui-sdk` skill installed to `.agents/skills`. Build clean.
- [x] **Contrast Fix** — Graph sublabels bumped from `text-zinc-500` 10px to `text-zinc-300` 11px medium.
- [x] **Full ui-sdk UI Rewrite** — `page.tsx` uses Field/Input/InputClear/Button; `Dashboard.tsx` uses Select filters and Collapsible stories; `ExportButtons.tsx` uses Button. Dark `--ui-*` tokens in `globals.css`; agent bridge with WebMCP in `src/lib/agent.ts`. Agent-readiness tests added (vitest + testing-library). `npm run build`, `npm test`, `npx eslint .` all pass; visually checked in browser.
- [x] **Pipeline Metrics** — icons and badges removed; each card now shows dynamic value/label metrics from real counts. SSE route emits `StepMetric[]` (queries, signals, bugs, P0/P1, initiatives, stories); demo derives the same from demo data. Pipeline widens during runs and smoothly shrinks after; node spacing increased.
- [x] **Snag Rebrand** — ProductPulse AI renamed to Snag in header, metadata, README/AGENTS, dashboard footer, export titles/filenames. Header now centered text-only (icon + subtitle removed), Ethnocentric self-hosted via `next/font/local` from `public/fonts/ethnocentric.woff`, bold and larger; `npm run build` clean.
- [x] **Dashboard Cleanup & Pagination** — Removed audit subtitle, KPI hint lines, and bug root-cause second lines; bumped bug table to `text-sm`; added 4-per-page pager capped at 5 pages with filter reset; removed agent-node status dots; placeholder examples now lead with Zoho Recruit. `npx tsc --noEmit` + `npm test` pass; verified in browser.
- [x] **Card Content Centering** — Centered KPI card label/value and agent-node label/metrics text within their cards.
- [x] **Font Size Consistency** — Matched PM Action Plan table, section heading, and user-story rows to the Bug Triage table's `text-sm`.
- [x] **Pre-Deploy Hardening** — `maxDuration = 60` exported from `/api/analyze`; removed 5-page cap from bug pager; `overflow-x-hidden` on `<body>`; Markdown table cells sanitized against `|`/newlines. `npm run build`, `npm test`, `npx eslint .` pass; live audit against real keys returned 12 bugs / 4 initiatives / 3 stories.
