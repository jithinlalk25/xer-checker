import { cn } from '@/lib/utils';

/** A file name, truncated to fit, with the full name on hover. */
export function FileName({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn('block min-w-0 truncate font-medium', className)} title={name}>
      {name}
    </span>
  );
}
