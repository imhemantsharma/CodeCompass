'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { getDependencies, type DependenciesResponse, type Dependency } from '@/lib/api';

interface DependenciesProps { repoId: string; }
type Category = 'all' | Dependency['category'];

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend',  label: 'Backend' },
  { key: 'database', label: 'Database' },
  { key: 'devops',   label: 'DevOps' },
  { key: 'testing',  label: 'Testing' },
  { key: 'utility',  label: 'Utility' },
];

const categoryStyle: Record<Dependency['category'], string> = {
  frontend: 'bg-blue-50 text-blue-700 border-blue-200',
  backend:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  database: 'bg-amber-50 text-amber-700 border-amber-200',
  devops:   'bg-purple-50 text-purple-700 border-purple-200',
  testing:  'bg-red-50 text-red-700 border-red-200',
  utility:  'bg-zinc-100 text-zinc-600 border-zinc-300',
};

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

function DependenciesSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2 mb-4">
        {[1,2,3,4,5].map((i) => <SkeletonBlock key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass p-4 space-y-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-2/3" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DependencyCard({ dep, index }: { dep: Dependency; index: number }) {
  return (
    <motion.div key={dep.name} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.2 }}
      className="glass p-4 space-y-2 hover:border-zinc-300 transition-all duration-150 group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Package size={13} className="text-zinc-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-zinc-900 truncate">{dep.name}</span>
        </div>
        {dep.version && <span className="text-[10px] text-zinc-400 font-mono flex-shrink-0">{dep.version}</span>}
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{dep.purpose}</p>
      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-medium ${categoryStyle[dep.category]}`}>
        {dep.category}
      </span>
    </motion.div>
  );
}

export default function Dependencies({ repoId }: DependenciesProps) {
  const [data, setData] = useState<DependenciesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const fetchData = async () => {
    setLoading(true); setError(null);
    try { setData(await getDependencies(repoId)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load dependencies'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [repoId]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (activeCategory === 'all') return data.dependencies;
    return data.dependencies.filter((d) => d.category === activeCategory);
  }, [data, activeCategory]);

  const categoryCounts = useMemo(() => {
    if (!data) return {};
    return data.dependencies.reduce<Record<string, number>>((acc, d) => { acc[d.category] = (acc[d.category] || 0) + 1; return acc; }, {});
  }, [data]);

  if (loading) return <DependenciesSkeleton />;

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

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Dependencies</h2>
        <p className="text-sm text-zinc-500">{data.dependencies.length} packages across {Object.keys(categoryCounts).length} categories.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-zinc-400 mr-1">
          <Filter size={13} />
          <span className="text-xs font-medium">Filter:</span>
        </div>
        {CATEGORIES.map(({ key, label }) => {
          const count = key === 'all' ? data.dependencies.length : (categoryCounts[key] || 0);
          if (count === 0 && key !== 'all') return null;
          return (
            <button key={key} onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                activeCategory === key
                  ? 'bg-zinc-900 border-zinc-900 text-white'
                  : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400'
              }`}>
              {label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeCategory === key ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((dep, i) => <DependencyCard key={`${dep.name}-${dep.category}`} dep={dep} index={i} />)}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-zinc-400 text-sm">No dependencies in this category.</div>
      )}
    </div>
  );
}
