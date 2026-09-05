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
    default: 'bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors',
    elevated: 'bg-white border border-slate-200 shadow-md hover:shadow-lg transition-all',
    muted: 'bg-slate-50 border border-slate-200',
    interactive: 'bg-white border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
    accent: 'bg-gradient-to-br from-blue-50/60 via-white to-slate-50 border border-blue-200 shadow-sm',
    glass: 'bg-white/90 backdrop-blur-md border border-slate-200 shadow-sm ring-1 ring-slate-900/5'
  }[variant];

  return (
    <div
      ref={ref}
      className={`rounded-2xl ${variantStyles} ${paddingStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

