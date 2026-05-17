'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Github,
  ArrowRight,
  Loader2,
  AlertCircle,
  Zap,
  Brain,
  MessageCircle,
  LayoutDashboard,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { ingestRepo } from '@/lib/api';

const GLSLHills = dynamic(
  () => import('@/components/ui/glsl-hills').then((m) => m.GLSLHills),
  { ssr: false }
);

const PipelineFlow = dynamic(() => import('@/components/PipelineFlow'), {
  ssr: false,
  loading: () => (
    <div className="h-[160px] rounded-xl bg-zinc-100 border border-zinc-200 shimmer" />
  ),
});

const FEATURES = [
  {
    icon: Zap,
    title: 'Instant Indexing',
    desc: 'Analyze any public GitHub repo in under 60 seconds with parallel file processing.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
  },
  {
    icon: Brain,
    title: 'AI Architecture Maps',
    desc: "Auto-generated visual diagrams of your repo's components, services, and data flow.",
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
  },
  {
    icon: MessageCircle,
    title: 'Codebase Chat',
    desc: 'Ask natural language questions and get accurate answers grounded in your actual code.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    icon: LayoutDashboard,
    title: 'Setup Guides',
    desc: 'Auto-generated onboarding steps, environment variables, and dependency breakdowns.',
    color: 'text-zinc-700',
    bg: 'bg-zinc-100 border-zinc-200',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidGithubUrl = (val: string) => {
    return /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/.test(val.trim());
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedUrl = url.trim();

      if (!trimmedUrl) {
        setError('Please enter a GitHub repository URL.');
        return;
      }
      if (!isValidGithubUrl(trimmedUrl)) {
        setError('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo)');
        return;
      }

      setError(null);
      setLoading(true);
      try {
        const result = await ingestRepo(trimmedUrl);
        router.push(`/dashboard/${result.repo_id}`);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to analyze repository. Make sure the backend is running at localhost:8000.'
        );
      } finally {
        setLoading(false);
      }
    },
    [url, router]
  );

  return (
    <main className="min-h-screen flex flex-col overflow-x-hidden">
      {/* GLSL hills — fixed full-viewport */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <GLSLHills width="100%" height="100%" speed={0.4} cameraZ={125} planeSize={256} />
      </div>


      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
            <Compass size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-zinc-900">
            Code<span className="text-zinc-500">Compass</span>
          </span>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-150"
        >
          <Github size={16} />
          GitHub
        </a>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pt-16 pb-8 text-center">
        <div className="relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-medium mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-900 animate-pulse" />
          AI-Powered Developer Onboarding
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-zinc-900 leading-tight tracking-tight max-w-3xl"
        >
          Understand any codebase in{' '}
          <span className="text-zinc-400">minutes, not days</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="mt-4 text-zinc-500 text-base md:text-lg max-w-xl leading-relaxed mx-auto text-center"
        >
          Paste a GitHub URL and get instant architecture insights, setup guides, and a chat
          interface powered by Gemini AI.
        </motion.p>

        {/* Input form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
          className="w-full max-w-2xl mt-10 mx-auto"
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 transition-colors duration-150">
                <Github size={18} />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://github.com/owner/repo"
                disabled={loading}
                aria-label="GitHub repository URL"
                className="w-full bg-white border border-zinc-200 rounded-xl pl-11 pr-4 py-4 text-zinc-900 placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 transition-all duration-200 disabled:opacity-60 shadow-sm"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm"
                >
                  <AlertCircle size={14} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-zinc-900 hover:bg-zinc-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Indexing repository… This may take 30–60 seconds</span>
                </>
              ) : (
                <>
                  <span>Analyze Repository</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-zinc-400 mt-3">
            Works with any public GitHub repository. No login required.
          </p>
        </motion.div>
        </div>{/* /relative z-1 */}
      </section>

      {/* Fade bridge: hills → white */}
      <div className="relative z-10 w-full h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, white)' }} />

      {/* Below-hero: full-width white block covers hills completely */}
      <div className="relative z-10 w-full bg-white">
        {/* Pipeline section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="w-full max-w-5xl mx-auto px-6 pb-16 pt-4"
        >
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-zinc-900 mb-2">How CodeCompass Works</h2>
            <p className="text-sm text-zinc-500">From GitHub URL to actionable insights in seconds</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm overflow-hidden">
            <PipelineFlow />
          </div>
        </motion.section>

        {/* Features grid */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full max-w-5xl mx-auto px-6 pb-20"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
                className="glass p-5 space-y-3"
              >
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${f.bg}`}>
                  <f.icon size={16} className={f.color} />
                </div>
                <h3 className="text-sm font-semibold text-zinc-900">{f.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-zinc-100 py-6 text-center">
          <p className="text-xs text-zinc-400">Built with Next.js · Gemini AI · ChromaDB</p>
        </footer>
      </div>
    </main>
  );
}
