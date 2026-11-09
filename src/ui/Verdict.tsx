import { CheckCircle2, MinusCircle, XCircle } from 'lucide-react';
import type { Verdict } from '@/core';
import { cn } from '@/lib/utils';
import { verdictLabel } from './format';

const STYLES: Record<Verdict, string> = {
  pass: 'bg-[#2a78d6]/10 text-[#1c5cab] dark:bg-[#3987e5]/15 dark:text-[#86b6ef]',
  fail: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  'n/a': 'bg-muted text-muted-foreground',
};

const ICONS = { pass: CheckCircle2, fail: XCircle, 'n/a': MinusCircle } as const;

/** Pass / Fail / n/a, always as an icon plus a word so it never relies on colour alone. */
export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const Icon = ICONS[verdict];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', STYLES[verdict], className)}>
      <Icon className="size-3.5" />
      {verdictLabel(verdict)}
    </span>
  );
}
