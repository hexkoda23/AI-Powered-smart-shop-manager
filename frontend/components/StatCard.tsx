import { ArrowDownRight, ArrowUpRight, LucideIcon } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isCurrency?: boolean;
  tone?: 'success' | 'accent' | 'info' | 'warn' | 'danger';
}

const tones = {
  success: 'from-emerald-500/18 text-emerald-300',
  accent: 'from-[#6C63FF]/20 text-[#b9b5ff]',
  info: 'from-blue-500/18 text-blue-300',
  warn: 'from-amber-500/18 text-amber-300',
  danger: 'from-red-500/18 text-red-300',
};

export default function StatCard({ title, value, icon: Icon, trend, isCurrency = false, tone = 'accent' }: StatCardProps) {
  const displayValue = isCurrency ? formatCurrency(Number(value)) : value;
  const TrendIcon = trend?.isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={`card group relative min-h-[150px] overflow-hidden bg-gradient-to-br ${tones[tone]} to-transparent`}>
      <div className="absolute right-4 top-4 opacity-20 transition group-hover:scale-110 group-hover:opacity-35">
        <Icon size={48} />
      </div>
      <div className="relative flex h-full flex-col justify-between gap-6">
        <div>
          <p className="text-sm text-white/50">{title}</p>
          <p className="mono mt-3 text-3xl font-medium leading-tight text-white">{displayValue}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/45">
          {trend ? (
            <span className={trend.isPositive ? 'badge badge-success' : 'badge badge-danger'}>
              <TrendIcon size={12} />
              {Math.abs(trend.value)}%
            </span>
          ) : (
            <span className="h-1.5 w-16 rounded-full bg-current opacity-30" />
          )}
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
