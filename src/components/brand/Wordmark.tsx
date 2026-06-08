import { cn } from '@/lib/utils';

type WordmarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
};

const sizeMap = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
  xl: 'text-5xl',
};

export function Wordmark({ size = 'md', className }: WordmarkProps) {
  return (
    <span className={cn('inline-flex items-baseline font-display', sizeMap[size], className)}>
      <span className="font-light text-[#686064] dark:text-[#B8B5B0]">Bright</span>
      <span className="font-bold text-[#349fde]">Arrow</span>
    </span>
  );
}
