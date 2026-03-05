'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getShopContext, setShopContext, isOwner, getRole, Role } from '../../lib/auth';
import { authApi } from '../../lib/api';
import { Store, Key, Save, ArrowLeft, ShieldCheck, AlertCircle, Lock, Eye, EyeOff, ShieldAlert, UserCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import Link from 'next/link';

export default function SettingsPage() {
    const router = useRouter();
    const [shopName, setShopName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPin, setShowPin] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [role, setRole] = useState<Role>(null);

    useEffect(() => {
        if (!isOwner()) {
            router.push('/login');
            return;
        }
        const context = getShopContext();
        if (context.name) setShopName(context.name);
        setRole(getRole());
    }, [router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword && newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword && newPassword.length > 10) {
            setError('Password must not exceed 10 characters');
            return;
        }

        if (newPin && newPin !== confirmPin) {
            setError('Owner PINs do not match');
            return;
        }

        if (newPin && newPin.length !== 4) {
            setError('Owner PIN must be exactly 4 digits');
            return;
        }

        setLoading(true);
        try {
            const updateData: any = {};
            if (shopName) updateData.name = shopName;
            if (newPassword) updateData.password = newPassword;
            if (newPin) updateData.owner_pin = newPin;

            const updatedShop = await authApi.updateSettings(updateData);
            setShopContext(updatedShop.id, updatedShop.name);
            setSuccess('Kernel settings synchronized successfully!');
            setNewPassword('');
            setConfirmPassword('');
            setNewPin('');
            setConfirmPin('');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to sync settings with core');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#07080a] py-12 px-4 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent)] blur-[150px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--info)] blur-[150px] rounded-full" />
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-3 rounded-2xl bg-[var(--bg-2)] border border-[var(--border)] hover:bg-[var(--bg-3)] transition-all">
                        <ArrowLeft className="w-5 h-5 text-[var(--text-3)]" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Security & Core</h1>
                        <p className="text-[var(--text-3)] text-[10px] font-mono uppercase tracking-[0.3em]">System_Optimization_Active</p>
                    </div>
                </div>

                {role && (
                    <div className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-2xl border animate-in zoom-in duration-500",
                        role === 'owner'
                            ? "bg-[var(--accent)]/10 border-[var(--accent)]/20 text-[var(--accent)] shadow-[0_0_20px_rgba(0,229,160,0.1)]"
                            : "bg-[var(--info)]/10 border-[var(--info)]/20 text-[var(--info)] shadow-[0_0_20px_rgba(0,149,255,0.1)]"
                    )}>
                        <UserCheck size={16} />
                        <span className="font-display font-bold tracking-widest text-xs uppercase">
                            Owner Page
                        </span>
                    </div>
                )}

                <div className="glass p-8 md:p-10 rounded-[2.5rem] border border-[var(--border)] shadow-2xl bg-[var(--bg-2)]/40 backdrop-blur-2xl group">
                    <form onSubmit={handleUpdate} className="space-y-10">
                        {/* Store Section */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-[var(--accent)] flex items-center gap-2">
                                <Store size={16} /> Identity_Config
                            </h2>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-[var(--text-3)] ml-2 uppercase tracking-wider">Business Name</label>
                                <input
                                    type="text"
                                    value={shopName}
                                    onChange={(e) => setShopName(e.target.value)}
                                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all text-white font-medium"
                                />
                            </div>
                        </div>

                        {/* Password Section */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-[var(--info)] flex items-center gap-2">
                                <Lock size={16} /> Worker_Access_Reset
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-[var(--text-3)] ml-2 uppercase tracking-wider">New Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            maxLength={10}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-6 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--info)]/50 focus:border-[var(--info)] transition-all text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-[var(--text-3)] ml-2 uppercase tracking-wider">Confirm Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        maxLength={10}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--info)]/50 focus:border-[var(--info)] transition-all text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* PIN Section */}
                        <div className="space-y-6">
                            <h2 className="text-sm font-mono font-bold uppercase tracking-widest text-[var(--danger)] flex items-center gap-2">
                                <ShieldAlert size={16} /> Owner_Core_Elevation
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-[var(--text-3)] ml-2 uppercase tracking-wider">New 4-Digit PIN</label>
                                    <div className="relative">
                                        <input
                                            type={showPin ? "text" : "password"}
                                            value={newPin}
                                            maxLength={4}
                                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 pl-6 pr-12 focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/50 focus:border-[var(--danger)] transition-all text-white font-mono tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPin(!showPin)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-white"
                                        >
                                            {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-mono text-[var(--text-3)] ml-2 uppercase tracking-wider">Confirm PIN</label>
                                    <input
                                        type={showPin ? "text" : "password"}
                                        value={confirmPin}
                                        maxLength={4}
                                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-[var(--danger)]/50 focus:border-[var(--danger)] transition-all text-white font-mono tracking-widest"
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-mono uppercase flex items-center gap-3">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] p-4 rounded-2xl text-xs font-mono uppercase flex items-center gap-3">
                                <ShieldCheck size={16} /> {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || (!shopName && !newPassword && !newPin)}
                            className="w-full flex items-center justify-center gap-3 bg-[var(--accent)] text-black font-bold py-5 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-[var(--accent)]/20 uppercase tracking-[0.2em] text-xs"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    SYNCHRONIZE_KERNEL <Save className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
