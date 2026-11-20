"use client";

import { createAgent, registerTools } from "@ui-sdk/react/agent";

export const agent = createAgent();

if (typeof window !== "undefined") {
  registerTools(agent, { allow: () => true });
}
