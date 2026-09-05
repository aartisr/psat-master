import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'muted' | 'interactive' | 'accent' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props
}, ref) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10'
  }[padding];

  const variantStyles = {
    default: 'bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_1px_2px_rgba(0,0,0,0.02)] hover:border-slate-300 transition-colors',
    elevated: 'bg-white border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_2px_6px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.08)] transition-all',
    muted: 'bg-slate-50/80 border border-slate-200/70',
    interactive: 'bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-indigo-300 hover:shadow-[0_8px_24px_-4px_rgba(99,102,241,0.08)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    accent: 'bg-gradient-to-br from-indigo-50/60 via-white to-slate-50 border border-indigo-100/90 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.06)]',
    glass: 'bg-white/80 backdrop-blur-md border border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5'
  }[variant];

  return (
    <div
      ref={ref}
      className={`rounded-2xl sm:rounded-3xl ${variantStyles} ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

