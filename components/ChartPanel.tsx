import { ReactNode } from 'react';
import { Card } from './Card';

export function ChartPanel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card title={title} className="space-y-2">
      {description && <p className="text-sm text-slate-300">{description}</p>}
      <div className="h-72 w-full">{children}</div>
    </Card>
  );
}
