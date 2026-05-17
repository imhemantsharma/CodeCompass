'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Check, Terminal, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { getSetup, type SetupResponse, type SetupStep } from '@/lib/api';

interface SetupGuideProps { repoId: string; }

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

function SetupSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass p-5 space-y-3">
          <div className="flex gap-3 items-center">
            <SkeletonBlock className="w-8 h-8 rounded-full flex-shrink-0" />
            <SkeletonBlock className="h-5 w-48" />
          </div>
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-12 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, [text]);

  return (
    <button onClick={handleCopy} aria-label={copied ? 'Copied' : 'Copy to clipboard'}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
        copied
          ? 'bg-emerald-800/20 text-emerald-300 border border-emerald-700/30'
          : 'bg-zinc-700/60 text-zinc-300 border border-zinc-600/50 hover:text-white hover:border-zinc-500/60'
      }`}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function StepCard({ step, index }: { step: SetupStep; index: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3, ease: 'easeOut' }}
      className="glass p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
          <CheckCircle2 size={16} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Step {step.step}</span>
          <h3 className="text-sm font-semibold text-zinc-900 mt-0.5">{step.title}</h3>
        </div>
      </div>

      <p className="text-sm text-zinc-500 leading-relaxed pl-11">{step.description}</p>

      {step.command && (
        <div className="pl-11">
          <div className="rounded-lg overflow-hidden border border-zinc-700/50" style={{ background: '#1C1C1E' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/40">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Terminal size={12} />
                <span className="text-[10px] font-medium uppercase tracking-wider">Terminal</span>
              </div>
              <CopyButton text={step.command} />
            </div>
            <pre className="px-4 py-3 text-sm text-emerald-400 font-mono overflow-x-auto leading-relaxed" style={{ background: 'transparent' }}>
              <code>{step.command}</code>
            </pre>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function SetupGuide({ repoId }: SetupGuideProps) {
  const [data, setData] = useState<SetupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try { setData(await getSetup(repoId)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load setup guide'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [repoId]);

  if (loading) return <SetupSkeleton />;

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
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Setup Guide</h2>
        <p className="text-sm text-zinc-500">Follow these steps to get the project running locally.</p>
      </div>

      <div className="space-y-4">
        {data.steps.map((step, i) => <StepCard key={step.step} step={step} index={i} />)}
      </div>

      {data.environment_vars && data.environment_vars.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}
          className="glass p-5 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound size={15} className="text-zinc-500" />
            <h3 className="text-sm font-semibold text-zinc-900">Environment Variables</h3>
          </div>
          <p className="text-xs text-zinc-500">
            Create a <code className="bg-zinc-100 text-zinc-700 px-1 py-0.5 rounded border border-zinc-200">.env</code> file and set these variables:
          </p>
          <div className="rounded-lg border border-zinc-700/50 overflow-hidden" style={{ background: '#1C1C1E' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/40">
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Terminal size={12} />
                <span className="text-[10px] font-medium uppercase tracking-wider">.env</span>
              </div>
              <CopyButton text={data.environment_vars.join('\n')} />
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {data.environment_vars.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-300">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {data.notes && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="glass p-4 border-l-2 border-zinc-300">
          <p className="text-sm text-zinc-500 leading-relaxed">{data.notes}</p>
        </motion.div>
      )}
    </div>
  );
}
