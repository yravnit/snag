import { z } from "zod";

export type StepMetric = { label: string; value: string };

export const IssueCategorySchema = z.enum([
  "Software Bug",
  "UX Friction",
  "Missing Feature",
  "Integration/Sync",
]);

export const SeveritySchema = z.enum(["P0", "P1", "P2", "P3"]);

export const BugSchema = z.object({
  id: z.string(),
  summary: z.string(),
  category: IssueCategorySchema,
  severity: SeveritySchema,
  workflow: z.string(),
  rootCause: z.string(),
  sourceUrl: z.string(),
});

export const RiceItemSchema = z.object({
  id: z.string(),
  initiative: z.string(),
  reach: z.number(),
  impact: z.number(),
  confidence: z.number(),
  effort: z.number(),
  score: z.number(),
});

export const UserStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  given: z.string(),
  when: z.string(),
  then: z.string(),
  acceptanceCriteria: z.array(z.string()),
});

export const QaReportSchema = z.object({
  company: z.string(),
  totalSignals: z.number(),
  bugs: z.array(BugSchema),
});

export const PmPlanSchema = z.object({
  rice: z.array(RiceItemSchema),
  userStories: z.array(UserStorySchema),
});

export const AuditReportSchema = QaReportSchema.extend({
  pmPlan: PmPlanSchema,
});

export type IssueCategory = z.infer<typeof IssueCategorySchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type Bug = z.infer<typeof BugSchema>;
export type RiceItem = z.infer<typeof RiceItemSchema>;
export type UserStory = z.infer<typeof UserStorySchema>;
export type QaReport = z.infer<typeof QaReportSchema>;
export type PmPlan = z.infer<typeof PmPlanSchema>;
export type AuditReport = z.infer<typeof AuditReportSchema>;

export const ISSUE_CATEGORIES = IssueCategorySchema.options;
export const SEVERITIES = SeveritySchema.options;
