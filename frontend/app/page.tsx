'use client';

import Link from 'next/link';
import { ShoppingBag, Zap, Shield, MessageSquare, BarChart3, ArrowRight, Star, CheckCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { cn } from '../lib/utils';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white selection:bg-[var(--accent)] selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[var(--accent)] opacity-[0.03] blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-3)] border border-[var(--border)] mb-8 animate-in fade-in slide-in-from-bottom-4">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em' }}>
              V2.0_POWERED_BY_AI_CORE
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-[800] leading-tight mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ fontFamily: 'var(--font-display)' }}>
            The Future of <br />
            <span className="text-[var(--accent)]">Provision Store</span> Ops
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-[var(--text-2)] mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Notable AI is a high-performance management ecosystem designed to eliminate inventory waste, maximize sales margin, and automate branch operations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Link href="/register" className="btn btn-primary px-10 py-4 text-lg w-full sm:w-auto">
              GET_STARTED
              <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="btn btn-outline px-10 py-4 text-lg w-full sm:w-auto">
              OWNER_LOGIN
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-[#0d0f12]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Predictive Restock',
                desc: 'AI-driven burn rate analysis predicts stockouts before they happen.',
                color: 'var(--accent)'
              },
              {
                icon: MessageSquare,
                title: '"Ghost" Assistant',
                desc: 'Real-time upsell suggestions and margin alerts during checkout.',
                color: 'var(--info)'
              },
              {
                icon: Shield,
                title: 'Debt Shield',
                desc: 'Smart CRM with credit limit enforcement and payment tracking.',
                color: 'var(--danger)'
              },
              {
                icon: BarChart3,
                title: 'Multi-Store',
                desc: 'Seamlessly manage multiple branches with isolated data kernels.',
                color: 'var(--gold)'
              }
            ].map((feature, i) => (
              <div key={i} className="card p-8 group hover:border-[var(--accent)] transition-all">
                <div className="w-12 h-12 rounded-[var(--radius)] bg-[var(--bg-3)] border border-[var(--border)] flex items-center justify-center mb-6 group-hover:bg-[var(--accent-dim)] transition-colors">
                  <feature.icon size={24} style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[var(--text-3)] text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats/Trust Bar */}
      <section className="py-24 border-y border-[var(--border)] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-sm font-mono text-[var(--text-3)] mb-16 uppercase tracking-[0.2em]">Deployment_Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: 'AVG_SALES_UPSET', val: '+24%' },
              { label: 'WASTE_REDUCTION', val: '40%' },
              { label: 'BRANCHES_SUPPORTED', val: '∞' },
              { label: 'UPTIME_GUARANTEE', val: '99.9%' }
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl md:text-5xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {stat.val}
                </p>
                <p className="text-xs font-mono text-[var(--accent)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-[var(--accent)] opacity-[0.02] -skew-y-3" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)' }}>
            Ready to upgrade your store?
          </h2>
          <p className="text-[var(--text-2)] mb-12 text-lg">
            Join 500+ provision store owners using Notable to automate their daily grind.
          </p>
          <Link
            href="/register"
            className="btn btn-primary px-12 py-5 text-xl font-bold rounded-full group mx-auto"
          >
            INITIALIZE_NOW
            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)]" style={{ boxShadow: 'var(--glow-accent)' }} />
            <span className="font-black tracking-tighter text-xl">NOTABLE</span>
          </div>
          <div className="flex gap-8 text-xs font-mono text-[var(--text-3)]">
            <a href="#" className="hover:text-white">API_DOCS</a>
            <a href="#" className="hover:text-white">SECURITY_MANIFESTO</a>
            <a href="#" className="hover:text-white">TERMS_v2.0</a>
          </div>
          <p className="text-[var(--text-3)] text-xs font-mono">
            &copy; 2026 NOTABLE_LABS. ALL_RIGHTS_RESERVED.
          </p>
        </div>
      </footer>
    </div>
  );
}
