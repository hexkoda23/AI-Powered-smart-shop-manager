'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setOwnerSession, getRole, setShopContext } from '../../lib/auth';
import { authApi } from '../../lib/api';
import { Lock, Store, ArrowLeft, Zap, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [name, setName] = useState<string>('');
    const [pin, setPin] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (getRole() === 'owner') {
            router.push('/dashboard');
        }
    }, [router]);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!name || pin.length < 4) {
            setError('Please enter store name and PIN');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const shop = await authApi.login(name, pin);
            setShopContext(shop.id, shop.name);
            setOwnerSession(true);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'INVALID_CREDENTIALS');
            setLoading(false);
        }
    };

    const addDigit = (digit: string) => {
        if (pin.length < 8) {
            setPin(prev => prev + digit);
            setError('');
        }
    };

    const deleteDigit = () => {
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="min-h-screen bg-[#07080a] text-white flex flex-col font-sans selection:bg-[var(--accent)] selection:text-black overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[var(--accent)] opacity-[0.03] blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--info)] opacity-[0.02] blur-[100px] rounded-full" />
            </div>

            <header className="p-8 flex justify-between items-center relative z-10">
                <Link href="/" className="flex items-center gap-2 group">
                    <ArrowLeft size={20} className="text-[var(--text-3)] group-hover:text-[var(--accent)] transition-colors" />
                    <span className="text-xs font-mono text-[var(--text-3)] group-hover:text-white transition-colors uppercase tracking-widest">RETURN_TO_WEB</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Zap size={14} color="var(--accent)" />
                    <span className="text-[10px] font-mono text-[var(--text-3)]">SECURE_AUTH_v3.0</span>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="relative inline-block mb-4 group">
                            <div className="absolute inset-0 bg-[var(--accent)] blur-[25px] opacity-10 group-hover:opacity-20 transition-opacity" />
                            <div className="w-16 h-16 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] flex items-center justify-center relative overflow-hidden">
                                <ShoppingBag size={28} color="var(--accent)" className={cn("transition-all duration-500", loading ? "scale-75 opacity-50" : "scale-100")} />
                                {loading && (
                                    <div className="absolute inset-0 border-2 border-[var(--accent)] border-t-transparent rounded-2xl animate-spin" />
                                )}
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold mb-1 tracking-tight">Owner Login</h1>
                        <p className="text-[var(--text-3)] text-[10px] font-mono tracking-widest uppercase">Encryption_Required</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4 mb-6">
                        <div className="relative">
                            <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                            <input
                                type="text"
                                placeholder="Store Name"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all text-sm"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
                            <input
                                type="password"
                                placeholder="Security PIN"
                                required
                                readOnly
                                value={pin}
                                className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all text-sm tracking-widest"
                            />
                        </div>
                    </form>

                    <div className="grid grid-cols-3 gap-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                            <button
                                key={num}
                                onClick={() => addDigit(num)}
                                className="h-12 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] hover:bg-[var(--bg-3)] hover:border-[var(--accent)] transition-all text-lg font-bold flex items-center justify-center active:scale-95"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            onClick={() => setPin('')}
                            className="h-12 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] hover:bg-[rgba(255,59,92,0.1)] text-[var(--danger)] text-[10px] font-mono uppercase"
                        >
                            CLS
                        </button>
                        <button
                            onClick={() => addDigit('0')}
                            className="h-12 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] hover:bg-[var(--bg-3)] hover:border-[var(--accent)] transition-all text-lg font-bold flex items-center justify-center active:scale-95"
                        >
                            0
                        </button>
                        <button
                            onClick={deleteDigit}
                            className="h-12 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] hover:bg-[var(--bg-3)] flex items-center justify-center active:scale-95"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    </div>

                    <div className="h-6 mt-4 text-center">
                        {error && (
                            <p className="text-[var(--danger)] text-[10px] font-mono uppercase tracking-tighter">
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        disabled={pin.length < 4 || !name || loading}
                        onClick={() => handleLogin()}
                        className={cn(
                            "w-full py-3 mt-2 rounded-xl font-bold transition-all uppercase tracking-widest text-[10px]",
                            pin.length >= 4 && name
                                ? "bg-[var(--accent)] text-black shadow-[0_0_20px_rgba(0,229,160,0.2)]"
                                : "bg-[var(--bg-3)] text-[var(--text-3)] cursor-not-allowed"
                        )}
                    >
                        {loading ? 'VERIFYING...' : 'AUTHORIZE_SESSION'}
                    </button>

                    <p className="mt-6 text-center text-[var(--text-3)] text-xs">
                        New store?{' '}
                        <Link href="/register" className="text-[var(--accent)] font-semibold hover:underline">
                            Register now
                        </Link>
                    </p>
                </div>
            </main>

            <footer className="p-8 text-center relative z-10">
                <p className="text-[var(--text-3)] text-[8px] font-mono opacity-50 uppercase tracking-[0.3em]">
                    Notable_Auth_Silo_Active
                </p>
            </footer>
        </div>
    );
}
