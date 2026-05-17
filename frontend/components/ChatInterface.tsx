'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, User, FileCode, Loader2, AlertCircle } from 'lucide-react';
import { sendChat, type ChatMessage } from '@/lib/api';

interface ChatInterfaceProps { repoId: string; }

interface UIMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  sources?: string[];
  error?: boolean;
}

const QUICK_QUESTIONS = [
  'Where is authentication handled?',
  'How do I run this project locally?',
  'What should I learn first?',
  'Show me the API flow',
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-2 h-2 rounded-full bg-zinc-400"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  );
}

export default function ChatInterface({ repoId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<UIMessage[]>([{
    id: 'welcome', role: 'model',
    content: "Hello! I'm your CodeCompass AI assistant. I've analyzed this repository and I'm ready to help you understand it. Ask me anything about the codebase — architecture, setup steps, key files, or how to get started.",
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', content: trimmed }]);
    setInput('');
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const updatedHistory: ChatMessage[] = [...history, { role: 'user', content: trimmed }];

    try {
      const response = await sendChat(repoId, trimmed, updatedHistory);
      setMessages((prev) => [...prev, { id: `model-${Date.now()}`, role: 'model', content: response.response, sources: response.sources }]);
      setHistory([...updatedHistory, { role: 'assistant', content: response.response }]);
    } catch {
      setMessages((prev) => [...prev, { id: `error-${Date.now()}`, role: 'model', content: 'Sorry, I encountered an error processing your request. Please try again.', error: true }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, history, repoId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Quick questions */}
      <div className="p-4 border-b border-zinc-200">
        <p className="text-xs text-zinc-400 mb-2 font-medium uppercase tracking-wider">Quick questions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button key={q} onClick={() => handleSend(q)} disabled={isLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:border-zinc-400 hover:bg-zinc-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-zinc-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                msg.role === 'user'
                  ? 'bg-zinc-900 border border-zinc-900'
                  : msg.error
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-white border border-zinc-200'
              }`}>
                {msg.role === 'user' ? <User size={14} className="text-white" />
                  : msg.error ? <AlertCircle size={14} className="text-red-500" />
                  : <Bot size={14} className="text-zinc-400" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[75%] space-y-2 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-tr-sm'
                    : msg.error
                    ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-sm'
                    : 'bg-white border border-zinc-200 text-zinc-700 rounded-tl-sm'
                }`}>
                  {msg.role === 'model' && !msg.error
                    ? <div className="prose-content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    : <p>{msg.content}</p>}
                </div>

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src) => (
                      <span key={src} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-zinc-100 border border-zinc-200 text-zinc-500">
                        <FileCode size={10} /> {src}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-zinc-400" />
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl rounded-tl-sm">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 bg-white">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea ref={textareaRef} value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown}
              placeholder="Ask anything about the codebase…" rows={1} disabled={isLoading}
              className="w-full resize-none bg-white border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 transition-all duration-150 leading-relaxed min-h-[48px] max-h-[160px] shadow-sm"
              style={{ scrollbarWidth: 'none' }} />
          </div>
          <button onClick={() => handleSend(input)} disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-900 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex-shrink-0">
            {isLoading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-zinc-400 mt-2 text-center">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
