import React from 'react';
import { DifficultyType, DomainType, TestType } from '../../types';

export type BadgeVariant = 'difficulty' | 'test' | 'domain' | 'status' | 'neutral' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  difficulty?: DifficultyType;
  test?: TestType;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = React.memo(({
  children,
  variant = 'neutral',
  difficulty,
  test,
  size = 'sm',
  className = '',
  icon
}) => {
  let colorClasses = 'bg-slate-100/90 text-slate-700 border-slate-200/90';

  if (difficulty) {
    if (difficulty === 'Easy') colorClasses = 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80';
    else if (difficulty === 'Medium') colorClasses = 'bg-amber-50/90 text-amber-800 border-amber-200/80';
    else if (difficulty === 'Hard') colorClasses = 'bg-rose-50/90 text-rose-800 border-rose-200/80';
  } else if (test) {
    if (test === 'Math') colorClasses = 'bg-blue-50/90 text-blue-800 border-blue-200/80';
    else colorClasses = 'bg-purple-50/90 text-purple-800 border-purple-200/80';
  } else {
    switch (variant) {
      case 'indigo':
        colorClasses = 'bg-indigo-50/90 text-indigo-800 border-indigo-200/80';
        break;
      case 'purple':
        colorClasses = 'bg-purple-50/90 text-purple-800 border-purple-200/80';
        break;
      case 'emerald':
        colorClasses = 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80';
        break;
      case 'amber':
        colorClasses = 'bg-amber-50/90 text-amber-800 border-amber-200/80';
        break;
      case 'rose':
        colorClasses = 'bg-rose-50/90 text-rose-800 border-rose-200/80';
        break;
      case 'neutral':
      default:
        colorClasses = 'bg-slate-100/90 text-slate-700 border-slate-200/90';
        break;
    }
  }

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] rounded-md font-bold',
    sm: 'px-2.5 py-0.5 text-xs rounded-lg font-bold',
    md: 'px-3 py-1 text-xs sm:text-sm rounded-xl font-bold'
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 border leading-none tracking-tight transition-colors select-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${sizeClasses} ${colorClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
});

Badge.displayName = 'Badge';

