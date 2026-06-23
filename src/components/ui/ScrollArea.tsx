import type { ReactNode } from 'react';

type ScrollAreaProps = {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function ScrollArea({ children, className = '', style }: ScrollAreaProps) {
  return (
    <div className={`overflow-auto ${className}`} style={style}>
      {children}
    </div>
  );
}
