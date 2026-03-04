'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getShopContext, setShopContext, isOwner } from '../../lib/auth';
import { authApi } from '../../lib/api';
import { Store, Key, Save, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Link from 'next/link';

export default function SettingsPage() {
    const router = useRouter();
    const [shopName, setShopName] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isOwner()) {
            router.push('/login');
            return;
        }
        const context = getShopContext();
        if (context.name) setShopName(context.name);
    }, [router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPin && newPin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        if (newPin && newPin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        setLoading(true);
        try {
            const updateData: any = {};
            if (shopName) updateData.name = shopName;
            if (newPin) updateData.pin = newPin;

            const updatedShop = await authApi.updateSettings(updateData);
            setShopContext(updatedShop.id, updatedShop.name);
            setSuccess('Settings updated successfully!');
            setNewPin('');
            setConfirmPin('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-1)] py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 rounded-full hover:bg-[var(--bg-3)] transition-colors">
                        <ArrowLeft className="w-6 h-6 text-[var(--text-3)]" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Shop Settings</h1>
                        <p className="text-[var(--text-3)] text-sm font-mono uppercase tracking-widest">Store_Configuration_Kernel</p>
                    </div>
                </div>

                <div className="glass p-8 rounded-3xl border border-[var(--border)] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldCheck size={120} />
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-8 relative z-10">
                        {/* Store Name Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[var(--accent)] flex items-center gap-2">
                                <Store size={18} />
                                Identity Configuration
                            </h2>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Store Name"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-6 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-[var(--text-1)]"
                                />
                            </div>
                        </div>

                        {/* Security Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-[var(--danger)] flex items-center gap-2">
                                <Key size={18} />
                                Security Overrides
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="New Security PIN"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value)}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-6 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-[var(--text-1)] placeholder:text-[var(--text-3)]"
                                    />
                                </div>
                                <div className="relative">
                                    <input
                                        type="password"
                                        placeholder="Confirm New PIN"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value)}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-6 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-[var(--text-1)] placeholder:text-[var(--text-3)]"
                                    />
                                </div>
                            </div>
                            <p className="text-[var(--text-3)] text-[10px] uppercase font-mono tracking-tighter">
                                Keep PIN empty if you don't want to change it.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm flex items-center gap-3">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] p-4 rounded-2xl text-sm flex items-center gap-3">
                                <ShieldCheck size={18} />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-[var(--accent)] text-black font-bold py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20 uppercase tracking-widest text-sm"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    Commit_Changes <Save className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
