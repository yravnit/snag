import { act, render, screen } from "@testing-library/react";
import { createAgent } from "@ui-sdk/react/agent";
import { expect, test } from "vitest";
import Home from "@/app/page";
import Dashboard from "@/components/Dashboard";
import { AuditReportSchema } from "@/lib/schemas";
import demoData from "@/data/demo-recruit-crm.json";

const named = (agent: ReturnType<typeof createAgent>) =>
  agent.snapshot()
    .filter((entry) => !entry.offPage && entry.component !== "more")
    .map((entry) => entry.label);

test("an agent can find and fill the audit controls", async () => {
  const agent = createAgent();
  render(<Home />);

  const components = agent.snapshot().filter((entry) => !entry.offPage && entry.component !== "more");
  for (const entry of components) {
    expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
  }
  const labels = named(agent);
  for (const label of ["Company to audit", "Run agent", "Load demo"]) {
    expect(labels, `${label} is missing from the snapshot`).toContain(label);
  }

  let result!: Awaited<ReturnType<typeof agent.act>>;
  await act(async () => {
    result = await agent.act({
      steps: [{ ref: "Company to audit", action: "setValue", args: ["Recruit CRM"] }],
    });
  });
  expect(result.ok, result.error?.message).toBe(true);
  expect((screen.getByLabelText("Company to audit") as HTMLInputElement).value).toBe("Recruit CRM");
});

test("an agent can find and change every dashboard control", async () => {
  const agent = createAgent();
  render(<Dashboard report={AuditReportSchema.parse(demoData)} />);

  const components = agent.snapshot().filter((entry) => !entry.offPage && entry.component !== "more");
  for (const entry of components) {
    expect(entry.label, `${entry.component} ${entry.ref} has no name`).toBeTruthy();
  }
  const labels = named(agent);
  for (const label of ["Category", "Severity", "Download .MD", "Download .DOCX"]) {
    expect(labels, `${label} is missing from the snapshot`).toContain(label);
  }

  let result!: Awaited<ReturnType<typeof agent.act>>;
  await act(async () => {
    result = await agent.act({
      steps: [
        { ref: "Category", action: "setValue", args: ["All categories"] },
        { ref: "Severity", action: "setValue", args: ["P0"] },
      ],
    });
  });
  expect(result.ok, result.error?.message).toBe(true);
});
