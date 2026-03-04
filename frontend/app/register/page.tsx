'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '../../lib/api';
import { setShopContext, setRole, setOwnerSession } from '../../lib/auth';
import { Store, Key, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        if (pin.length < 4) {
            setError('SECURITY_ERROR: PIN must be exactly 4-8 digits');
            return;
        }

        setLoading(true);
        try {
            const shop = await authApi.register(name, pin);
            setShopContext(shop.id, shop.name);
            setRole('owner');
            setOwnerSession(true);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Try a different store name.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-1)] relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)] opacity-5 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent)] opacity-5 blur-[120px] rounded-full animate-pulse delay-700" />

            <div className="w-full max-w-md relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--accent)] to-[var(--bg-3)] rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />

                <div className="relative glass p-8 md:p-10 rounded-3xl border border-[var(--border)] shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-[var(--accent)] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[var(--accent)]/20">
                            <ShoppingBag className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gradient mb-2 tracking-tight">Register Store</h1>
                        <p className="text-[var(--text-3)] text-center text-sm">Create a secure account for your business</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
                                <input
                                    type="text"
                                    placeholder="Business / Store Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-[var(--text-1)] placeholder:text-[var(--text-3)]"
                                />
                            </div>

                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
                                <input
                                    type="password"
                                    placeholder="Set 4-Digit Security PIN"
                                    required
                                    maxLength={8}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-xl tracking-[0.5em] font-mono"
                                />
                            </div>
                            <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/10 p-3 rounded-xl -mt-2">
                                <p className="text-[var(--accent)] text-[10px] font-mono leading-tight">
                                    <span className="font-bold uppercase tracking-wider">Note:</span> ENTER A 4-DIGIT PIN.
                                    THIS WILL BE REQUIRED AT EVERY LOG IN.
                                </p>
                            </div>

                            <div className="relative">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-3)]" />
                                <input
                                    type="password"
                                    placeholder="Confirm 4-digit PIN"
                                    required
                                    maxLength={8}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-[var(--text-1)] placeholder:text-[var(--text-3)] tracking-widest"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center gap-3 animate-shake">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white font-semibold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-[var(--accent)]/30"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Launch My Store <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[var(--text-3)] text-sm">
                        Already have a store?{' '}
                        <Link href="/login" className="text-[var(--accent)] font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>

            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
        </div>
    );
}
