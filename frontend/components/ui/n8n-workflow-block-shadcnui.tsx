'use client';

import { motion, type PanInfo } from "framer-motion";
import type React from "react";
import { useRef, useState, useMemo } from "react";
import { flushSync } from "react-dom";
import {
  Database,
  Globe,
  Server,
  Settings,
  Zap,
  Layers,
  Cpu,
  ArrowRight,
  Plus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ArchNode, ArchEdge } from "@/lib/api";

// Layout constants
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const COL_GAP = 260;
const ROW_GAP = 130;

// Type → icon + color
const typeConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  frontend:  { icon: Globe,     color: "blue" },
  backend:   { icon: Server,    color: "emerald" },
  database:  { icon: Database,  color: "amber" },
  service:   { icon: Zap,       color: "purple" },
  queue:     { icon: Layers,    color: "orange" },
  cache:     { icon: Cpu,       color: "red" },
  external:  { icon: Globe,     color: "slate" },
};

const colorClasses: Record<string, string> = {
  blue:    "border-blue-400/40 bg-blue-400/10 text-blue-400",
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  amber:   "border-amber-400/40 bg-amber-400/10 text-amber-400",
  purple:  "border-purple-400/40 bg-purple-400/10 text-purple-400",
  orange:  "border-orange-400/40 bg-orange-400/10 text-orange-400",
  red:     "border-red-400/40 bg-red-400/10 text-red-400",
  slate:   "border-slate-500/40 bg-slate-500/10 text-slate-400",
};

interface InternalNode {
  id: string;
  type: string;
  label: string;
  description: string;
  position: { x: number; y: number };
}

interface InternalEdge {
  from: string;
  to: string;
  label: string;
}

function autoLayout(nodes: ArchNode[], edges: ArchEdge[]): InternalNode[] {
  // Build adjacency for column assignment (BFS from roots)
  const inDegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1));

  const colMap = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const roots = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  const queue = roots.length > 0 ? roots : nodes.map((n) => n.id);

  const adj = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  });

  const visited = new Set<string>();
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (visited.has(cur)) continue;
    visited.add(cur);
    const col = colMap.get(cur) ?? 0;
    (adj.get(cur) ?? []).forEach((nxt) => {
      const prev = colMap.get(nxt) ?? -1;
      if (col + 1 > prev) {
        colMap.set(nxt, col + 1);
        if (!visited.has(nxt)) queue.push(nxt);
      }
    });
  }

  // Assign rows within each column
  const rowCount = new Map<number, number>();
  const positioned = nodes.map((n) => {
    const col = colMap.get(n.id) ?? 0;
    const row = rowCount.get(col) ?? 0;
    rowCount.set(col, row + 1);
    return {
      id: n.id,
      type: n.type,
      label: n.label,
      description: n.description,
      position: { x: col * COL_GAP + 30, y: row * ROW_GAP + 30 },
    };
  });

  return positioned;
}

function ConnectionLine({
  from,
  to,
  nodes,
}: {
  from: string;
  to: string;
  nodes: InternalNode[];
}) {
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const startX = fromNode.position.x + NODE_WIDTH;
  const startY = fromNode.position.y + NODE_HEIGHT / 2;
  const endX = toNode.position.x;
  const endY = toNode.position.y + NODE_HEIGHT / 2;
  const cpX1 = startX + (endX - startX) * 0.5;
  const cpX2 = endX - (endX - startX) * 0.5;
  const path = `M${startX},${startY} C${cpX1},${startY} ${cpX2},${endY} ${endX},${endY}`;

  return (
    <path
      d={path}
      fill="none"
      stroke="#D4D4D8"
      strokeWidth={1.5}
      strokeDasharray="8,6"
      strokeLinecap="round"
      opacity={0.4}
    />
  );
}

export interface N8nWorkflowBlockProps {
  archNodes: ArchNode[];
  archEdges: ArchEdge[];
  summary?: string;
}

export function N8nWorkflowBlock({ archNodes, archEdges, summary }: N8nWorkflowBlockProps) {
  const initialNodes = useMemo(() => autoLayout(archNodes, archEdges), [archNodes, archEdges]);
  const initialEdges: InternalEdge[] = useMemo(
    () => archEdges.map((e) => ({ from: e.source, to: e.target, label: e.label })),
    [archEdges]
  );

  const [nodes, setNodes] = useState<InternalNode[]>(initialNodes);
  const connections = initialEdges;

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const [contentSize, setContentSize] = useState(() => {
    const maxX = Math.max(...initialNodes.map((n) => n.position.x + NODE_WIDTH), 400);
    const maxY = Math.max(...initialNodes.map((n) => n.position.y + NODE_HEIGHT), 200);
    return { width: maxX + 60, height: maxY + 60 };
  });

  const handleDragStart = (id: string) => {
    setDraggingId(id);
    const node = nodes.find((n) => n.id === id);
    if (node) dragStart.current = { ...node.position };
  };

  const handleDrag = (id: string, { offset }: PanInfo) => {
    if (draggingId !== id || !dragStart.current) return;
    const x = Math.max(0, dragStart.current.x + offset.x);
    const y = Math.max(0, dragStart.current.y + offset.y);
    flushSync(() =>
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, position: { x, y } } : n)))
    );
    setContentSize((prev) => ({
      width: Math.max(prev.width, x + NODE_WIDTH + 60),
      height: Math.max(prev.height, y + NODE_HEIGHT + 60),
    }));
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    dragStart.current = null;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge className="rounded-full border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
            Live
          </Badge>
          <span className="text-xs uppercase tracking-[0.25em] text-zinc-400">
            Architecture Flow
          </span>
        </div>
        <span className="text-xs text-zinc-400 uppercase tracking-[0.2em]">
          {nodes.length} nodes · {connections.length} edges
        </span>
      </div>

      {/* Summary */}
      {summary && (
        <p className="mb-4 text-sm text-zinc-500 leading-relaxed border border-zinc-200 rounded-lg px-4 py-2.5 bg-zinc-50">
          {summary}
        </p>
      )}

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative h-[420px] w-full overflow-auto rounded-xl border border-zinc-200 bg-zinc-50/60"
        role="region"
        aria-label="Architecture canvas"
      >
        <div
          className="relative"
          style={{ minWidth: contentSize.width, minHeight: contentSize.height }}
        >
          {/* SVG connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={contentSize.width}
            height={contentSize.height}
            style={{ overflow: "visible" }}
            aria-hidden="true"
          >
            {connections.map((c) => (
              <ConnectionLine key={`${c.from}-${c.to}`} from={c.from} to={c.to} nodes={nodes} />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map((node, i) => {
            const cfg = typeConfig[node.type] ?? typeConfig.external;
            const Icon = cfg.icon;
            const colorCls = colorClasses[cfg.color] ?? colorClasses.slate;
            const isDragging = draggingId === node.id;

            return (
              <motion.div
                key={node.id}
                drag
                dragMomentum={false}
                dragConstraints={{ left: 0, top: 0, right: 100000, bottom: 100000 }}
                onDragStart={() => handleDragStart(node.id)}
                onDrag={(_, info) => handleDrag(node.id, info)}
                onDragEnd={handleDragEnd}
                style={{ x: node.position.x, y: node.position.y, width: NODE_WIDTH, transformOrigin: "0 0" }}
                className="absolute cursor-grab"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.06, duration: 0.25, ease: "easeOut" }}
                whileHover={{ scale: 1.03 }}
                whileDrag={{ scale: 1.06, zIndex: 50, cursor: "grabbing" }}
              >
                <Card
                  className={`group/node relative w-full overflow-hidden rounded-xl border ${colorCls} bg-white p-3 transition-all hover:shadow-md ${
                    isDragging ? "shadow-xl ring-2 ring-[#22C55E]/40" : ""
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent opacity-0 transition-opacity group-hover/node:opacity-100" />
                  <div className="relative space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${colorCls} bg-white`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[9px] uppercase tracking-[0.15em] text-zinc-400 mb-0.5">
                          {node.type}
                        </span>
                        <h3 className="truncate text-xs font-semibold text-[#F8FAFC]">
                          {node.label}
                        </h3>
                      </div>
                    </div>
                    {node.description && (
                      <p className="line-clamp-2 text-[10px] leading-relaxed text-zinc-500">
                        {node.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                      <ArrowRight className="h-2.5 w-2.5" />
                      <span className="uppercase tracking-[0.1em]">Connected</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-400">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 uppercase tracking-[0.15em]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {nodes.length} {nodes.length === 1 ? "Node" : "Nodes"}
          </span>
          <span className="flex items-center gap-1.5 uppercase tracking-[0.15em]">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            {connections.length} {connections.length === 1 ? "Edge" : "Edges"}
          </span>
        </div>
        <span className="uppercase tracking-[0.2em]">Drag to reposition</span>
      </div>
    </div>
  );
}
