import type { ColumnDef } from '@tanstack/react-table';
import { ListChecks } from 'lucide-react';
import type { Activity, MissingBucket, ProjectResult } from '@/core';
import { HIGH_FLOAT_DAYS } from '@/core';
import { DataTable } from './DataTable';
import { fixed1, formatDays, statusLabel, typeLabel } from './format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './primitives/tabs';
import { SectionTitle } from './SectionParts';
import { Tooltip, TooltipContent, TooltipTrigger } from './primitives/tooltip';

interface Flagged {
  activity: Activity;
  reason: string;
  /** Keeps "worst first" order when sorting by reason. */
  rank: number;
}

const BUCKET_REASONS: Record<MissingBucket, string> = {
  neither: 'No predecessor or successor',
  noPredOnly: 'No predecessor',
  noSuccOnly: 'No successor',
};
const BUCKET_RANK: Record<MissingBucket, number> = { neither: 0, noPredOnly: 1, noSuccOnly: 2 };

const columns: ColumnDef<Flagged>[] = [
  {
    id: 'code',
    header: 'Activity ID',
    accessorFn: (r) => r.activity.code,
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.activity.code || '—'}</span>,
  },
  {
    id: 'name',
    header: 'Name',
    accessorFn: (r) => r.activity.name,
    meta: { className: 'min-w-48 whitespace-normal' },
  },
  { id: 'status', header: 'Status', accessorFn: (r) => statusLabel(r.activity.status) },
  { id: 'type', header: 'Type', accessorFn: (r) => typeLabel(r.activity.type) },
  {
    id: 'float',
    header: 'Float (days)',
    accessorFn: (r) => r.activity.floatDays,
    sortUndefined: 'last',
    sortingFn: (a, b) => (a.original.activity.floatDays ?? Infinity) - (b.original.activity.floatDays ?? Infinity),
    cell: ({ row }) => formatDays(row.original.activity.floatDays),
    meta: { numeric: true },
  },
  {
    id: 'hours',
    header: 'Hours/day',
    accessorFn: (r) => r.activity.hoursPerDay,
    cell: ({ row }) => <HoursCell activity={row.original.activity} />,
    meta: { numeric: true },
  },
  {
    id: 'reason',
    header: 'Reason',
    accessorFn: (r) => r.rank,
    cell: ({ row }) => row.original.reason,
    meta: { className: 'min-w-48 whitespace-normal' },
  },
];

function HoursCell({ activity }: { activity: Activity }) {
  if (!activity.assumedHours) return <>{fixed1(activity.hoursPerDay)}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help items-center gap-1 underline decoration-dotted underline-offset-2">
          {fixed1(activity.hoursPerDay)} <span className="text-xs text-muted-foreground">assumed</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>8 hours a day assumed, because {activity.hoursNote}.</TooltipContent>
    </Tooltip>
  );
}

const searchText = (r: Flagged) => `${r.activity.code} ${r.activity.name}`;

export function FlaggedLists({ project }: { project: ProjectResult }) {
  const { missingLinks, negativeFloat, highFloat } = project.checks;

  const lists = [
    {
      key: 'missing',
      label: 'Missing links',
      description: 'Checked activities with no predecessor, no successor, or neither. Links to other projects count.',
      rows: missingLinks.items.map((i) => ({ activity: i.activity, reason: BUCKET_REASONS[i.bucket], rank: BUCKET_RANK[i.bucket] })),
      empty: 'Every checked activity has a predecessor and a successor.',
    },
    {
      key: 'negative',
      label: 'Negative float',
      description: 'Checked activities with total float below 0 working days, most negative first.',
      rows: negativeFloat.items.map((a, i) => ({ activity: a, reason: `${formatDays(a.floatDays)} days, below 0`, rank: i })),
      empty: 'No checked activity has negative float.',
    },
    {
      key: 'high',
      label: 'High float',
      description: `Checked activities with total float above ${HIGH_FLOAT_DAYS} working days, highest first.`,
      rows: highFloat.items.map((a, i) => ({ activity: a, reason: `${formatDays(a.floatDays)} days, above ${HIGH_FLOAT_DAYS}`, rank: i })),
      empty: `No checked activity has float above ${HIGH_FLOAT_DAYS} working days.`,
    },
    {
      key: 'exempt',
      label: 'Exempt milestones',
      description: 'Start milestones need no predecessor and finish milestones need no successor, so these are not counted as missing links.',
      rows: project.exempt.map((e, i) => ({
        activity: e.activity,
        reason: e.reason === 'start-milestone-no-predecessor' ? 'Start milestone with no predecessor' : 'Finish milestone with no successor',
        rank: i,
      })),
      empty: 'No exempt milestones.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <SectionTitle icon={ListChecks}>Flagged activities</SectionTitle>
        </CardTitle>
        <CardDescription>Worst first. Click a column to sort it; search by activity ID or name.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="missing">
          <TabsList className="max-w-full flex-wrap justify-start group-data-horizontal/tabs:h-auto">
            {lists.map((l) => (
              <TabsTrigger key={l.key} value={l.key} className="h-7 flex-none">
                {l.label} <span className="text-muted-foreground tabular-nums">{l.rows.length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {lists.map((l) => (
            <TabsContent key={l.key} value={l.key} className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">{l.description}</p>
              <DataTable
                data={l.rows}
                columns={columns}
                searchText={searchText}
                searchLabel="Search activities"
                label={`Flagged activities: ${l.label}`}
                emptyMessage={l.empty}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
