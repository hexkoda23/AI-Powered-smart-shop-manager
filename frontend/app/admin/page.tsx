'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import { setOwnerSession, getRole, isOwnerSessionValid } from '../../lib/auth';
import { authApi } from '../../lib/api';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminPage() {
  const router = useRouter();
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [authed, setAuthed] = useState<boolean>(false);

  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [pinSuccess, setPinSuccess] = useState<string>('');

  useEffect(() => {
    if (!isOwnerSessionValid()) {
      router.push('/login');
    } else {
      setAuthed(true);
    }
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await authApi.verifyOwnerPin(pin);
      setOwnerSession(true);
      setAuthed(true);
      setPin('');
      router.refresh();
      router.push('/dashboard');
    } catch {
      setError('ACCESS_DENIED: INVALID_CREDENTIALS');
    }
  };

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinSuccess('');
    setError('');

    try {
      await authApi.verifyOwnerPin(currentPin);
    } catch {
      setError('AUTH_FAILED: CURRENT_PIN_INCORRECT');
      return;
    }

    const digitsOnly = /^\d{4,8}$/.test(newPin);
    if (!digitsOnly) {
      setError('VALIDATION_ERR: PIN_MUST_BE_4-8_DIGITS');
      return;
    }

    if (newPin !== confirmPin) {
      setError('VALIDATION_ERR: PIN_MISMATCH');
      return;
    }

    try {
      await authApi.setOwnerPin(newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setPinSuccess('SECURITY_CREDENTIALS_UPDATED');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'FAILED_TO_UPDATE_PIN');
    }
  };

  return (
    <div className="min-h-screen page-enter flex flex-col" style={{ backgroundColor: 'var(--bg)' }}>
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        {!authed ? (
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div
                className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--bg-3)', border: '1px solid var(--border)', boxShadow: 'var(--glow-accent)' }}
              >
                <Lock size={28} color="var(--accent)" />
              </div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Secure Access</h1>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)' }}>IDENTIFICATION_REQUIRED_FOR_MANAGEMENT</p>
            </div>

            <div className="card p-8 border-t-4" style={{ borderTopColor: error ? 'var(--danger)' : 'var(--accent)' }}>
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>OWNER_PIN</label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="input w-full text-center text-2xl tracking-[0.5em] h-16"
                      placeholder="••••"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--white)]"
                    >
                      {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-[var(--danger)] justify-center">
                    <AlertCircle size={14} />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full py-4 text-lg"
                >
                  VERIFY_AND_UNLOCK
                </button>
              </form>
            </div>

            <p className="mt-8 text-center" style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
              PROTECTED_BY_NOTABLE_SECURE_KERNEL_v1.0
            </p>
          </div>
        ) : (
          <div className="w-full max-w-xl">
            <div className="flex items-center gap-4 mb-10">
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-3)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <ShieldCheck size={24} color="var(--accent)" />
              </div>
              <div>
                <h1 style={{ fontSize: '2.5rem', lineHeight: 1 }}>Owner Console</h1>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>STATE: AUTHENTICATED</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Security Protocol</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '2rem' }}>
                  Rotate your access PIN regularly to ensure the integrity of your store data.
                </p>

                <form onSubmit={handleUpdatePin} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>CURRENT_PIN</label>
                      <input
                        type="password"
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value)}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>NEW_ENCRYPTION_PIN</label>
                      <input
                        type="password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="input w-full"
                        placeholder="4-8 digits"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-3)' }}>CONFIRM_NEW_PIN</label>
                    <input
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="input w-full"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-4 rounded-[var(--radius)] bg-[rgba(255,59,92,0.1)] border border-[var(--danger)] flex items-center gap-3">
                      <AlertCircle size={18} color="var(--danger)" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>
                    </div>
                  )}

                  {pinSuccess && (
                    <div className="p-4 rounded-[var(--radius)] bg-[var(--accent-dim)] border border-[var(--accent)] flex items-center gap-3">
                      <CheckCircle2 size={18} color="var(--accent)" />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent)' }}>{pinSuccess}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setAuthed(false)}
                      className="btn btn-outline px-8"
                    >
                      LOGOUT
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-8"
                    >
                      UPDATE_SECURITY
                    </button>
                  </div>
                </form>
              </div>

              {/* Store Profiles Section */}
              <div className="card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Store Profiles</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '1.5rem' }}>
                  Manage multiple branches. Each branch has its own isolated inventory and sales data.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="new-store-name"
                      placeholder="Branch Name (e.g. Market Square)"
                      className="input flex-1"
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('new-store-name') as HTMLInputElement;
                        const name = input.value.trim();
                        if (name) {
                          const stores = JSON.parse(localStorage.getItem('notable_stores') || '["Default"]');
                          if (!stores.includes(name)) {
                            localStorage.setItem('notable_stores', JSON.stringify([...stores, name]));
                            input.value = '';
                            window.location.reload();
                          }
                        }
                      }}
                      className="btn btn-primary"
                    >
                      ADD_BRANCH
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('notable_stores') || '["Default"]') : ["Default"]).map((store: string) => {
                      const isActive = (typeof window !== 'undefined' ? localStorage.getItem('notable_active_store') || 'Default' : 'Default') === store;
                      return (
                        <div
                          key={store}
                          className="p-4 rounded-[var(--radius)] border flex items-center justify-between"
                          style={{ backgroundColor: isActive ? 'var(--accent-dim)' : 'var(--bg-3)', borderColor: isActive ? 'var(--accent)' : 'var(--border)' }}
                        >
                          <span style={{ fontWeight: isActive ? 700 : 400 }}>{store}</span>
                          <div className="flex items-center gap-2">
                            {!isActive && (
                              <button
                                onClick={() => {
                                  localStorage.setItem('notable_active_store', store);
                                  window.location.reload();
                                }}
                                className="badge badge-info cursor-pointer hover:brightness-110"
                              >
                                ACTIVATE
                              </button>
                            )}
                            {store !== 'Default' && (
                              <button
                                onClick={() => {
                                  const reserves = JSON.parse(localStorage.getItem('notable_stores') || '["Default"]');
                                  const filtered = reserves.filter((s: string) => s !== store);
                                  localStorage.setItem('notable_stores', JSON.stringify(filtered));
                                  if (localStorage.getItem('notable_active_store') === store) {
                                    localStorage.setItem('notable_active_store', 'Default');
                                  }
                                  window.location.reload();
                                }}
                                className="p-1 hover:text-[var(--danger)]"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="card border-dashed">
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-2)' }}>Store Metadata</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: 'KERNEL', val: 'NOTABLE_v1.0' },
                    { label: 'REGION', val: 'NG_WEST_1' },
                    { label: 'ENCRYPTION', val: 'AES_256' }
                  ].map((item, i) => (
                    <div key={i} className="p-3 bg-[var(--bg-3)] rounded-[var(--radius)] flex flex-col">
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-3)' }}>{item.label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
