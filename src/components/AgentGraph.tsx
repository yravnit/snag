"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import type { StepMetric } from "@/lib/schemas";
import "@xyflow/react/dist/style.css";

export type StepName = "input" | "search" | "qa" | "pm";
export type NodeState = "idle" | "running" | "done" | "error";
export type GraphStatus = Record<StepName, { state: NodeState; metrics?: StepMetric[] }>;

type AgentNodeData = {
  label: string;
  metricLabels: string[];
  state: NodeState;
  metrics?: StepMetric[];
  hasTarget: boolean;
  hasSource: boolean;
};

type AgentNode = Node<AgentNodeData, "agent">;

const STEPS: StepName[] = ["input", "search", "qa", "pm"];

const NODE_META: Record<StepName, { label: string; metricLabels: string[] }> = {
  input: { label: "Company Input", metricLabels: ["account"] },
  search: { label: "Firecrawl Web Search", metricLabels: ["queries", "signals"] },
  qa: { label: "QA Bug Triage", metricLabels: ["bugs", "P0/P1"] },
  pm: { label: "PM Strategist", metricLabels: ["initiatives", "stories"] },
};

const STATE_STYLE: Record<NodeState, { border: string; text: string; glow: string }> = {
  idle: { border: "border-zinc-700", text: "text-zinc-400", glow: "" },
  running: {
    border: "border-amber-400",
    text: "text-amber-300",
    glow: "shadow-[0_0_22px_rgba(251,191,36,0.28)]",
  },
  done: {
    border: "border-emerald-500/70",
    text: "text-emerald-300",
    glow: "shadow-[0_0_18px_rgba(16,185,129,0.10)]",
  },
  error: { border: "border-red-500", text: "text-red-300", glow: "" },
};

function StatusNode({ data }: NodeProps<AgentNode>) {
  const style = STATE_STYLE[data.state];
  return (
    <div
      className={`w-[224px] rounded-xl border bg-zinc-900/95 p-3.5 shadow-lg shadow-black/20 ${style.border} ${style.glow} transition-all duration-300`}
    >
      {data.hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-900 !bg-zinc-500"
        />
      )}
      <div className="flex items-center justify-center gap-2.5">
        <span className="font-display text-xs font-semibold leading-tight tracking-tight text-zinc-100">
          {data.label}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-2.5 border-t border-zinc-800 pt-2.5">
        {data.metricLabels.map((label, i) => {
          const metric = data.metrics?.[i];
          return (
            <span key={label} className="flex items-baseline gap-1">
              {i > 0 && (
                <span className="mr-1.5 h-3 w-px self-center bg-zinc-700" aria-hidden="true" />
              )}
              <span className={`font-display text-[13px] font-semibold tabular-nums ${style.text}`}>
                {metric?.value ?? "—"}
              </span>
              <span className="text-[10px] text-zinc-400">{label}</span>
            </span>
          );
        })}
      </div>
      {data.hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-zinc-900 !bg-zinc-500"
        />
      )}
    </div>
  );
}

const nodeTypes = { agent: StatusNode };

function FitOnResize({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => fitView({ padding: 0.06, duration: 0 }));
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, fitView]);
  return null;
}

export default function AgentGraph({ status }: { status: GraphStatus }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const running = STEPS.some((step) => status[step].state === "running");

  const nodes = useMemo<AgentNode[]>(
    () =>
      STEPS.map((step, i) => ({
        id: step,
        type: "agent" as const,
        position: { x: i * 296, y: 0 },
        data: {
          label: NODE_META[step].label,
          metricLabels: NODE_META[step].metricLabels,
          state: status[step].state,
          metrics: status[step].metrics,
          hasTarget: i > 0,
          hasSource: i < STEPS.length - 1,
        },
      })),
    [status]
  );

  const edges = useMemo<Edge[]>(
    () =>
      STEPS.slice(1).map((step, i) => {
        const target = status[step].state;
        const color =
          target === "done"
            ? "#10b981"
            : target === "running"
              ? "#fbbf24"
              : target === "error"
                ? "#ef4444"
                : "#3f3f46";
        return {
          id: `${STEPS[i]}-${step}`,
          source: STEPS[i],
          target: step,
          animated: target === "running",
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
        };
      }),
    [status]
  );

  return (
    <div
      ref={containerRef}
      className="relative left-1/2 h-[200px] -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition-[width] duration-700 ease-in-out"
      style={{
        width: running
          ? "min(calc(100vw - 2rem), calc(100% + 14rem))"
          : "100%",
      }}
    >
      <ReactFlow<AgentNode, Edge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.06 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
      >
        <FitOnResize containerRef={containerRef} />
        <Background color="#27272a" gap={22} size={1} />
      </ReactFlow>
    </div>
  );
}
