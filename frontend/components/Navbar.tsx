'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronUp,
  Key,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { clearAuth, getRole, getShopContext, getWorkerProfile, setOwnerSession, setRole } from '../lib/auth';
import { authApi } from '../lib/api';

const ownerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/customers', label: 'Owe Book', icon: Users },
  { href: '/profiles', label: 'Profiles', icon: UserCircle },
  { href: '/assistant', label: 'Assistant', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const workerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/profiles', label: 'Profiles', icon: UserCircle },
];

const mobilePrimary = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/sales', label: 'Sales', icon: ShoppingCart },
  { href: '/customers', label: 'Owe Book', icon: Users },
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
  const [moreOpen, setMoreOpen] = useState(false);

  const isPublic = pathname === '/' || pathname === '/login' || pathname === '/register';
  const navItems = roleState === 'owner' ? ownerNav : workerNav;

  useEffect(() => {
    setMoreOpen(false);
    const role = getRole();
    setRoleState(role);
    setShopName(getShopContext().name);
    setIsPinSet(window.localStorage.getItem('notable_is_pin_set') === 'true');
  }, [pathname]);

  if (isPublic) return null;

  const handleLogout = () => {
    clearAuth();
    window.localStorage.removeItem('notable_is_pin_set');
    router.push('/login');
    router.refresh();
  };

  const handleElevationClick = () => {
    setError('');
    setPin('');
    setConfirmPin('');
    setElevationMode(isPinSet ? 'verify' : 'setup');
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
          return;
        }
        if (pin.length !== 4) {
          setError('PIN must be 4 digits');
          return;
        }
        await authApi.setOwnerPin(pin);
        window.localStorage.setItem('notable_is_pin_set', 'true');
        setIsPinSet(true);
      } else {
        await authApi.verifyOwnerPin(pin);
      }
      setRole('owner');
      setRoleState('owner');
      setIsElevationModalOpen(false);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = roleState === 'owner' ? 'Owner' : (getWorkerProfile() || 'Worker');
  const secondaryMobile = navItems.filter(item => !mobilePrimary.some(primary => primary.href === item.href));

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/[0.07] bg-[#0A0A0F]/90 p-5 backdrop-blur-xl md:flex md:flex-col">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#6C63FF] shadow-[0_0_30px_rgba(108,99,255,0.35)]">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold leading-none text-white">Notable</p>
            <p className="mt-1 truncate text-xs text-white/45">{shopName || 'Provision store'}</p>
          </div>
        </Link>

        <div className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3">
          <p className="truncate text-sm font-medium text-white">{shopName || 'Shop workspace'}</p>
          <span className={cn('badge mt-2', roleState === 'owner' ? 'badge-accent' : 'badge-info')}>
            {roleLabel}
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition-all',
                  isActive ? 'bg-[#6C63FF] text-white shadow-[0_12px_28px_rgba(108,99,255,0.22)]' : 'text-white/50 hover:bg-white/[0.05] hover:text-white'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/[0.07] pt-4">
          {roleState === 'owner' ? (
            <button
              onClick={() => {
                setOwnerSession(false);
                setRoleState('worker');
                router.push('/dashboard');
              }}
              className="btn btn-ghost w-full justify-start"
            >
              <UserCircle size={18} />
              Worker View
            </button>
          ) : (
            <button onClick={handleElevationClick} className="btn btn-primary w-full justify-start">
              <ShieldCheck size={18} />
              Owner Mode
            </button>
          )}
          <button onClick={handleLogout} className="btn btn-ghost w-full justify-start text-red-300 hover:text-red-200">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.08] bg-[#0A0A0F]/95 px-2 pb-2 pt-2 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobilePrimary.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const disabledForWorker = roleState !== 'owner' && (item.href === '/stock' || item.href === '/customers');
            return (
              <Link
                key={item.href}
                href={disabledForWorker ? '/dashboard' : item.href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition',
                  isActive ? 'bg-[#6C63FF] text-white' : 'text-white/45'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(!moreOpen)}
            className={cn('flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition', moreOpen ? 'bg-white/10 text-white' : 'text-white/45')}
          >
            {moreOpen ? <ChevronUp size={18} /> : <MoreHorizontal size={18} />}
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="fixed inset-x-3 bottom-20 z-50 rounded-2xl border border-white/[0.08] bg-[#111118] p-3 shadow-2xl md:hidden">
          <div className="mb-3 flex items-center justify-between border-b border-white/[0.07] pb-3">
            <div>
              <p className="text-sm font-medium">{shopName || 'Notable'}</p>
              <span className={cn('badge mt-1', roleState === 'owner' ? 'badge-accent' : 'badge-info')}>{roleLabel}</span>
            </div>
            <button onClick={() => setMoreOpen(false)} className="rounded-full bg-white/5 p-2 text-white/50">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {secondaryMobile.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="btn btn-ghost justify-start">
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            {roleState === 'worker' && (
              <button onClick={handleElevationClick} className="btn btn-primary justify-start">
                <ShieldCheck size={16} />
                Owner
              </button>
            )}
            <button onClick={handleLogout} className="btn btn-danger justify-start">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}

      {isElevationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111118] p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6C63FF]/15 text-[#b9b5ff]">
                  <Key size={22} />
                </div>
                <h2 className="font-display text-2xl font-bold">{elevationMode === 'setup' ? 'Set Owner PIN' : 'Owner PIN'}</h2>
                <p className="mt-1 text-sm text-white/45">
                  {elevationMode === 'setup' ? 'Create a 4-digit PIN for sensitive actions.' : 'Enter your 4-digit PIN to continue.'}
                </p>
              </div>
              <button onClick={() => setIsElevationModalOpen(false)} className="rounded-full bg-white/5 p-2 text-white/50 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleElevationSubmit} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                placeholder="0000"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="input w-full text-center font-mono text-3xl tracking-[0.8em]"
                autoFocus
              />
              {elevationMode === 'setup' && (
                <input
                  type="password"
                  maxLength={4}
                  placeholder="0000"
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="input w-full text-center font-mono text-3xl tracking-[0.8em]"
                />
              )}
              {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
              <button
                type="submit"
                disabled={loading || pin.length !== 4 || (elevationMode === 'setup' && confirmPin.length !== 4)}
                className="btn btn-primary w-full"
              >
                {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckCircle2 size={18} />}
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
