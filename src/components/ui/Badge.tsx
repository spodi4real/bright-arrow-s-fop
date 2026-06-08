import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground ring-border',
        primary: 'bg-primary/10 text-primary ring-primary/20',
        success: 'bg-success/10 text-success ring-success/20',
        warning: 'bg-warning/10 text-warning ring-warning/20',
        danger: 'bg-danger/10 text-danger ring-danger/20',
        muted: 'bg-secondary text-muted-foreground ring-border',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
