'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode2, Code2, ShieldCheck, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { getOverview, type OverviewResponse } from '@/lib/api';

interface OverviewProps { repoId: string; }

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <SkeletonBlock className="h-8 w-2/3" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <div className="flex gap-4">
        <SkeletonBlock className="h-20 w-32 rounded-xl" />
        <SkeletonBlock className="h-20 w-32 rounded-xl" />
        <SkeletonBlock className="h-20 w-32 rounded-xl" />
      </div>
      <SkeletonBlock className="h-6 w-40 mt-4" />
      <div className="flex flex-wrap gap-2">
        {[1,2,3,4,5].map((i) => <SkeletonBlock key={i} className="h-7 w-20 rounded-full" />)}
      </div>
    </div>
  );
}

function healthColor(score: number) {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

function healthLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  return 'Needs Work';
}

const techColors = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-pink-50 text-pink-700 border-pink-200',
];

export default function Overview({ repoId }: OverviewProps) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try { setData(await getOverview(repoId)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load overview'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [repoId]);

  if (loading) return <OverviewSkeleton />;

  if (error) return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <p className="text-zinc-500 text-sm">{error}</p>
      <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-700 transition-all duration-150">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );

  if (!data) return null;
  const hc = healthColor(data.health_score);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }} className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">{data.name}</h1>
        <p className="text-zinc-500 leading-relaxed text-sm">{data.description}</p>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="glass px-5 py-4 flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <FileCode2 size={13} /> Files
          </div>
          <span className="text-xl font-bold text-zinc-900">{data.file_count.toLocaleString()}</span>
        </div>
        <div className="glass px-5 py-4 flex flex-col gap-1 min-w-[120px]">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <Code2 size={13} /> Language
          </div>
          <span className="text-xl font-bold text-zinc-900">{data.primary_language}</span>
        </div>
        <div className={`px-5 py-4 flex flex-col gap-1 min-w-[140px] rounded-xl border ${hc}`}>
          <div className="flex items-center gap-2 text-xs font-medium opacity-80">
            <ShieldCheck size={13} /> Health Score
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold">{data.health_score}</span>
            <span className="text-xs pb-0.5 opacity-70 font-medium">{healthLabel(data.health_score)}</span>
          </div>
        </div>
      </div>

      {/* Tech stack */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Code2 size={14} className="text-zinc-500" /> Tech Stack
        </h2>
        <div className="flex flex-wrap gap-2">
          {data.tech_stack.map((tech, i) => (
            <span key={tech} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${techColors[i % techColors.length]}`}>
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Key features */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-zinc-500" /> Key Features
        </h2>
        <ul className="space-y-2.5">
          {data.key_features.map((feature) => (
            <motion.li key={feature} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}
              className="flex items-start gap-3 text-sm text-zinc-600">
              <CheckCircle2 size={15} className="text-zinc-400 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
