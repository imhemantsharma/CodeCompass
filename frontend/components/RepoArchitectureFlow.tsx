'use client';

import { N8nWorkflowBlock } from "@/components/ui/n8n-workflow-block-shadcnui";
import type { ArchNode, ArchEdge } from "@/lib/api";

interface RepoArchitectureFlowProps {
  nodes: ArchNode[];
  edges: ArchEdge[];
  summary: string;
}

export default function RepoArchitectureFlow({ nodes, edges, summary }: RepoArchitectureFlowProps) {
  return (
    <N8nWorkflowBlock archNodes={nodes} archEdges={edges} summary={summary} />
  );
}
