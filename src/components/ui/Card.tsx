import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
};

export function Card({ children, title, actions, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/[0.04] p-5 ${className}`}>
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title ? (
            <h4 className="font-rmc-display text-xl font-bold text-rmc-mist">{title}</h4>
          ) : (
            <div />
          )}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
