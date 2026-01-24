'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { aiApi } from '../../lib/api';
import { Send, Bot, User, Sparkles, TrendingUp, Package } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  insights?: string[];
  recommendations?: string[];
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI shop assistant. I can help you with:\n\n• Sales insights and trends\n• Stock recommendations\n• Profit analysis\n• Business questions\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
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
      console.error('Failed to get AI response:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please make sure your OpenAI API key is configured correctly.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    "What should I restock this week?",
    "Which items sell the most?",
    "How much profit did I make last month?",
    "What are my slow-moving items?",
    "Show me sales trends",
  ];

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <Sparkles className="w-6 h-6 text-primary-600 mr-2" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Shop Assistant</h1>
          </div>
          <p className="text-gray-600 dark:text-slate-300">Ask me anything about your shop&apos;s performance, stock, or sales!</p>
        </div>

        {/* Quick Questions */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">Quick Questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(question)}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-950 hover:border-primary-300 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 mb-6 overflow-y-auto border border-transparent dark:border-slate-800">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-3 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-primary-100 text-primary-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-950 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {message.insights && message.insights.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-slate-700">
                        <div className="flex items-center mb-2">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          <span className="text-sm font-semibold">Insights:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {message.insights.map((insight, i) => (
                            <li key={i}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {message.recommendations && message.recommendations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-slate-700">
                        <div className="flex items-center mb-2">
                          <Package className="w-4 h-4 mr-2" />
                          <span className="text-sm font-semibold">Recommendations:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {message.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-gray-100 dark:bg-slate-950 rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your shop..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-950 text-gray-900 dark:text-white"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
