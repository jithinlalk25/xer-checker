import type { ColumnDef } from '@tanstack/react-table';
import { FileWarning } from 'lucide-react';
import { useState } from 'react';
import type { BrokenCategory, BrokenRow, FileResult } from '@/core';
import { DataTable } from './DataTable';
import { InlineLink } from './InlineLink';
import { showTabs } from './format';
import { Badge } from './primitives/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './primitives/select';
import { SectionTitle } from './SectionParts';

const KINDS: { value: BrokenCategory; label: string }[] = [
  { value: 'Layout', label: 'Layout (L)' },
  { value: 'Values', label: 'Values (V)' },
  { value: 'References', label: 'References (F)' },
  { value: 'Logic slip', label: 'Logic slips (S)' },
];

const columns: ColumnDef<BrokenRow>[] = [
  { id: 'line', header: 'Line', accessorFn: (r) => r.line, meta: { numeric: true } },
  {
    id: 'table',
    header: 'Table',
    accessorFn: (r) => r.table ?? '',
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.table ?? '(before any table)'}</span>,
  },
  {
    id: 'kind',
    header: 'Kind',
    accessorFn: (r) => r.kind,
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <Badge variant="outline" className="font-mono">
          {row.original.kind}
        </Badge>
        <span className="text-xs text-muted-foreground">{row.original.category}</span>
      </span>
    ),
  },
  { id: 'reason', header: 'Reason', accessorFn: (r) => r.reason, meta: { className: 'min-w-56 whitespace-normal' } },
  { id: 'effect', header: 'What happened', accessorFn: (r) => r.effect, meta: { className: 'min-w-40 whitespace-normal' } },
  {
    id: 'excerpt',
    header: 'Raw row',
    accessorFn: (r) => r.excerpt,
    enableSorting: false,
    cell: ({ row }) => (
      <code className="block max-w-96 truncate font-mono text-xs text-muted-foreground" title={showTabs(row.original.excerpt)}>
        {showTabs(row.original.excerpt)}
      </code>
    ),
  },
];

const searchText = (r: BrokenRow) => `${r.line} ${r.table ?? ''} ${r.kind} ${r.reason} ${r.excerpt}`;

export function BrokenRows({ result, onOpenHowItWorks }: { result: FileResult; onOpenHowItWorks: () => void }) {
  const [kind, setKind] = useState<'all' | BrokenCategory>('all');
  const rows = kind === 'all' ? result.broken : result.broken.filter((b) => b.category === kind);
  const lines = result.brokenRowCount;
  const entries = result.broken.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <SectionTitle icon={FileWarning} tone="amber" count={lines}>
            Broken rows
          </SectionTitle>
        </CardTitle>
        <CardDescription>
          {lines === 0 ? (
            'Every row could be read.'
          ) : (
            <>
              {lines} {lines === 1 ? 'line has' : 'lines have'} a problem
              {entries > lines ? ` (${entries} problems in all)` : ''}. Nothing is repaired by guessing: each row is
              skipped, or kept with the bad field treated as empty, following the rules in{' '}
              <InlineLink onClick={onOpenHowItWorks}>How this works</InlineLink>.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          data={rows}
          columns={columns}
          searchText={searchText}
          searchLabel="Search broken rows"
          label="Broken rows"
          emptyMessage={entries === 0 ? 'No broken rows.' : 'No broken rows of this kind.'}
          toolbar={
            <Select value={kind} onValueChange={(v) => setKind(v as 'all' | BrokenCategory)}>
              <SelectTrigger className="sm:w-48" aria-label="Filter by kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All kinds ({entries})</SelectItem>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label} ({result.broken.filter((b) => b.category === k.value).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
        />
      </CardContent>
    </Card>
  );
}
