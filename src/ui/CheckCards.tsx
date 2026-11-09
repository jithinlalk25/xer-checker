import type { ProjectResult, Verdict } from '@/core';
import { cn } from '@/lib/utils';
import { CHECKS, type CheckInfo } from './checks';
import { formatCount, formatPct } from './format';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';
import { SectionTitle } from './SectionParts';
import { VerdictBadge } from './Verdict';

/** The same blue/red as the chart, so a card and its bars read alike. */
const ACCENT: Record<Verdict, string> = {
  pass: 'bg-[#2a78d6] dark:bg-[#3987e5]',
  fail: 'bg-[#d03b3b] dark:bg-[#e05252]',
  'n/a': 'bg-border',
};

export function CheckCards({ project }: { project: ProjectResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {CHECKS.map((check) => (
        <CheckCard key={check.key} check={check} project={project} />
      ))}
    </div>
  );
}

function CheckCard({ check, project }: { check: CheckInfo; project: ProjectResult }) {
  const summary = project.checks[check.key];
  const missing = project.checks.missingLinks;
  const noFloat = project.noFloat.length;
  return (
    <Card className="relative">
      <span className={cn('absolute inset-x-0 top-0 h-1', ACCENT[summary.verdict])} aria-hidden="true" />
      <CardHeader>
        <CardTitle>
          <SectionTitle icon={check.icon}>{check.title}</SectionTitle>
        </CardTitle>
        <CardDescription>Pass mark: {check.passMark}</CardDescription>
        <CardAction>
          <VerdictBadge verdict={summary.verdict} />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight">{formatPct(summary.pct)}</p>
          <p className="text-muted-foreground">
            {formatCount(summary.count)} of {formatCount(summary.base)} {check.baseLabel}
          </p>
        </div>
        {check.key === 'missingLinks' && (
          <ul className="grid grid-cols-3 gap-2 text-xs">
            <Bucket label="No predecessor only" value={missing.buckets.noPredOnly} />
            <Bucket label="No successor only" value={missing.buckets.noSuccOnly} />
            <Bucket label="Neither" value={missing.buckets.neither} />
          </ul>
        )}
        {check.key !== 'missingLinks' && noFloat > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatCount(noFloat)} unfinished {noFloat === 1 ? 'activity has' : 'activities have'} no float and{' '}
            {noFloat === 1 ? 'is' : 'are'} left out.
          </p>
        )}
        <p className="mt-auto border-t pt-3 text-xs text-muted-foreground">{check.explanation}</p>
      </CardContent>
    </Card>
  );
}

function Bucket({ label, value }: { label: string; value: number }) {
  return (
    <li className="rounded-md bg-muted/60 px-2 py-1.5">
      <p className="text-base font-semibold">{formatCount(value)}</p>
      <p className="text-muted-foreground">{label}</p>
    </li>
  );
}
