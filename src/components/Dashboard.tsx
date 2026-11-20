"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@ui-sdk/react/button";
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react/collapsible";
import { Field, FieldLabel } from "@ui-sdk/react/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select";
import { Check, ChevronDown, ExternalLink } from "lucide-react";
import {
  ISSUE_CATEGORIES,
  SEVERITIES,
  type AuditReport,
  type IssueCategory,
  type Severity,
} from "@/lib/schemas";
import ExportButtons from "@/components/ExportButtons";

const PIE_COLORS = ["#f97316", "#38bdf8", "#a78bfa", "#34d399"];
const SEVERITY_COLORS: Record<Severity, string> = {
  P0: "#ef4444",
  P1: "#f97316",
  P2: "#eab308",
  P3: "#38bdf8",
};
const badgeClass: Record<Severity, string> = {
  P0: "border-red-500/50 bg-red-500/10 text-red-300",
  P1: "border-orange-500/50 bg-orange-500/10 text-orange-300",
  P2: "border-yellow-500/50 bg-yellow-500/10 text-yellow-300",
  P3: "border-sky-500/50 bg-sky-500/10 text-sky-300",
};
const cardClass = "rounded-xl border border-zinc-800 bg-zinc-900/50 p-4";
const PAGE_SIZE = 4;

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${cardClass} text-center`}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </div>
      <div className="font-display mt-2 text-2xl font-semibold text-zinc-50">{value}</div>
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: T;
  options: { value: string; label: string }[];
  onValueChange: (value: T) => void;
}) {
  return (
    <Field className="w-40">
      <FieldLabel>{label}</FieldLabel>
      <Select
        items={options}
        value={value}
        onValueChange={(next) => onValueChange(next as T)}
      >
        <SelectTrigger className="mt-1.5 flex h-9 w-full items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 text-xs text-zinc-200 hover:border-zinc-500">
          <SelectValue />
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
        </SelectTrigger>
        <SelectContent className="min-w-(--anchor-width) rounded-lg">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="flex cursor-default items-center justify-between rounded-md px-2 py-1.5 text-xs text-zinc-300"
            >
              {option.label}
              <SelectItemIndicator className="ms-3">
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              </SelectItemIndicator>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export default function Dashboard({ report }: { report: AuditReport }) {
  const [category, setCategory] = useState<"All" | IssueCategory>("All");
  const [severity, setSeverity] = useState<"All" | Severity>("All");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const bugs = report.bugs;
    const byCategory = ISSUE_CATEGORIES.map((c) => ({
      name: c,
      value: bugs.filter((b) => b.category === c).length,
    })).filter((c) => c.value > 0);
    const bySeverity = SEVERITIES.map((s) => ({
      name: s,
      count: bugs.filter((b) => b.severity === s).length,
    }));
    const critical = bugs.filter(
      (b) => b.severity === "P0" || b.severity === "P1"
    ).length;
    const software = bugs.filter((b) => b.category === "Software Bug").length;
    const top = [...byCategory].sort((a, b) => b.value - a.value)[0];
    return {
      byCategory,
      bySeverity,
      critical,
      softwarePct: bugs.length ? Math.round((software / bugs.length) * 100) : 0,
      topCategory: top?.name ?? "—",
      rice: [...report.pmPlan.rice].sort((a, b) => b.score - a.score),
    };
  }, [report]);

  const filteredBugs = report.bugs.filter(
    (b) =>
      (category === "All" || b.category === category) &&
      (severity === "All" || b.severity === severity)
  );
  const totalPages = Math.max(1, Math.ceil(filteredBugs.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageBugs = filteredBugs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-zinc-50">{report.company}</h2>
        <ExportButtons report={report} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total Signals Analyzed" value={String(report.totalSignals)} />
        <Kpi label="% Software Bugs" value={`${stats.softwarePct}%`} />
        <Kpi label="Top Complaint Category" value={stats.topCategory} />
        <Kpi label="P0/P1 Critical Issues" value={String(stats.critical)} />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className={cardClass}>
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">Issue Type Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={82} label>
                {stats.byCategory.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className={cardClass}>
          <h3 className="mb-2 text-sm font-semibold text-zinc-200">Severity Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.bySeverity}>
              <CartesianGrid stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#a1a1aa" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke="#a1a1aa" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }} />
              <Bar dataKey="count" name="Issues" radius={[4, 4, 0, 0]}>
                {stats.bySeverity.map((s) => (
                  <Cell key={s.name} fill={SEVERITY_COLORS[s.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={cardClass}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-sm font-semibold text-zinc-200">
            Bug Triage <span className="text-zinc-400">({filteredBugs.length})</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            <FilterSelect
              label="Category"
              value={category}
              options={[{ value: "All", label: "All categories" }, ...ISSUE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
              onValueChange={(next) => { setCategory(next); setPage(1); }}
            />
            <FilterSelect
              label="Severity"
              value={severity}
              options={[{ value: "All", label: "All severities" }, ...SEVERITIES.map((s) => ({ value: s, label: s }))]}
              onValueChange={(next) => { setSeverity(next); setPage(1); }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-zinc-400">
              <tr>
                <th className="py-2 pr-3 font-medium">Issue</th>
                <th className="py-2 pr-3 font-medium">Workflow</th>
                <th className="py-2 pr-3 font-medium">Category</th>
                <th className="py-2 pr-3 font-medium">Severity</th>
                <th className="py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {pageBugs.map((b) => (
                <tr key={b.id} className="align-top text-zinc-300">
                  <td className="py-2.5 pr-3">{b.summary}</td>
                  <td className="py-2.5 pr-3 text-zinc-300">{b.workflow}</td>
                  <td className="py-2.5 pr-3 text-zinc-300">{b.category}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass[b.severity]}`}>
                      {b.severity}
                    </span>
                  </td>
                  <td className="py-2.5">
                    <Button
                      render={<a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" />}
                      className="inline-flex h-auto items-center gap-1 border-0 bg-transparent p-0 text-xs font-medium text-sky-400 shadow-none hover:text-sky-300"
                    >
                      Source <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBugs.length === 0 && (
            <p className="py-6 text-center text-xs text-zinc-400">No issues match these filters.</p>
          )}
        </div>
        {filteredBugs.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-3">
            <span className="text-xs text-zinc-400">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredBugs.length)} of {filteredBugs.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-500 data-disabled:opacity-40"
              >
                Prev
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  type="button"
                  aria-label={`Page ${n}`}
                  onClick={() => setPage(n)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    n === currentPage
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-zinc-700 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                aria-label="Next page"
                disabled={currentPage === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 hover:border-zinc-500 data-disabled:opacity-40"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className={cardClass}>
        <h3 className="mb-3 text-sm font-semibold text-zinc-200">PM Action Plan</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-zinc-400">
              <tr>
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Initiative</th>
                <th className="py-2 pr-3 font-medium">Reach</th>
                <th className="py-2 pr-3 font-medium">Impact</th>
                <th className="py-2 pr-3 font-medium">Conf.</th>
                <th className="py-2 pr-3 font-medium">Effort</th>
                <th className="py-2 font-medium">RICE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {stats.rice.map((r, i) => (
                <tr key={r.id} className="text-zinc-300">
                  <td className="py-2.5 pr-3 text-zinc-400">{i + 1}</td>
                  <td className="py-2.5 pr-3">{r.initiative}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{r.reach}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{r.impact}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{r.confidence}</td>
                  <td className="py-2.5 pr-3 tabular-nums">{r.effort}</td>
                  <td className="py-2.5 font-semibold tabular-nums text-emerald-300">{r.score.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Top 3 User Stories
        </h4>
        <div className="space-y-2">
          {report.pmPlan.userStories.slice(0, 3).map((s) => (
            <Collapsible key={s.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50">
              <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-200 hover:bg-zinc-900">
                <span>{s.id}: {s.title}</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-zinc-400 transition-transform group-data-open:rotate-180"
                  aria-hidden="true"
                />
              </CollapsibleTrigger>
              <CollapsiblePanel className="border-t border-zinc-800 px-3 py-3 text-sm text-zinc-300">
                <p><span className="font-semibold text-zinc-100">Given</span> {s.given}</p>
                <p className="mt-1.5"><span className="font-semibold text-zinc-100">When</span> {s.when}</p>
                <p className="mt-1.5"><span className="font-semibold text-zinc-100">Then</span> {s.then}</p>
                <div className="mt-3">
                  <div className="mb-1 font-semibold text-zinc-100">QA Acceptance Criteria</div>
                  <ul className="list-disc space-y-1 pl-5 text-zinc-400">
                    {s.acceptanceCriteria.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              </CollapsiblePanel>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  );
}
