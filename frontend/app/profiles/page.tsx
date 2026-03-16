'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { profilesApi, ShopProfile } from '../../lib/api';
import { getShopName, setWorkerProfile, getShopContext } from '../../lib/auth';
import { User, Plus, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ProfilesPage() {
    const router = useRouter();
    const [profiles, setProfiles] = useState<ShopProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [shopName, setLocalShopName] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [addingProfile, setAddingProfile] = useState(false);

    useEffect(() => {
        // Quick check to ensure valid shop session exists
        const context = getShopContext();
        if (!context.id) {
            router.replace('/login');
            return;
        }

        setLocalShopName(getShopName());
        loadProfiles();
    }, [router]);

    const loadProfiles = async () => {
        try {
            const data = await profilesApi.getAll();
            setProfiles(data);
        } catch (error) {
            console.error('Failed to load profiles', error);
            // If we consistently fail (e.g. token expired), they'll be booted by the API interceptor eventually
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProfile = (profile: ShopProfile) => {
        setWorkerProfile(profile.name);
        // Add a satisfying little delay effect for the "Netflix" feel
        setTimeout(() => {
            router.push('/dashboard');
        }, 300);
    };

    const handleAddProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProfileName.trim()) return;

        setAddingProfile(true);
        try {
            const newProfile = await profilesApi.create(newProfileName.trim());
            setProfiles([...profiles, newProfile]);
            setNewProfileName('');
            setShowAddForm(false);
        } catch (error) {
            console.error('Failed to create profile', error);
            alert('Failed to create profile. Name might already exist.');
        } finally {
            setAddingProfile(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
                <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center text-white selection:bg-[var(--accent)] selection:text-black font-sans page-enter">
            <div className="absolute top-8 left-8">
                <div className="flex flex-col items-start gap-1">
                    <span className="font-display font-black tracking-tighter text-3xl leading-none italic">
                        {shopName?.toUpperCase()}
                    </span>
                    <div className="h-1 w-8 bg-[var(--accent)] rounded-full"></div>
                </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-medium mb-12 tracking-wide font-display">Who&apos;s working?</h1>

            <div className="flex flex-wrap justify-center gap-6 max-w-4xl px-4">
                {profiles.map((profile, i) => (
                    <div
                        key={profile.id}
                        className="flex flex-col items-center gap-3 cursor-pointer group"
                        onClick={() => handleSelectProfile(profile)}
                        style={{ animationDelay: `${i * 100}ms` }}
                    >
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-md bg-zinc-800 border-2 border-transparent group-hover:border-white transition-all duration-300 overflow-hidden relative flex items-center justify-center">
                            {/* Netflix styled gradient avatar based on ID */}
                            <div className={cn("absolute inset-0 opacity-80",
                                i % 4 === 0 ? "bg-gradient-to-br from-red-500 to-pink-600" :
                                    i % 4 === 1 ? "bg-gradient-to-br from-blue-500 to-cyan-600" :
                                        i % 4 === 2 ? "bg-gradient-to-br from-green-500 to-emerald-600" :
                                            "bg-gradient-to-br from-amber-500 to-orange-600"
                            )} />
                            <span className="relative z-10 text-6xl font-black text-white mix-blend-overlay">
                                {profile.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <span className="text-zinc-400 group-hover:text-white transition-colors text-lg md:text-xl font-medium tracking-wide">
                            {profile.name}
                        </span>
                    </div>
                ))}

                {/* Add Profile Button */}
                {!showAddForm ? (
                    <div
                        className="flex flex-col items-center gap-3 cursor-pointer group"
                        onClick={() => setShowAddForm(true)}
                    >
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-md bg-transparent border-2 border-zinc-700 group-hover:border-white group-hover:bg-zinc-800 transition-all duration-300 flex items-center justify-center">
                            <Plus className="text-zinc-500 group-hover:text-white transition-colors" size={48} />
                        </div>
                        <span className="text-zinc-400 group-hover:text-white transition-colors text-lg md:text-xl font-medium tracking-wide">
                            Add Profile
                        </span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 w-32 md:w-40 animate-in fade-in zoom-in duration-300">
                        <form onSubmit={handleAddProfile} className="w-full flex flex-col gap-2">
                            <input
                                type="text"
                                autoFocus
                                placeholder="Name"
                                className="w-full bg-zinc-800 border border-zinc-600 text-white p-3 rounded text-center focus:outline-none focus:border-white transition-colors"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                disabled={addingProfile}
                                maxLength={15}
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={addingProfile || !newProfileName.trim()}
                                    className="flex-1 bg-white text-black font-bold py-2 rounded hover:bg-zinc-200 disabled:opacity-50"
                                >
                                    {addingProfile ? '...' : 'Add'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 bg-transparent border border-zinc-600 text-white font-bold py-2 rounded hover:border-white"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <div className="mt-16 sm:mt-24 w-full flex justify-center">
                <button
                    onClick={() => router.push('/admin')}
                    className="text-zinc-500 border border-zinc-700 font-medium py-3 px-8 text-xl tracking-widest uppercase hover:text-white hover:border-white transition-all hover:bg-zinc-900 rounded-none bg-transparent"
                >
                    Manage Profiles
                </button>
            </div>
        </div>
    );
}
