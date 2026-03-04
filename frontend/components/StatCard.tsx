import { LucideIcon } from 'lucide-react';
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
}

export default function StatCard({ title, value, icon: Icon, trend, isCurrency = false }: StatCardProps) {
  const displayValue = isCurrency ? formatCurrency(Number(value)) : value;

  return (
    <div
      className="card group relative overflow-hidden"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: '160px',
        justifyContent: 'space-between'
      }}
    >
      {/* Accent Glow Blob */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          background: 'var(--accent)',
          filter: 'blur(60px)',
          opacity: 0.1,
          pointerEvents: 'none',
          transition: 'opacity 0.3s'
        }}
        className="group-hover:opacity-20"
      />

      <div className="flex justify-between items-start">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            {title}
          </span>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--white)',
              lineHeight: 1
            }}
          >
            {displayValue}
          </h2>
        </div>

        <div
          style={{
            padding: '0.75rem',
            backgroundColor: 'var(--bg-3)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}
        >
          <Icon size={20} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {trend && (
          <span
            className={trend.isPositive ? 'badge-accent badge' : 'badge-danger badge'}
            style={{ fontSize: '10px' }}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-3)'
          }}
        >
          vs previous period
        </span>
      </div>
    </div>
  );
}
