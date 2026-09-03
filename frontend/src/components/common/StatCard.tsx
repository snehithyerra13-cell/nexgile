import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  isPositiveChangeGood?: boolean; // For emissions, down is good (green), up is bad (red)
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  trend,
  isPositiveChangeGood = false,
  icon: Icon,
  iconBg = 'bg-emerald-50',
  iconColor = 'text-emerald-600',
  onClick,
}) => {
  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'text-slate-500 bg-slate-100';
    if (trend === 'down') {
      return isPositiveChangeGood ? 'text-red-700 bg-red-100' : 'text-emerald-700 bg-emerald-100';
    }
    return isPositiveChangeGood ? 'text-emerald-700 bg-emerald-100' : 'text-red-700 bg-red-100';
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-card hover:border-slate-300 transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || change) && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
          {change && (
            <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${getTrendColor()}`}>
              {change}
            </span>
          )}
          {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
