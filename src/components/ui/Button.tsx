import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-rmc-ember text-rmc-abyss hover:brightness-110 shadow-[0_2px_10px_rgba(255,179,92,0.2)]',
  secondary: 'bg-rmc-aether text-rmc-abyss hover:brightness-110 shadow-[0_2px_10px_rgba(117,214,255,0.15)]',
  ghost: 'bg-white/10 text-rmc-mist hover:bg-white/20 border border-white/5',
  danger: 'bg-rmc-danger/20 text-rmc-danger border border-rmc-danger/30 hover:bg-rmc-danger/30'
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-6 py-4 text-base'
};

export function Button({
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center rounded-lg font-semibold outline-none transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rmc-ember ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:scale-[1.02] active:scale-[0.98]'} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
