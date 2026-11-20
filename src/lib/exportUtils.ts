import type { AuditReport, Bug, RiceItem } from "@/lib/schemas";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const safeName = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const mdCell = (value: string) => value.replace(/[|\r\n]+/g, " ");

export function buildMarkdown(report: AuditReport): string {
  const critical = report.bugs.filter(
    (b) => b.severity === "P0" || b.severity === "P1"
  ).length;
  const lines: string[] = [
    `# Snag — ${report.company}`,
    "",
    `**Signals analyzed:** ${report.totalSignals}  `,
    `**Bugs classified:** ${report.bugs.length}  `,
    `**P0/P1 critical issues:** ${critical}`,
    "",
    "## Bug Triage",
    "",
    "| Summary | Category | Severity | Workflow | Root cause | Source |",
    "| --- | --- | --- | --- | --- | --- |",
    ...report.bugs.map(
      (b) =>
        `| ${mdCell(b.summary)} | ${b.category} | ${b.severity} | ${b.workflow} | ${mdCell(b.rootCause)} | [link](${b.sourceUrl}) |`
    ),
    "",
    "## RICE Prioritization",
    "",
    "| # | Initiative | Reach | Impact | Confidence | Effort | Score |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...[...report.pmPlan.rice]
      .sort((a, b) => b.score - a.score)
      .map(
        (r, i) =>
          `| ${i + 1} | ${r.initiative} | ${r.reach} | ${r.impact} | ${r.confidence} | ${r.effort} | ${r.score.toFixed(1)} |`
      ),
    "",
    "## User Stories",
    "",
  ];

  for (const s of report.pmPlan.userStories) {
    lines.push(
      `### ${s.id}: ${s.title}`,
      "",
      `- **Given** ${s.given}`,
      `- **When** ${s.when}`,
      `- **Then** ${s.then}`,
      "",
      "**QA Acceptance Criteria**",
      "",
      ...s.acceptanceCriteria.map((c) => `- ${c}`),
      ""
    );
  }
  return lines.join("\n");
}

export function downloadMarkdown(report: AuditReport) {
  saveBlob(
    new Blob([buildMarkdown(report)], { type: "text/markdown;charset=utf-8" }),
    `snag-${safeName(report.company)}.md`
  );
}

export async function downloadDocx(report: AuditReport) {
  const {
    Document,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    HeadingLevel,
    WidthType,
  } = await import("docx");

  const text = (value: string, bold = false) =>
    new TextRun({ text: value, bold, size: 18 });
  const cell = (value: string) =>
    new TableCell({
      children: [new Paragraph({ children: [text(value)] })],
    });
  const table = (headers: string[], rows: string[][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map((h) =>
            new TableCell({
              children: [new Paragraph({ children: [text(h, true)] })],
            })
          ),
        }),
        ...rows.map((r) => new TableRow({ children: r.map(cell) })),
      ],
    });

  const children = [
    new Paragraph({
      text: `Snag — ${report.company}`,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph(
      `Signals analyzed: ${report.totalSignals}. Bugs classified: ${report.bugs.length}.`
    ),
    new Paragraph({ text: "Bug Triage", heading: HeadingLevel.HEADING_2 }),
    table(
      ["Summary", "Category", "Severity", "Workflow", "Root cause", "Source"],
      report.bugs.map((b: Bug) => [
        b.summary,
        b.category,
        b.severity,
        b.workflow,
        b.rootCause,
        b.sourceUrl,
      ])
    ),
    new Paragraph({ text: "RICE Prioritization", heading: HeadingLevel.HEADING_2 }),
    table(
      ["Initiative", "Reach", "Impact", "Confidence", "Effort", "Score"],
      [...report.pmPlan.rice]
        .sort((a: RiceItem, b: RiceItem) => b.score - a.score)
        .map((r) => [
          r.initiative,
          String(r.reach),
          String(r.impact),
          String(r.confidence),
          String(r.effort),
          r.score.toFixed(1),
        ])
    ),
    new Paragraph({ text: "User Stories", heading: HeadingLevel.HEADING_2 }),
  ];

  for (const story of report.pmPlan.userStories) {
    children.push(
      new Paragraph({
        text: `${story.id}: ${story.title}`,
        heading: HeadingLevel.HEADING_3,
      }),
      new Paragraph(`Given ${story.given}`),
      new Paragraph(`When ${story.when}`),
      new Paragraph(`Then ${story.then}`),
      new Paragraph("QA Acceptance Criteria"),
      ...story.acceptanceCriteria.map((c) => new Paragraph(`• ${c}`))
    );
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `snag-${safeName(report.company)}.docx`);
}
