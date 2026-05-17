'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  Compass,
  ExternalLink,
  LayoutDashboard,
  GitBranch,
  Package,
  BookOpen,
  MessageSquare,
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { getStatus, getArchitecture, type StatusResponse, type ArchitectureResponse } from '@/lib/api';

const Overview = dynamic(() => import('@/components/Overview'), { ssr: false, loading: () => <TabSkeleton /> });
const RepoArchitectureFlow = dynamic(() => import('@/components/RepoArchitectureFlow'), { ssr: false, loading: () => <TabSkeleton /> });
const Dependencies = dynamic(() => import('@/components/Dependencies'), { ssr: false, loading: () => <TabSkeleton /> });
const SetupGuide = dynamic(() => import('@/components/SetupGuide'), { ssr: false, loading: () => <TabSkeleton /> });
const ChatInterface = dynamic(() => import('@/components/ChatInterface'), { ssr: false, loading: () => <TabSkeleton /> });

function TabSkeleton() {
  return (
    <div className="p-6 space-y-4">
      {[1, 2, 3].map((i) => <div key={i} className="shimmer rounded-xl h-20" />)}
    </div>
  );
}

type TabKey = 'overview' | 'architecture' | 'dependencies' | 'setup' | 'chat';

interface Tab { key: TabKey; label: string; icon: React.ReactNode; }

const TABS: Tab[] = [
  { key: 'overview',      label: 'Overview',      icon: <LayoutDashboard size={15} /> },
  { key: 'architecture',  label: 'Architecture',  icon: <GitBranch size={15} /> },
  { key: 'dependencies',  label: 'Dependencies',  icon: <Package size={15} /> },
  { key: 'setup',         label: 'Setup Guide',   icon: <BookOpen size={15} /> },
  { key: 'chat',          label: 'Ask AI',        icon: <MessageSquare size={15} /> },
];

function StatusIndicator({ status }: { status: StatusResponse['status'] }) {
  const map: Record<string, { color: string; label: string; text: string }> = {
    processing: { color: 'bg-blue-500 animate-pulse', label: 'Indexing…', text: 'text-blue-600' },
    ready:      { color: 'bg-emerald-500',            label: 'Ready',      text: 'text-emerald-600' },
    error:      { color: 'bg-red-500',                label: 'Error',      text: 'text-red-600' },
    unknown:    { color: 'bg-amber-500',              label: 'Unknown',    text: 'text-amber-600' },
  };
  const s = map[status] ?? map.unknown;
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${s.color}`} />
      <span className={`text-xs font-medium ${s.text}`}>{s.label}</span>
    </div>
  );
}

function ArchitectureTab({ repoId }: { repoId: string }) {
  const [data, setData] = useState<ArchitectureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await getArchitecture(repoId)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to load architecture'); }
    finally { setLoading(false); }
  }, [repoId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <TabSkeleton />;

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
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-zinc-900 mb-1">Architecture Diagram</h2>
        <p className="text-sm text-zinc-500">Drag nodes to reposition</p>
      </div>
      <RepoArchitectureFlow nodes={data.nodes} edges={data.edges} summary={data.summary} />
    </div>
  );
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const repoId = Array.isArray(params?.repoId) ? params.repoId[0] : (params?.repoId ?? '');

  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchStatus = useCallback(async () => {
    try { setStatus(await getStatus(repoId)); }
    catch (err) { setStatusError(err instanceof Error ? err.message : 'Failed to load repository status'); }
  }, [repoId]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(async () => {
      try {
        const result = await getStatus(repoId);
        setStatus(result);
        if (result.status === 'ready' || result.status === 'error') clearInterval(interval);
      } catch { clearInterval(interval); }
    }, 5000);
    return () => clearInterval(interval);
  }, [repoId, fetchStatus]);

  const repoName = status?.name || repoId;
  const githubUrl = status?.url;
  const isReady = status?.status === 'ready';
  const isIndexing = status?.status === 'processing';

  if (statusError) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="glass p-8 max-w-md w-full mx-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-900">Repository Not Found</h2>
        <p className="text-sm text-zinc-500">{statusError}</p>
        <button onClick={() => router.push('/')} className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-700 transition-all duration-150">
          <ArrowLeft size={14} /> Back to Home
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r border-zinc-200 flex-shrink-0 h-screen sticky top-0 bg-white"
        style={{ width: sidebarOpen ? '240px' : '64px', transition: 'width 200ms ease-out' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-100">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center flex-shrink-0">
            <Compass size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="text-sm font-bold text-zinc-900 truncate">
              Code<span className="text-zinc-400">Compass</span>
            </span>
          )}
        </div>

        {/* Repo info */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-b border-zinc-100 space-y-2">
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Repository</p>
            <p className="text-sm font-semibold text-zinc-900 truncate" title={repoName}>{repoName}</p>
            {status && <StatusIndicator status={status.status} />}
            {githubUrl && (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-900 transition-colors duration-150 truncate">
                <ExternalLink size={11} />
                <span className="truncate">View on GitHub</span>
              </a>
            )}
          </div>
        )}

        {/* Nav tabs */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const isDisabled = !isReady && tab.key !== 'overview';
            return (
              <button
                key={tab.key}
                onClick={() => !isDisabled && setActiveTab(tab.key)}
                disabled={isDisabled}
                title={isDisabled ? 'Available once indexed' : tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : isDisabled
                    ? 'text-zinc-300 cursor-not-allowed'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <span className="flex-shrink-0">{tab.icon}</span>
                {sidebarOpen && <span className="truncate">{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Back link */}
        <div className="px-2 py-4 border-t border-zinc-100">
          <button onClick={() => router.push('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-150">
            <ArrowLeft size={15} className="flex-shrink-0" />
            {sidebarOpen && <span>New Repo</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen((v) => !v)} aria-label="Toggle sidebar"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-150 flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect y="1"    width="14" height="1.5" rx="0.75" fill="currentColor" />
                <rect y="6.25" width="14" height="1.5" rx="0.75" fill="currentColor" />
                <rect y="11.5" width="14" height="1.5" rx="0.75" fill="currentColor" />
              </svg>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              {TABS.find((t) => t.key === activeTab)?.icon}
              <h1 className="text-sm font-semibold text-zinc-900 truncate">
                {TABS.find((t) => t.key === activeTab)?.label}
              </h1>
              {repoName && (
                <span className="text-zinc-400 text-sm hidden md:block">
                  — <span className="truncate">{repoName}</span>
                </span>
              )}
            </div>
          </div>
          {status && <div className="flex-shrink-0"><StatusIndicator status={status.status} /></div>}
        </header>

        {/* Indexing banner */}
        <AnimatePresence>
          {isIndexing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex-shrink-0 flex items-center gap-3 px-6 py-3 bg-blue-50 border-b border-blue-100"
            >
              <Loader2 size={14} className="text-blue-500 animate-spin flex-shrink-0" />
              <p className="text-xs text-blue-600">
                Indexing repository… This may take 30–60 seconds. Overview will update automatically.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab content */}
        <div className={`flex-1 overflow-y-auto ${activeTab === 'chat' ? 'overflow-hidden flex flex-col' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2, ease: 'easeOut' }}
              className={activeTab === 'chat' ? 'flex-1 min-h-0 flex flex-col h-full' : ''}
            >
              {activeTab === 'overview'      && <Overview repoId={repoId} />}
              {activeTab === 'architecture'  && <ArchitectureTab repoId={repoId} />}
              {activeTab === 'dependencies'  && <Dependencies repoId={repoId} />}
              {activeTab === 'setup'         && <SetupGuide repoId={repoId} />}
              {activeTab === 'chat' && (
                <div className="flex-1 min-h-0 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                  <ChatInterface repoId={repoId} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
