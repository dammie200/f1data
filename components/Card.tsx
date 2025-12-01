import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  title?: string;
  className?: string;
  children: ReactNode;
  accent?: boolean;
}

export function Card({ title, className, children, accent }: CardProps) {
  return (
    <div className={clsx('rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg', className, accent && 'border-accent/40 shadow-accent/10')}> 
      {title && <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h3>}
      {children}
    </div>
  );
}
