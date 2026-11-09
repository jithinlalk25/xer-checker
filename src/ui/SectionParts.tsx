import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Colour family for a section's icon and count. Amber marks problems, rose marks loops. */
export type Tone = 'neutral' | 'amber' | 'rose';

const CHIP: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground/70 ring-1 ring-foreground/5',
  amber: 'bg-amber-500/12 text-amber-700 ring-1 ring-amber-500/15 dark:bg-amber-400/12 dark:text-amber-300',
  rose: 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/15 dark:bg-rose-400/12 dark:text-rose-300',
};

const COUNT: Record<Tone, string> = {
  neutral: 'bg-muted text-foreground/80',
  amber: 'bg-amber-500/15 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
  rose: 'bg-rose-500/12 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200',
};

export function IconChip({ icon: Icon, tone = 'neutral', size = 'md' }: { icon: LucideIcon; tone?: Tone; size?: 'md' | 'lg' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg',
        size === 'lg' ? 'size-10 [&_svg]:size-5' : 'size-7 [&_svg]:size-4',
        CHIP[tone],
      )}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}

/** A count next to a section title. Zero stays neutral so only real findings draw the eye. */
export function CountBadge({ count, tone = 'neutral' }: { count: number; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold tabular-nums',
        COUNT[count > 0 ? tone : 'neutral'],
      )}
    >
      {count.toLocaleString('en-US')}
    </span>
  );
}

/** Card title with its icon chip and an optional count. */
export function SectionTitle({
  icon,
  tone = 'neutral',
  count,
  children,
}: {
  icon: LucideIcon;
  tone?: Tone;
  count?: number;
  children: ReactNode;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <IconChip icon={icon} tone={tone} />
      <span>{children}</span>
      {count !== undefined && <CountBadge count={count} tone={tone} />}
    </span>
  );
}

/** Labels a group of cards, e.g. "Checks", with a rule running to the edge. */
export function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h2 className="shrink-0 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{children}</h2>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
