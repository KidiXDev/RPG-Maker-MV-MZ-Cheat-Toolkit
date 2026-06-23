import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
};

export function Card({ children, title, actions, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/4 p-5 ${className}`}
    >
      {title || actions ? (
        <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-4">
          {title ? (
            <h4 className="font-rmc-display text-xl font-bold text-rmc-mist">
              {title}
            </h4>
          ) : (
            <div />
          )}
          {actions ? (
            <div className="grid grid-flow-col auto-cols-max items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
