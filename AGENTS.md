<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` - verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Snag

## Stack & Environment Rules
- **Framework:** Next.js App Router, TypeScript (strict), Tailwind CSS.
- **API Keys:** Read strictly from `process.env.FIRECRAWL_API_KEY` and `process.env.GEMINI_API_KEY` on the server (`route.ts`) only. Never expose keys to client components.
- **Client vs. Server:** Mark `AgentGraph.tsx`, `Dashboard.tsx`, `ExportButtons.tsx`, and `page.tsx` with `"use client"`. Keep Firecrawl and Gemini SDKs strictly inside `src/app/api/analyze/route.ts`.
- **React Flow:** Always import `@xyflow/react/dist/style.css` in `AgentGraph.tsx` and give the React Flow container an explicit fixed height (e.g., `h-[220px]`).
- **Recharts:** Wrap all charts in `<ResponsiveContainer width="100%" height={260}>`.
- **Zod + Gemini:** Use a single source of truth in `src/lib/schemas.ts` for both Gemini structured output and TypeScript types (`z.infer<typeof ...>`).
- **Exports:** `.md` and `.docx` generation must run 100% client-side in `src/lib/exportUtils.ts`. No backend export endpoints.

## Strict Anti-Tangent Rules
- **NO** databases, ORMs, Prisma, Supabase, or localStorage persistence.
- **NO** authentication, login screens, or user accounts.
- **NO** extra pages/routes beyond `/` and `/api/analyze`.
- **NO** swapping libraries (do not replace Firecrawl, React Flow, Recharts, or `docx`).
- **NO** light/dark theme toggle—build a clean dark-mode UI (`bg-zinc-950`, `border-zinc-800`) only.
- **NO** over-engineering: keep components flat, readable, and under ~250 lines where possible.

## UI SDK Rules
- Before using ui-sdk, follow the ui-sdk skill if it's installed, and read `node_modules/@ui-sdk/react/docs/llms.txt`.
- To build a new component, also search `node_modules/@ui-sdk/react/docs/core.md` by heading, and read `rendering.md` next to it.

## File Update Rules
- Update `progress.md` when a milestone is completed.
- Update `handoff.md` before ending any session or when switching tasks.
