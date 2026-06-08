import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: Props) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 pb-6 border-b mb-6', className)}>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1.5">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
