import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isCurrency?: boolean;
}

export default function StatCard({ title, value, icon: Icon, trend, isCurrency = false }: StatCardProps) {
  const displayValue = isCurrency ? formatCurrency(Number(value)) : value;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-transparent dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-slate-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{displayValue}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-full">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </div>
  );
}
