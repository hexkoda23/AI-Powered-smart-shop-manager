'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Store } from 'lucide-react';
import { setOwnerSession, getRole, setShopContext, setRole, getShopContext } from '../../lib/auth';
import { authApi } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const context = getShopContext();
    if (context.id && getRole()) router.push('/dashboard');
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) {
      setError('Please enter store name and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const shop = await authApi.login(name, password);
      setShopContext(shop.id, shop.name);
      window.localStorage.setItem('notable_is_pin_set', shop.is_pin_set.toString());
      setRole('worker');
      setOwnerSession(false);
      router.push('/profiles');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials');
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

        <form onSubmit={handleLogin} className="glass space-y-5 p-6">
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
                placeholder="Enter password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full pl-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

          <button type="submit" disabled={loading || !name || !password} className="btn btn-primary w-full bg-gradient-to-r from-[#6C63FF] to-[#8B7CFF] py-3">
            {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/45">
          New business?{' '}
          <Link href="/register" className="font-medium text-[#b9b5ff] hover:text-white">
            Create your shop
          </Link>
        </p>
      </div>
    </main>
  );
}
