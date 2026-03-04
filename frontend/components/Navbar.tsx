'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingBag, BarChart3, Package, MessageSquare, Shield, User, ChevronDown, Store, Lock as LockIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { getRole, setOwnerSession, getShopContext, setRole, clearAuth } from '../lib/auth';

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

  const navItems = roleState === 'owner' ? ownerNav : workerNav;
  const isLanding = pathname === '/';

  useEffect(() => {
    const role = getRole();
    setRoleState(role);
    const context = getShopContext();
    setShopName(context.name);

    // Auto-clear owner session if leaving owner pages
    const ownerPages = ['/stock', '/customers', '/assistant', '/settings', '/admin'];
    if (role === 'owner' && !ownerPages.some(p => pathname.startsWith(p)) && pathname !== '/login' && pathname !== '/dashboard') {
      setOwnerSession(false);
      setRoleState('worker');
    }
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
    router.refresh();
  };

  return (
    <nav
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: 'var(--accent)',
                    borderRadius: '50%',
                    boxShadow: 'var(--glow-accent)'
                  }}
                />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  NOTABLE
                </span>
              </Link>

              {shopName && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-2)]">
                  <Store size={14} color="var(--accent)" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700 }}>
                    {shopName.toUpperCase()}
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
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        padding: '0.4rem 0.75rem',
                        borderRadius: 'var(--radius)',
                        backgroundColor: isActive ? 'var(--bg-3)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s'
                      }}
                      className="hover:text-[var(--white)]"
                    >
                      <Icon size={14} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <span className={cn("badge", roleState === 'owner' ? "badge-accent" : roleState === 'worker' ? "badge-info" : "hidden")}>
                {roleState}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {roleState === 'owner' ? (
                <button
                  onClick={() => {
                    setOwnerSession(false);
                    setRoleState('worker');
                    router.push('/dashboard');
                  }}
                  className="btn btn-outline"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">Switch to Worker</span>
                </button>
              ) : roleState === 'worker' ? (
                <Link href="/login" className="btn btn-primary">
                  <LockIcon size={18} />
                  <span className="hidden sm:inline">Owner Login</span>
                </Link>
              ) : (
                <Link href="/register" className="btn btn-primary">
                  <ShoppingBag size={18} />
                  <span className="hidden sm:inline">Get Started</span>
                </Link>
              )}

              {roleState && (
                <button
                  onClick={handleLogout}
                  className="p-2 text-[var(--text-3)] hover:text-[var(--danger)] transition-colors"
                  title="Logout"
                >
                  <LockIcon size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
