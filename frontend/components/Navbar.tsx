'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag, BarChart3, Package, MessageSquare, Shield, User, Store, Lock as LockIcon, X, CheckCircle2, ShieldCheck, Key, Menu, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { getRole, setOwnerSession, getShopContext, setRole, clearAuth, getWorkerProfile } from '../lib/auth';
import { authApi } from '../lib/api';

const workerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/sales', label: 'Record Sale', icon: ShoppingBag },
];

const ownerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/sales', label: 'Record Sale', icon: ShoppingBag },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/customers', label: 'Customers', icon: User },
  { href: '/assistant', label: 'AI Assistant', icon: MessageSquare },
  { href: '/settings', label: 'Settings', icon: Shield },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [roleState, setRoleState] = useState<'owner' | 'worker' | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);
  const [isElevationModalOpen, setIsElevationModalOpen] = useState(false);
  const [elevationMode, setElevationMode] = useState<'verify' | 'setup'>('verify');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPinSet, setIsPinSet] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = roleState === 'owner' ? ownerNav : workerNav;
  const isLanding = pathname === '/';

  useEffect(() => {
    const role = getRole();
    setRoleState(role);
    const context = getShopContext();
    setShopName(context.name);

    // We should ideally fetch the latest shop info to know if PIN is set
    // For now, we'll assume based on the login response which we should have stored
    // or we fetch it here.
    const storedPinSet = window.localStorage.getItem('notable_is_pin_set') === 'true';
    setIsPinSet(storedPinSet);

    const ownerPages = ['/stock', '/customers', '/assistant', '/settings'];
    if (role === 'owner' && !ownerPages.some(p => pathname.startsWith(p)) && pathname !== '/dashboard') {
      // Don't auto-clear if on dashboard or common pages
    }
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    window.localStorage.removeItem('notable_is_pin_set');
    router.push('/');
    router.refresh();
  };

  const handleElevationClick = () => {
    setError('');
    setPin('');
    setConfirmPin('');
    if (isPinSet) {
      setElevationMode('verify');
    } else {
      setElevationMode('setup');
    }
    setIsElevationModalOpen(true);
  };

  const handleElevationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (elevationMode === 'setup') {
        if (pin !== confirmPin) {
          setError('PINs do not match');
          setLoading(false);
          return;
        }
        if (pin.length !== 4) {
          setError('PIN must be 4 digits');
          setLoading(false);
          return;
        }
        await authApi.setOwnerPin(pin);
        window.localStorage.setItem('notable_is_pin_set', 'true');
        setIsPinSet(true);
        setRole('owner');
        setRoleState('owner');
        setIsElevationModalOpen(false);
        router.push('/dashboard');
      } else {
        await authApi.verifyOwnerPin(pin);
        setRole('owner');
        setRoleState('owner');
        setIsElevationModalOpen(false);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-3 h-3 bg-[var(--accent)] rounded-full shadow-[0_0_15px_rgba(0,229,160,0.4)] group-hover:scale-125 transition-transform" />
                  <span className="font-display text-xl font-bold tracking-tight">NOTABLE</span>
                </Link>

                {shopName && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-2)]">
                    <Store size={14} className="text-[var(--accent)]" />
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                      {shopName}
                    </span>
                  </div>
                )}
              </div>

              {roleState && !isLanding && (
                <div className="hidden lg:flex items-center gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                          isActive ? "bg-[var(--bg-3)] text-[var(--accent)]" : "text-[var(--text-3)] hover:text-white hover:bg-[var(--bg-2)]"
                        )}
                      >
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {roleState && !isLanding && (
                <div className="hidden sm:flex items-center gap-2 mr-2">
                  <span className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest border",
                    roleState === 'owner' ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20" : "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20"
                  )}>
                    {roleState === 'owner' ? 'OWNER_MODE' : (getWorkerProfile()?.toUpperCase() || 'WORKER') + '_MODE'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {isLanding ? (
                  <div className="flex items-center gap-3">
                    <Link href="/login" className="px-5 py-2 hover:text-[var(--accent)] transition-colors text-sm font-bold">
                      LOGIN
                    </Link>
                    <Link href={shopName ? "/login" : "/register"} className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-black rounded-xl text-sm font-bold hover:scale-[1.02] transition-all">
                      GET_STARTED
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="hidden lg:flex items-center gap-3">
                      {roleState === 'owner' ? (
                        <button
                          onClick={() => {
                            setOwnerSession(false);
                            setRoleState('worker');
                            router.push('/dashboard');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-xl text-sm font-bold hover:bg-[var(--bg-3)] transition-all"
                        >
                          <User size={16} />
                          <span>{getWorkerProfile() || 'WORKER_VIEW'}</span>
                        </button>
                      ) : roleState === 'worker' ? (
                        <button
                          onClick={handleElevationClick}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-black rounded-xl text-sm font-bold hover:scale-[1.02] transition-all"
                        >
                          <ShieldCheck size={16} />
                          <span>OWNER_PAGE</span>
                        </button>
                      ) : null}

                      {roleState === 'worker' && (
                        <button
                          onClick={() => router.push('/profiles')}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-xl text-sm font-bold hover:bg-[var(--bg-3)] transition-all"
                        >
                          <Users size={16} />
                          <span>SWITCH_PROFILE</span>
                        </button>
                      )}

                      {roleState && (
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-2)] border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--text-3)] hover:text-[var(--danger)] hover:border-[var(--danger)]/20 transition-all"
                        >
                          <LockIcon size={16} />
                          <span>LOGOUT</span>
                        </button>
                      )}
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    {roleState && (
                      <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="lg:hidden p-2.5 rounded-xl bg-[var(--bg-2)] border border-[var(--border)] text-[var(--text-3)] hover:text-white transition-colors"
                      >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Nav Menu */}
      {isMobileMenuOpen && roleState && !isLanding && (
        <div className="lg:hidden fixed inset-x-0 top-20 bottom-0 z-40 bg-[var(--bg)]/95 backdrop-blur-3xl border-t border-[var(--border)] p-4 flex flex-col gap-2 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1 mb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-all",
                    isActive ? "bg-[var(--bg-3)] text-[var(--accent)]" : "text-[var(--text-3)] hover:text-white hover:bg-[var(--bg-2)]"
                  )}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-[var(--border)] flex flex-col gap-3">
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-3)]">Current Mode</span>
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-widest border",
                roleState === 'owner' ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20" : "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20"
              )}>
                {roleState === 'owner' ? 'OWNER_MODE' : (getWorkerProfile()?.toUpperCase() || 'WORKER') + '_MODE'}
              </span>
            </div>

            {roleState === 'owner' ? (
              <button
                onClick={() => {
                  setOwnerSession(false);
                  setRoleState('worker');
                  router.push('/dashboard');
                }}
                className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-2)] border border-[var(--border)] rounded-xl text-sm font-bold hover:bg-[var(--bg-3)] transition-all w-full justify-start text-white"
              >
                <User size={18} />
                SWITCH TO {getWorkerProfile() || 'WORKER'} VIEW
              </button>
            ) : roleState === 'worker' ? (
              <button
                onClick={handleElevationClick}
                className="flex items-center gap-3 px-4 py-3 bg-[var(--accent)] text-black rounded-xl text-sm font-bold hover:scale-[1.02] transition-all w-full justify-start"
              >
                <ShieldCheck size={18} />
                SWITCH TO OWNER PAGE
              </button>
            ) : null}

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500/20 text-red-500 transition-all w-full justify-start mt-2"
            >
              <LockIcon size={18} />
              LOGOUT
            </button>
          </div>
        </div>
      )}

      {/* Elevation Modal */}
      {isElevationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm glass border border-[var(--border)] rounded-3xl p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsElevationModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-[var(--text-3)] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 bg-[var(--accent)] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[var(--accent)]/20">
                <Key className="w-7 h-7 text-black" />
              </div>
              <h2 className="text-2xl font-bold">{elevationMode === 'setup' ? 'Set Owner PIN' : 'Owner Auth'}</h2>
              <p className="text-[var(--text-3)] text-sm text-center mt-1">
                {elevationMode === 'setup'
                  ? 'First time elevating? Create a 4-digit PIN.'
                  : 'Enter your 4-digit security PIN to proceed.'}
              </p>
            </div>

            <form onSubmit={handleElevationSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-3)] ml-2">Secure PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="0000"
                    required
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 text-center text-3xl tracking-[1em] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all"
                    autoFocus
                  />
                </div>

                {elevationMode === 'setup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-3)] ml-2">Confirm PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="0000"
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-[var(--bg-2)] border border-[var(--border)] rounded-2xl py-4 text-center text-3xl tracking-[1em] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-xs font-mono text-center bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                  {error.toString().toUpperCase()}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (elevationMode === 'setup' ? pin.length !== 4 || confirmPin.length !== 4 : pin.length !== 4)}
                className="w-full py-4 bg-[var(--accent)] text-black font-bold rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/30 uppercase tracking-widest"
              >
                {loading ? 'PROCESSING...' : (elevationMode === 'setup' ? 'INITIALIZE_OWNER' : 'AUTHORIZE_ELEVATION')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
