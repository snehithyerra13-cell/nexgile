import React from 'react';

export type BadgeVariant =
  | 'emerald'
  | 'red'
  | 'amber'
  | 'blue'
  | 'purple'
  | 'slate'
  | 'cyan';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'sm',
  className = '',
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
    emerald: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80', dot: 'bg-emerald-500' },
    red: { bg: 'bg-rose-50 text-rose-700 border-rose-200/80', dot: 'bg-rose-500' },
    amber: { bg: 'bg-amber-50 text-amber-800 border-amber-200/80', dot: 'bg-amber-500' },
    blue: { bg: 'bg-blue-50 text-blue-700 border-blue-200/80', dot: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50 text-purple-700 border-purple-200/80', dot: 'bg-purple-500' },
    slate: { bg: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
    cyan: { bg: 'bg-cyan-50 text-cyan-800 border-cyan-200', dot: 'bg-cyan-500' },
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[variant].bg} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${variantStyles[variant].dot}`} />}
      {children}
    </span>
  );
};
