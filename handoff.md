# Handoff

> Rule: Pure session slate. Do NOT log timestamps, thought processes, or history. Overwrite this file at the end of a session so the next session knows only what is done and what is left.

## Done
- Control files: `AGENTS.md`, `progress.md`, `handoff.md`.
- Dependencies installed; Zod single-source schemas in `src/lib/schemas.ts`.
- SSE route `src/app/api/analyze/route.ts` with Firecrawl search + Gemini structured QA/PM calls.
- Cached demo `src/data/demo-recruit-crm.json`.
- UI fully rebuilt on ui-sdk: Field/Input/InputClear/Button in `page.tsx` and `ExportButtons.tsx`, Select filters + Collapsible user stories in `Dashboard.tsx`, dark `--ui-*` theme in `globals.css`.
- React Flow `AgentGraph.tsx` kept; end handles removed, icons/pills dropped for plain dynamic metrics, wider node spacing, expands during runs and smoothly shrinks after.
- Agent bridge + WebMCP tools in `src/lib/agent.ts`.
- ui-sdk skill at `.agents/skills/ui-sdk`; AGENTS.md points at shipped docs.
- `npm run build`, `npm test` (2 agent-readiness tests), `npx eslint .` all pass. Verified in browser: home, demo dashboard, select popup.
- Rebranded to Snag everywhere; header is centered text-only using self-hosted Ethnocentric (`public/fonts/ethnocentric.woff`, `next/font/local` in `layout.tsx`, `.font-ethnocentric` in `globals.css`). Build clean.
- Dashboard trimmed: no audit subtitle, no KPI hints, no bug root-cause lines; bug table `text-sm`.
- Bug Triage paginated 4 per page (max 5 pages), pager resets on filter change.
- Agent-node status dots removed. Input placeholder examples now `Zoho Recruit, Bullhorn, Greenhouse`.
- KPI card and agent-node text centered inside their cards.
- PM Action Plan table + user stories use `text-sm` like Bug Triage.
- Pre-deploy hardening: `maxDuration = 60` in `/api/analyze`; bug pager no longer capped at 5 pages; `overflow-x-hidden` on `<body>`; `buildMarkdown` strips `|`/newlines from summary and root cause cells.
- Verified live (real keys, not demo): 3 Firecrawl searches → 16 signals → 12 bugs (5 P0/P1) → 4 RICE items → 3 user stories. `npm run build`, `npm test`, `npx eslint .` all pass.

## Remaining
- Deploy to Vercel (blocked — see below).

## Blockers / Env Notes
- Keys are set in `.env.local` (gitignored): `FIRECRAWL_API_KEY`, `GEMINI_API_KEY`.
- `gemini-2.5-flash` is retired for this key (404); it was NOT added as a fallback. `gemma-4-31b-it` intermittently returns 503 "high demand"; `gemini-3.5-flash-lite` is the working fallback. Both accept `responseJsonSchema`. Brief upstream 503 bursts can fail an audit; direct retries succeed.
- Do NOT add `export const dynamic = "force-dynamic"`: Next 16 with `cacheComponents: true` removed that option — adding it breaks the build. `maxDuration` is still supported.
- Vercel deploy is blocked: `vercel whoami` reports "token is not valid", no git remote is configured, and no `VERCEL_TOKEN` env var exists. Need `vercel login` + `vercel link` (or a valid token) first.
- A dev server is already running on port 3001; a rebuild wipes CSS hashes it references — restart it after builds.
- `vitest@3` pinned: vitest 5 needs `@types/node` >=22, project uses 20. Test tooling added 3 npm audit findings (1 moderate, 2 critical) from transitive deps; not addressed.
- `npm run build` while `npm start` is live wipes the CSS hashes the running server references (404s → unstyled page). Restart the production server after every build.
