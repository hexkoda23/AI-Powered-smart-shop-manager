'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Zap, Shield, MessageSquare, BarChart3, ArrowRight, Star, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { cn } from '../lib/utils';

const ECOSYSTEM_STEPS = [
  {
    step: '01',
    title: 'Deploy Store Identity',
    desc: 'Initialize your digital presence by registering your business name and establishing a secure, 10-character alphanumeric password. This first layer of security protects your core business data from the start.',
    icon: Store
  },
  {
    step: '02',
    title: 'Initialize Worker Ops',
    desc: 'Empower your team with high-performance dashboards. Record every sale in real-time, track inventory fluctuations automatically, and build a lasting customer database without complex administrative overhead.',
    icon: ShoppingBag
  },
  {
    step: '03',
    title: 'Elevate to Owner Core',
    desc: 'Unlock strategic command by elevating your role. Using a secure 4-digit PIN, access advanced profit analytics, AI-driven stock auditing, and sensitive system settings tailored for business growth.',
    icon: ShieldCheck
  }
];

import { Store, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [hasShop, setHasShop] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shopId = window.localStorage.getItem('notable_shop_id');
      setHasShop(!!shopId);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % ECOSYSTEM_STEPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollToEcosystem = () => {
    document.getElementById('ecosystem')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-white selection:bg-[var(--accent)] selection:text-black">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-[var(--accent)] opacity-[0.03] blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">

          <h1 className="text-5xl md:text-7xl font-[800] leading-tight mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ fontFamily: 'var(--font-display)' }}>
            The Future of <br />
            <span className="text-[var(--accent)]">Provision Store</span> Ops
          </h1>

          <p className="max-w-2xl mx-auto text-lg text-[var(--text-2)] mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Notable AI is a high-performance management ecosystem designed to eliminate inventory waste, maximize sales margin, and automate branch operations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <Link href={hasShop ? "/login" : "/register"} className="btn btn-primary px-10 py-4 text-lg w-full sm:w-auto">
              GET_STARTED
              <ArrowRight size={20} />
            </Link>
            <button
              onClick={scrollToEcosystem}
              className="btn btn-outline px-10 py-4 text-lg w-full sm:w-auto group"
            >
              VIEW_DEMO
              <Zap size={18} className="ml-2 group-hover:text-[var(--accent)] transition-colors" />
            </button>
          </div>
        </div>
      </section>

      {/* Rotating Steps Explanation Section */}
      <section id="ecosystem" className="py-24 relative overflow-hidden bg-[var(--bg-2)]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Mastering the <span className="text-[var(--accent)]">Notable Ecosystem</span>
            </h2>
            <p className="text-[var(--text-3)] max-w-xl mx-auto">Discover the three-tiered architecture designed to scale your provision business from deployment to strategic dominance.</p>
          </div>

          <div className="relative group">
            {/* Carousel Container */}
            <div className="glass p-1 rounded-[3rem] border border-[var(--border)] relative overflow-hidden bg-[var(--bg-3)]/20">
              <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${activeStep * 100}%)` }}>
                {ECOSYSTEM_STEPS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="min-w-full p-12 md:p-20 flex flex-col items-center text-center">
                      <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mb-8 shadow-2xl shadow-[var(--accent)]/5">
                        <Icon size={40} className="text-[var(--accent)]" />
                      </div>
                      <div className="inline-block px-4 py-1 rounded-full bg-[var(--bg-3)] border border-[var(--border)] mb-6">
                        <span className="font-mono text-[10px] text-[var(--text-3)] font-bold uppercase tracking-[0.3em]">Module_{item.step}</span>
                      </div>
                      <h3 className="text-3xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</h3>
                      <p className="text-[var(--text-2)] text-lg leading-relaxed max-w-2xl mx-auto">
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="flex justify-center items-center gap-6 mt-12">
              <button
                onClick={() => setActiveStep((prev) => (prev - 1 + ECOSYSTEM_STEPS.length) % ECOSYSTEM_STEPS.length)}
                className="p-3 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] hover:bg-[var(--bg-3)] hover:text-[var(--accent)] transition-all"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="flex gap-3">
                {ECOSYSTEM_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      activeStep === i ? "w-12 bg-[var(--accent)]" : "w-3 bg-[var(--border)]"
                    )}
                  />
                ))}
              </div>

              <button
                onClick={() => setActiveStep((prev) => (prev + 1) % ECOSYSTEM_STEPS.length)}
                className="p-3 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] hover:bg-[var(--bg-3)] hover:text-[var(--accent)] transition-all"
              >
                <ChevronRight size={24} />
              </button>
            </div>
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
