'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, BarChart3, Package, MessageSquare, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';

const navItems = [
  { href: '/', label: 'Dashboard', icon: BarChart3 },
  { href: '/sales', label: 'Record Sale', icon: ShoppingBag },
  { href: '/stock', label: 'Stock', icon: Package },
  { href: '/assistant', label: 'AI Assistant', icon: MessageSquare },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="bg-white dark:bg-slate-950 shadow-lg sticky top-0 z-50 border-b border-transparent dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-primary-600">Notable AI Shop Assistant</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-600 dark:text-slate-300 hover:border-gray-300 dark:hover:border-slate-600 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden border-t border-gray-200 dark:border-slate-800">
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-base font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-slate-900 border-primary-500 text-primary-700 dark:text-primary-300 border-l-4'
                    : 'text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-900 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
