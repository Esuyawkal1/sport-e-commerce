import { cn } from '../../lib/cn.js';

export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-brand-border/60',
        className,
      )}
      {...props}
    />
  );
}
