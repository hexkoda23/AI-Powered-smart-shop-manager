'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../../lib/api';
import { setShopContext, setRole, setOwnerSession } from '../../lib/auth';
import { Store, Eye, EyeOff, ArrowRight, ShieldCheck, ShoppingBag, Lock } from 'lucide-react';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

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
            setRole('worker'); // Starts as worker
            setOwnerSession(false);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Try a different store name.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#07080a] relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)] opacity-5 blur-[120px] rounded-full" />

            <div className="w-full max-w-md relative group">
                <div className="relative glass p-8 md:p-10 rounded-3xl border border-[var(--border)] shadow-2xl bg-[var(--bg-2)]/50 backdrop-blur-xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[var(--accent)]/20">
                            <ShoppingBag className="w-8 h-8 text-black" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Deploy Store</h1>
                        <p className="text-[var(--text-3)] text-center text-sm">Initialize your business ecosystem</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
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
                                    placeholder="Set Password (Alpha-numeric)"
                                    required
                                    maxLength={10}
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

                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm Password"
                                    required
                                    maxLength={10}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-[var(--text-1)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <p className="text-[var(--text-3)] text-[10px] uppercase font-mono tracking-widest px-2">
                                Max 10 chars. Worker access granted upon initialization.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-black font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/30"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    LAUNCH_STORE <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[var(--text-3)] text-sm">
                        Existing business?{' '}
                        <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
