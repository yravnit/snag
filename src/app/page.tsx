"use client";

import { useState } from "react";
import { Button } from "@ui-sdk/react/button";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import { Input, InputClear, InputGroup } from "@ui-sdk/react/input";
import { Play, X, Zap } from "lucide-react";
import AgentGraph, {
  type GraphStatus,
  type StepName,
} from "@/components/AgentGraph";
import Dashboard from "@/components/Dashboard";
import { AuditReportSchema, type AuditReport, type StepMetric } from "@/lib/schemas";
import demoData from "@/data/demo-recruit-crm.json";
import "@/lib/agent";

type StreamEvent =
  | {
      type: "step";
      step: StepName;
      status: "running" | "done" | "error";
      metrics?: StepMetric[];
    }
  | { type: "complete"; report: unknown }
  | { type: "error"; message: string };

const idleStatus = (): GraphStatus => ({
  input: { state: "idle" },
  search: { state: "idle" },
  qa: { state: "idle" },
  pm: { state: "idle" },
});

const demoReport = AuditReportSchema.parse(demoData);
const demoOrder: StepName[] = ["input", "search", "qa", "pm"];
const demoMetrics: StepMetric[][] = [
  [{ label: "account", value: "1" }],
  [
    { label: "queries", value: "3" },
    { label: "signals", value: String(demoReport.totalSignals) },
  ],
  [
    { label: "bugs", value: String(demoReport.bugs.length) },
    {
      label: "P0/P1",
      value: String(
        demoReport.bugs.filter((b) => b.severity === "P0" || b.severity === "P1").length
      ),
    },
  ],
  [
    { label: "initiatives", value: String(demoReport.pmPlan.rice.length) },
    { label: "stories", value: String(demoReport.pmPlan.userStories.length) },
  ],
];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function Home() {
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<GraphStatus>(idleStatus);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleEvent = (event: StreamEvent) => {
    if (event.type === "step") {
      setStatus((prev) => ({
        ...prev,
        [event.step]: { state: event.status, metrics: event.metrics },
      }));
    } else if (event.type === "complete") {
      setReport(AuditReportSchema.parse(event.report));
    } else {
      setError(event.message);
    }
  };

  const runAgent = async () => {
    if (!company.trim() || busy) return;
    setBusy(true);
    setError(null);
    setReport(null);
    setStatus(idleStatus());
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: company.trim() }),
      });
      if (!res.ok || !res.body) throw new Error(`Agent request failed (${res.status}).`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          handleEvent(JSON.parse(line.slice(6)) as StreamEvent);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agent run failed.");
    } finally {
      setBusy(false);
    }
  };

  const runDemo = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setReport(null);
    setStatus(idleStatus());
    for (let i = 0; i < demoOrder.length; i++) {
      setStatus((prev) => ({ ...prev, [demoOrder[i]]: { state: "running" } }));
      await wait(625);
      setStatus((prev) => ({
        ...prev,
        [demoOrder[i]]: { state: "done", metrics: demoMetrics[i] },
      }));
    }
    setReport(demoReport);
    setBusy(false);
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex justify-center">
        <h1 className="font-ethnocentric text-3xl font-bold tracking-wide text-zinc-50">
          Snag
        </h1>
      </header>

      <form
        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void runAgent();
        }}
      >
        <Field name="company">
          <FieldLabel>Company to audit</FieldLabel>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <InputGroup className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 px-3 focus-within:border-emerald-500">
                <Input
                  value={company}
                  onValueChange={setCompany}
                  placeholder="Enter a B2B SaaS company (e.g. Zoho Recruit, Bullhorn, Greenhouse)"
                  className="h-11 flex-1 border-0 bg-transparent text-sm text-zinc-100 shadow-none outline-none placeholder:text-zinc-500"
                />
                <InputClear aria-label="Clear company">
                  <X className="h-4 w-4" aria-hidden="true" />
                </InputClear>
              </InputGroup>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="submit"
                disabled={busy || !company.trim()}
                focusableWhenDisabled
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 data-disabled:opacity-40"
              >
                <Play className="h-4 w-4" data-show="idle" aria-hidden="true" />
                Run agent
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void runDemo()}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 data-disabled:opacity-40"
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                Load demo
              </Button>
            </div>
          </div>
        </Field>
      </form>

      <section aria-label="Agent pipeline" className="space-y-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Agent pipeline
        </h2>
        <AgentGraph status={status} />
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {report && <Dashboard report={report} />}
    </main>
  );
}
