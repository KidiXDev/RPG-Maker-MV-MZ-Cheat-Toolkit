import type { ReactNode } from 'react';

type BadgeVariant = 'info' | 'warning' | 'danger' | 'success';

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantStyles: Record<BadgeVariant, string> = {
  info: 'bg-rmc-aether/20 text-rmc-aether',
  warning: 'bg-rmc-ember/20 text-rmc-ember',
  danger: 'bg-rmc-danger/20 text-rmc-danger',
  success: 'bg-green-500/20 text-green-400'
};

export function Badge({ children, variant = 'info', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
