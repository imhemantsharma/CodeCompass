'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  type NodeProps,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import {
  Github,
  FileText,
  Cpu,
  Database,
  Sparkles,
  MessageSquare,
} from 'lucide-react';

interface PipelineNodeData {
  label: string;
  icon: React.ReactNode;
  color: string;
  type: 'source' | 'process' | 'storage' | 'ai' | 'output';
  delay: number;
}

const iconColorMap: Record<string, string> = {
  source: 'from-slate-500 to-slate-600',
  process: 'from-blue-500 to-blue-600',
  storage: 'from-amber-500 to-amber-600',
  ai: 'from-purple-500 to-purple-600',
  output: 'from-green-500 to-green-600',
};

function PipelineNode({ data }: NodeProps) {
  const nodeData = data as unknown as PipelineNodeData;
  const gradientClass = iconColorMap[nodeData.type] || 'from-slate-500 to-slate-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: nodeData.delay * 0.12, duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col items-center gap-2"
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0, pointerEvents: 'none' }} />
      <div
        className="flex flex-col items-center gap-2 px-3 py-3 rounded-xl border border-zinc-200 shadow-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          minWidth: '100px',
        }}
      >
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}
        >
          {nodeData.icon}
        </div>
        <span className="text-xs font-medium text-zinc-900 text-center leading-tight whitespace-nowrap">
          {nodeData.label}
        </span>
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0, pointerEvents: 'none' }} />
    </motion.div>
  );
}

const nodeTypes = { pipelineNode: PipelineNode };

const pipelineNodes: Node[] = [
  {
    id: '1',
    type: 'pipelineNode',
    position: { x: 0, y: 30 },
    data: {
      label: 'GitHub Repo',
      icon: <Github size={18} className="text-white" />,
      color: '#22C55E',
      type: 'source',
      delay: 0,
    },
    draggable: false,
    selectable: false,
    connectable: false,
  },
  {
    id: '2',
    type: 'pipelineNode',
    position: { x: 190, y: 30 },
    data: {
      label: 'File Parser',
      icon: <FileText size={18} className="text-white" />,
      color: '#3B82F6',
      type: 'process',
      delay: 1,
    },
    draggable: false,
    selectable: false,
    connectable: false,
  },
  {
    id: '3',
    type: 'pipelineNode',
    position: { x: 380, y: 30 },
    data: {
      label: 'Embeddings',
      icon: <Cpu size={18} className="text-white" />,
      color: '#3B82F6',
      type: 'process',
      delay: 2,
    },
    draggable: false,
    selectable: false,
    connectable: false,
  },
  {
    id: '4',
    type: 'pipelineNode',
    position: { x: 570, y: 30 },
    data: {
      label: 'ChromaDB',
      icon: <Database size={18} className="text-white" />,
      color: '#F59E0B',
      type: 'storage',
      delay: 3,
    },
    draggable: false,
    selectable: false,
    connectable: false,
  },
  {
    id: '5',
    type: 'pipelineNode',
    position: { x: 760, y: 30 },
    data: {
      label: 'Gemini AI',
      icon: <Sparkles size={18} className="text-white" />,
      color: '#8B5CF6',
      type: 'ai',
      delay: 4,
    },
    draggable: false,
    selectable: false,
    connectable: false,
  },
  {
    id: '6',
    type: 'pipelineNode',
    position: { x: 950, y: 30 },
    data: {
      label: 'Chat + Insights',
      icon: <MessageSquare size={18} className="text-white" />,
      color: '#22C55E',
      type: 'output',
      delay: 5,
    },
    draggable: false,
    selectable: false,
    connectable: false,
  },
];

const pipelineEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#18181B', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#18181B', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#18181B', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', animated: true, style: { stroke: '#18181B', strokeWidth: 2 } },
  { id: 'e5-6', source: '5', target: '6', animated: true, style: { stroke: '#18181B', strokeWidth: 2 } },
];

function PipelineFlowInner() {
  const onInit = useCallback(() => {}, []);

  return (
    <div
      style={{ width: '100%', height: '160px' }}
      className="rounded-xl overflow-hidden"
    >
      <ReactFlow
        nodes={pipelineNodes}
        edges={pipelineEdges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        preventScrolling={false}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
      </ReactFlow>
    </div>
  );
}

export default function PipelineFlow() {
  return (
    <ReactFlowProvider>
      <PipelineFlowInner />
    </ReactFlowProvider>
  );
}
