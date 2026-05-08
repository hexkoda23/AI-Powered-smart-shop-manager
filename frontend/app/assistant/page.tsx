'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { aiApi } from '../../lib/api';
import { Send, Bot, Sparkles, TrendingUp, Zap, MessageSquare, Loader2, Wifi } from 'lucide-react';
import { isOwnerSessionValid, getRole, Role } from '../../lib/auth';
import { cn } from '../../lib/utils';
import { UserCheck, User as UserIcon } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  insights?: string[];
  recommendations?: string[];
}

export default function AssistantPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi, I am Notable. Ask me what to restock, what is selling well, what is slowing down, or how your profit is moving.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOwnerSessionValid()) {
      router.replace('/login');
    }
    setRole(getRole());
  }, [router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, text?: string) => {
    if (e) e.preventDefault();
    const messageContent = text || input;
    if (!messageContent.trim() || loading) return;

    const userMessage = messageContent.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await aiApi.chat(userMessage);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.response,
          insights: response.insights,
          recommendations: response.recommendations,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not reach the assistant service just now. Please check that the backend is running, then try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What should I restock?",
    "Show my top 5 revenue drivers",
    "Analyze my monthly profit",
    "Detect slow-moving inventory",
  ];

  return (
    <div className="min-h-screen page-enter flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-10 flex flex-col gap-6 min-h-[calc(100vh-80px)]">

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--accent-dim)', borderRadius: 'var(--radius)', border: '1px solid var(--accent)' }}>
              <Bot size={24} color="var(--accent)" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl leading-tight">Shop Assistant</h1>
              <p className="mt-1 max-w-xl text-sm text-[var(--text-2)]">
                Get practical answers from your stock and sales records.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {role && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border animate-in zoom-in duration-500",
                role === 'owner'
                  ? "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)] shadow-[0_0_20px_rgba(0,229,160,0.1)]"
                  : "bg-[var(--info)]/10 border-[var(--info)]/20 text-[var(--info)] shadow-[0_0_20px_rgba(0,149,255,0.1)]"
              )}>
                {role === 'owner' ? <UserCheck size={16} /> : <UserIcon size={16} />}
                <span className="font-display font-bold tracking-widest text-xs uppercase">
                  {role === 'owner' ? 'Owner' : 'Worker'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <div
                style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 2s infinite' }}
              />
              <span className="text-xs font-medium text-[var(--text-2)]">Ready</span>
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 min-h-0">

          {/* Chat Pane */}
          <div className="flex min-h-[620px] flex-col gap-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111118]/70 p-4 shadow-2xl shadow-black/20">
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, q)}
                  disabled={loading}
                  className="btn btn-outline whitespace-nowrap text-xs py-2 px-3"
                >
                  <Zap size={12} color="var(--accent)" />
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Container */}
            <div
              className="custom-scrollbar flex-1 overflow-y-auto pr-1 md:pr-3 space-y-5"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs font-medium text-[var(--text-3)]">
                      {msg.role === 'user' ? 'You' : 'Notable'}
                    </span>
                  </div>
                  <div
                    className="border shadow-lg shadow-black/10"
                    style={{
                      backgroundColor: msg.role === 'user' ? 'var(--bg-3)' : 'var(--bg-2)',
                      border: msg.role === 'user' ? '1px solid var(--accent-dim)' : '1px solid var(--border)',
                      padding: '1rem 1.25rem',
                      maxWidth: 'min(92%, 720px)',
                      borderRadius: msg.role === 'user' ? '16px 6px 16px 16px' : '6px 16px 16px 16px'
                    }}
                  >
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</p>

                    {/* Assistant Extra Sections */}
                    {(msg.insights || msg.recommendations) && (
                      <div className="mt-6 pt-4 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-4">
                        {msg.insights && msg.insights.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[var(--info)]">
                              <TrendingUp size={14} />
                              <span className="text-xs font-bold uppercase tracking-wide">Key insights</span>
                            </div>
                            <ul className="space-y-1">
                              {msg.insights.map((insight, idx) => (
                                <li key={idx} className="text-[0.8rem] text-[var(--text-2)] flex items-start gap-2">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-3)] flex-shrink-0" />
                                  {insight}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[var(--accent)]">
                              <Zap size={14} />
                              <span className="text-xs font-bold uppercase tracking-wide">Next actions</span>
                            </div>
                            <ul className="space-y-1">
                              {msg.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-[0.8rem] text-[var(--text-2)] flex items-start gap-2">
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-3)] flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex flex-col items-start gap-2">
                  <span className="text-xs font-medium text-[var(--text-3)]">Notable</span>
                  <div className="flex h-12 items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.04] px-4 text-sm text-[var(--text-2)]">
                    <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
                    Checking your shop data...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSend}
              className="mt-auto relative"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about stock, sales, profit, or customers..."
                className="input w-full h-14 md:h-16 pl-12 md:pl-14 pr-20 text-base md:text-lg border-2"
                style={{ borderColor: input.length > 0 ? 'var(--accent)' : 'var(--border)' }}
                disabled={loading}
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
                <MessageSquare size={20} />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-primary h-10 w-12 p-0"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

          {/* Sidebar Insights (Static suggestions) */}
          <div className="hidden lg:flex flex-col gap-6">
            <div className="card border-dashed">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} color="var(--accent)" />
                <h3 style={{ fontSize: '0.9rem' }}>Try asking</h3>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-[var(--bg-3)] rounded-[var(--radius)]">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    Which items should I avoid restocking this week?
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-3)] rounded-[var(--radius)]">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    Which products are bringing the most money?
                  </p>
                </div>
              </div>
            </div>

            <div className="card group hover:border-[var(--info)] transition-colors">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-3)]">Assistant status</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Wifi size={14} />
                  Backend
                </span>
                <span style={{ color: 'var(--accent)', fontWeight: 800 }}>Online</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
