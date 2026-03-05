'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setOwnerSession, getRole, setShopContext, setRole, getShopContext } from '../../lib/auth';
import { authApi } from '../../lib/api';
import { Lock, Store, ArrowLeft, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const context = getShopContext();
        // Only redirect if there is a real authenticated session (shop ID exists)
        if (context.id && getRole()) {
            router.push('/dashboard');
        }
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
            setRole('worker'); // Standard login enters as worker
            setOwnerSession(false);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'INVALID_CREDENTIALS');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07080a] text-white flex flex-col relative overflow-hidden selection:bg-[var(--accent)] selection:text-black">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[var(--accent)] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

            <header className="p-8 relative z-10">
                <Link href="/" className="flex items-center gap-2 group w-fit">
                    <ArrowLeft size={20} className="text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors" />
                    <span className="text-xs font-mono text-[var(--text-3)] group-hover:text-white transition-colors uppercase tracking-widest">RETURN_TO_WEB</span>
                </Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="relative inline-block mb-4 group">
                            <div className="absolute inset-0 bg-[var(--accent)] blur-[25px] opacity-10" />
                            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] flex items-center justify-center relative">
                                <ShoppingBag size={28} color="var(--accent)" />
                                {loading && (
                                    <div className="absolute inset-0 border-2 border-[var(--accent)] border-t-transparent rounded-2xl animate-spin" />
                                )}
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold mb-1 tracking-tight">Access Store</h1>
                        <p className="text-[var(--text-3)] text-xs font-mono tracking-widest uppercase">Worker_Authentication_v2.0</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
                                <input
                                    type="text"
                                    placeholder="Business Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-[var(--text-1)]"
                                />
                            </div>

                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter Password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-[var(--text-1)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !name || !password}
                            className="w-full py-4 bg-[var(--accent)] text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20 uppercase tracking-widest"
                        >
                            {loading ? 'AUTHENTICATING...' : 'AUTHORIZE_WORKER'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[var(--text-3)] text-sm">
                        New business?{' '}
                        <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
                            Initialize Store
                        </Link>
                    </p>
                </div>
            </main>

            <footer className="p-8 text-center relative z-10">
                <p className="text-[var(--text-3)] text-[8px] font-mono opacity-50 uppercase tracking-[0.3em]">
                    Notable_Auth_Kernal_Active
                </p>
            </footer>
        </div>
    );
}
