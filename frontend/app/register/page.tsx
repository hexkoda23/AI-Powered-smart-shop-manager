'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Eye, EyeOff, Lock, Store, X } from 'lucide-react';
import { authApi } from '../../lib/api';
import { setOwnerSession, setRole, setShopContext } from '../../lib/auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const rules = [
    { label: '10 characters or fewer', pass: password.length > 0 && password.length <= 10 },
    { label: 'Confirmation matches', pass: password.length > 0 && password === confirmPassword },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length > 10) {
      setError('Password must not exceed 10 characters');
      return;
    }

    setLoading(true);
    try {
      const shop = await authApi.register(name, password);
      setShopContext(shop.id, shop.name);
      window.localStorage.setItem('notable_is_pin_set', 'false');
      setRole('worker');
      setOwnerSession(false);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Try a different store name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#0A0A0F] px-4 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(108,99,255,0.22),transparent_32rem)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_0_40px_rgba(108,99,255,0.18)]">
            <Store className="h-7 w-7 text-[#b9b5ff]" />
          </div>
          <h1 className="font-display text-5xl font-extrabold tracking-normal">Notable</h1>
          <p className="mt-2 text-lg text-white/55">Your shop. Simplified.</p>
          <p className="mt-5 rounded-full border border-white/[0.07] bg-white/[0.04] px-4 py-2 text-sm text-white/55">
            Built for {name || 'your'} provision store
          </p>
        </div>

        <form onSubmit={handleRegister} className="glass space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm text-white/55">Shop name</label>
            <div className="relative">
              <Store className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Mama Tola Stores"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full pl-12"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/55">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password"
                required
                maxLength={10}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full pl-12 pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-white/55">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repeat password"
                required
                maxLength={10}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input w-full pl-12 pr-12"
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white">
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
            <p className="mb-3 text-xs uppercase tracking-wider text-white/40">Password rules</p>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-2 text-sm text-white/60">
                  <span className={rule.pass ? 'text-emerald-400' : 'text-white/25'}>
                    {rule.pass ? <Check size={16} /> : <X size={16} />}
                  </span>
                  {rule.label}
                </div>
              ))}
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary w-full bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] py-3">
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Create shop'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/45">
          Already registered?{' '}
          <Link href="/login" className="font-medium text-[#b9b5ff] hover:text-white">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
