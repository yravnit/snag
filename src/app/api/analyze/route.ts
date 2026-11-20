import Firecrawl from "@mendable/firecrawl-js";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  AuditReportSchema,
  PmPlanSchema,
  QaReportSchema,
  type AuditReport,
  type Bug,
  type StepMetric,
} from "@/lib/schemas";

export const maxDuration = 60;

type StepName = "input" | "search" | "qa" | "pm";

type StreamEvent =
  | {
      type: "step";
      step: StepName;
      status: "running" | "done" | "error";
      metrics?: StepMetric[];
    }
  | { type: "complete"; report: AuditReport }
  | { type: "error"; message: string };

type Signal = { url: string; title: string; snippet: string };

const jsonSchema = (schema: z.ZodType) => {
  const s = z.toJSONSchema(schema) as Record<string, unknown>;
  delete s.$schema;
  return s;
};

// Gemma first; fall back to Flash Lite when it is overloaded or returns bad JSON.
const MODELS = ["gemma-4-31b-it", "gemini-3.5-flash-lite"] as const;

async function generateJson<T extends z.ZodType>(
  schema: T,
  prompt: string
): Promise<z.infer<T>> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let lastError: unknown;
  for (const model of MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema(schema),
          temperature: 0,
        },
      });
      const text = (response.text ?? "")
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      return schema.parse(JSON.parse(text)) as z.infer<T>;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function signalsToText(signals: Signal[]) {
  return signals
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title || "Untitled source"}\nURL: ${s.url}\n${s.snippet}`
    )
    .join("\n\n");
}

export async function POST(request: Request) {
  let company = "";
  try {
    const body = (await request.json()) as { company?: unknown };
    company = typeof body.company === "string" ? body.company.trim() : "";
  } catch {
    company = "";
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: StreamEvent) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );

      let currentStep: StepName = "input";
      const fail = (error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Unexpected agent failure";
        send({ type: "step", step: currentStep, status: "error" });
        send({ type: "error", message });
      };

      try {
        if (!company) throw new Error("Enter a company name to run the agent.");
        const firecrawlKey = process.env.FIRECRAWL_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!firecrawlKey || !geminiKey) {
          throw new Error(
            "Missing FIRECRAWL_API_KEY or GEMINI_API_KEY. Add them to .env.local."
          );
        }

        currentStep = "input";
        send({ type: "step", step: "input", status: "running" });
        send({
          type: "step",
          step: "input",
          status: "done",
          metrics: [{ label: "account", value: "1" }],
        });

        currentStep = "search";
        send({ type: "step", step: "search", status: "running" });
        const firecrawl = new Firecrawl({ apiKey: firecrawlKey });
        const queries = [
          `${company} G2 Capterra cons complaints bugs`,
          `${company} reddit issues slow broken`,
          `${company} missing features review`,
        ];
        const searches = await Promise.all(
          queries.map((q) => firecrawl.search(q, { limit: 6 }))
        );

        const seenUrls = new Set<string>();
        const seenSnippets = new Set<string>();
        const signals: Signal[] = [];
        for (const data of searches) {
          for (const result of data.web ?? []) {
            const url =
              "url" in result && typeof result.url === "string"
                ? result.url
                : "";
            const title =
              "title" in result && typeof result.title === "string"
                ? result.title
                : "";
            const description =
              "description" in result && typeof result.description === "string"
                ? result.description
                : "";
            const markdown =
              "markdown" in result && typeof result.markdown === "string"
                ? result.markdown
                : "";
            const snippet = (description || markdown).slice(0, 700);
            if (!url && !snippet) continue;

            const urlKey = url.toLowerCase().replace(/\/+$/, "");
            const snippetKey = snippet
              .toLowerCase()
              .replace(/\s+/g, " ")
              .slice(0, 140);
            if (
              (urlKey && seenUrls.has(urlKey)) ||
              (snippetKey && seenSnippets.has(snippetKey))
            ) {
              continue;
            }
            if (urlKey) seenUrls.add(urlKey);
            if (snippetKey) seenSnippets.add(snippetKey);
            signals.push({ url, title, snippet });
          }
        }
        if (signals.length === 0) {
          throw new Error(`No web signals found for "${company}".`);
        }
        const trimmed = signals.slice(0, 30);
        send({
          type: "step",
          step: "search",
          status: "done",
          metrics: [
            { label: "queries", value: String(queries.length) },
            { label: "signals", value: String(trimmed.length) },
          ],
        });

        currentStep = "qa";
        send({ type: "step", step: "qa", status: "running" });
        const qa = await generateJson(
          QaReportSchema,
          `You are a senior QA analyst auditing the B2B SaaS product "${company}".
Below are deduplicated review snippets and source URLs gathered from the web.

${signalsToText(trimmed)}

Extract every distinct complaint or gap into bugs. For each: give a concise summary,
one category, a severity (P0 critical outage/data loss, P1 major, P2 moderate, P3 minor),
the affected workflow, a short evidence-based root cause, and the source URL from the
signal it came from. Do not invent issues that are not supported by the signals.
Set totalSignals to ${trimmed.length} and company to "${company}".`
        );
        const bugs: Bug[] = qa.bugs;
        const critical = bugs.filter(
          (b) => b.severity === "P0" || b.severity === "P1"
        ).length;
        send({
          type: "step",
          step: "qa",
          status: "done",
          metrics: [
            { label: "bugs", value: String(bugs.length) },
            { label: "P0/P1", value: String(critical) },
          ],
        });

        currentStep = "pm";
        send({ type: "step", step: "pm", status: "running" });
        const plan = await generateJson(
          PmPlanSchema,
          `You are a product manager for "${company}". Based on these QA findings,
produce a prioritized action plan.

${JSON.stringify(bugs, null, 2)}

Return 3-5 initiatives with RICE inputs (reach = users per quarter, impact on the
0.25-3 scale, confidence 0-1, effort in person-months) and an exact score computed as
reach * impact * confidence / effort. Also return the top 3 user stories in
Given/When/Then form, each with 3-5 specific QA acceptance criteria.`
        );

        const report: AuditReport = AuditReportSchema.parse({
          company,
          totalSignals: trimmed.length,
          bugs,
          pmPlan: plan,
        });
        send({
          type: "step",
          step: "pm",
          status: "done",
          metrics: [
            { label: "initiatives", value: String(plan.rice.length) },
            { label: "stories", value: String(plan.userStories.length) },
          ],
        });
        send({ type: "complete", report });
      } catch (error) {
        fail(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
