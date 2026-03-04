'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { aiApi } from '../../lib/api';
import { Send, Bot, User, Sparkles, TrendingUp, Package, Zap, MessageSquare } from 'lucide-react';
import { isOwnerSessionValid } from '../../lib/auth';
import { cn } from '../../lib/utils';

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
      content: "SYSTEM_INITIALIZED: Notable AI v1.0\n\nI am your strategic shop assistant. I have mapped your current inventory and sales trajectory. How can I optimize your operations today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOwnerSessionValid()) {
      router.replace('/login');
    }
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
          content: 'ERR_LLM_TIMEOUT: Please verify your connection or API configuration.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "Predict restock needs",
    "Identify top 5 revenue drivers",
    "Analyze monthly profit trajectory",
    "Detect slow-moving inventory",
  ];

  return (
    <div className="min-h-screen page-enter flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8 h-[calc(100vh-80px)]">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ padding: '0.75rem', backgroundColor: 'var(--accent-dim)', borderRadius: 'var(--radius)', border: '1px solid var(--accent)' }}>
              <Bot size={24} color="var(--accent)" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', lineHeight: 1 }}>Neural Advisor</h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>MODE: STRATEGIC_ANALYSIS</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div
              style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 2s infinite' }}
            />
            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>SYSTEM_READY</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">

          {/* Chat Pane */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-none">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(undefined, q)}
                  className="btn btn-outline whitespace-nowrap text-xs py-2 px-3 border-dashed"
                >
                  <Zap size={12} color="var(--accent)" />
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Container */}
            <div
              className="flex-1 overflow-y-auto pr-4 space-y-6 scrollbar-thin scrollbar-thumb-[var(--border)]"
            >
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col gap-2", msg.role === 'user' ? "items-end" : "items-start")}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)', letterSpacing: '0.1em' }}>
                      {msg.role === 'user' ? 'USER_PROMPT' : 'ASSISTANT_RELAY'}
                    </span>
                  </div>
                  <div
                    className="card"
                    style={{
                      backgroundColor: msg.role === 'user' ? 'var(--bg-3)' : 'var(--bg-2)',
                      border: msg.role === 'user' ? '1px solid var(--accent-dim)' : '1px solid var(--border)',
                      padding: '1rem 1.25rem',
                      maxWidth: '85%',
                      borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px'
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
                              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>KEY_INSIGHTS</span>
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
                              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>ACTIONS_REQ</span>
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
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)', letterSpacing: '0.1em' }}>PROCESSING_REQUEST</span>
                  <div className="card h-12 flex items-center gap-2 px-4 border-dashed animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0.4s' }} />
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
                placeholder="Query global inventory, sales patterns, or projections..."
                className="input w-full h-16 pl-14 pr-20 text-lg border-2"
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
          <div className="hidden lg:flex w-72 flex-col gap-6">
            <div className="card border-dashed">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} color="var(--accent)" />
                <h3 style={{ fontSize: '0.9rem' }}>Suggested Strategy</h3>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-[var(--bg-3)] rounded-[var(--radius)]">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    "Sales for **Indomie** peak between 4 PM - 7 PM. Consider running a bundle deal on eggs."
                  </p>
                </div>
                <div className="p-3 bg-[var(--bg-3)] rounded-[var(--radius)]">
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    "Your cash liquidity is high. Optimal time for a total stock refresh."
                  </p>
                </div>
              </div>
            </div>

            <div className="card group hover:border-[var(--info)] transition-colors">
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>SYSTEM_STATUS</p>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sync Health</span>
                <span style={{ color: 'var(--accent)', fontWeight: 800 }}>99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
