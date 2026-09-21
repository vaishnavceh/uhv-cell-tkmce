import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md';

    const variants = {
      primary:
        'bg-institutional-850 text-white hover:bg-institutional-900 focus:ring-institutional-700 shadow-subtle border border-institutional-800 active:scale-[0.98]',
      emerald:
        'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-subtle active:scale-[0.98]',
      secondary:
        'bg-white text-institutional-900 border border-emerald-900/20 hover:bg-emerald-50/60 focus:ring-emerald-600 shadow-subtle',
      outline:
        'border border-institutional-800 text-institutional-850 hover:bg-institutional-50 focus:ring-institutional-700',
      danger:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-subtle',
      ghost:
        'text-institutional-800 hover:bg-emerald-50 hover:text-institutional-950 focus:ring-emerald-500',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-6 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
