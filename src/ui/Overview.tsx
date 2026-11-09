import { FileText, FolderKanban } from 'lucide-react';
import { useState } from 'react';
import type { FileResult, ProjectResult } from '@/core';
import { cn } from '@/lib/utils';
import { dataDateLabel, formatBytes, formatCount } from './format';
import { Button } from './primitives/button';
import { Card, CardContent } from './primitives/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './primitives/table';
import { SCROLL_AREA, STICKY_HEADER } from './scroll';
import { IconChip, type Tone } from './SectionParts';

interface Tile {
  label: string;
  value: number;
  note?: string;
  /** Marks a tile that counts problems, so it stands out when above zero. */
  tone?: Tone;
}

const DOT: Record<Tone, string> = { neutral: 'bg-muted-foreground', amber: 'bg-amber-500', rose: 'bg-rose-500' };

/** The file and selected project at a glance: what was loaded, and the headline counts. */
export function FileSummary({ result, project }: { result: FileResult; project: ProjectResult | null }) {
  const [showTables, setShowTables] = useState(false);
  const projects = result.projects.length;

  const meta = [
    result.header.version ? `P6 ${result.header.version}` : null,
    result.header.exportDate ? `Exported ${result.header.exportDate}` : null,
    result.encoding,
    `${formatBytes(result.size)} (${formatCount(result.size)} bytes)`,
    projects === result.projectsInFile
      ? `${projects} ${projects === 1 ? 'project' : 'projects'}`
      : `${projects} of ${result.projectsInFile} projects have activities`,
  ].filter(Boolean);

  const counts = project?.counts;
  const leftOut = counts ? counts.finished + counts.levelOfEffort + counts.wbsSummary : 0;
  const leftOutNote = counts
    ? [
        counts.finished ? `${formatCount(counts.finished)} finished` : null,
        counts.levelOfEffort ? `${formatCount(counts.levelOfEffort)} LOE` : null,
        counts.wbsSummary ? `${formatCount(counts.wbsSummary)} WBS` : null,
      ]
        .filter(Boolean)
        .join(', ')
    : '';

  const tiles: Tile[] = [
    ...(counts && project
      ? [
          { label: 'Activities', value: counts.total },
          { label: 'Checked', value: counts.checked },
          { label: 'Left out', value: leftOut, note: leftOutNote || undefined },
        ]
      : []),
    { label: 'Links', value: result.linkCount },
    ...(project ? [{ label: 'External links', value: project.externalLinks.length }] : []),
    { label: 'Broken rows', value: result.brokenRowCount, tone: 'amber' as const },
    { label: 'Warnings', value: result.warnings.length, tone: 'amber' as const },
    { label: 'Loops', value: result.loops.length, tone: 'rose' as const },
  ];

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <IconChip icon={FileText} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight" title={result.name}>
              {result.name}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{meta.join(' · ')}</p>
          </div>
        </div>

        {project && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-muted/70 px-3 py-2 text-sm">
            <FolderKanban className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">Project</span>
            <span className="font-medium">{project.name || '(no name)'}</span>
            <span className="text-muted-foreground">· ID {project.id} · Data date</span>
            <span className={cn('font-medium', project.dataDate.state === 'unreadable' && 'text-destructive')}>
              {dataDateLabel(project.dataDate)}
            </span>
          </div>
        )}

        <dl className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', tiles.length === 8 ? 'lg:grid-cols-8' : 'lg:grid-cols-4')}>
          {tiles.map((t) => (
            <div key={t.label} className="rounded-lg border bg-background/60 px-3 py-2">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {t.tone && t.value > 0 && <span className={cn('size-1.5 rounded-full', DOT[t.tone])} aria-hidden="true" />}
                {t.label}
              </dt>
              <dd className="text-xl font-semibold">{formatCount(t.value)}</dd>
              {t.note && <dd className="truncate text-[11px] text-muted-foreground">{t.note}</dd>}
            </div>
          ))}
        </dl>

        <div>
          <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setShowTables((v) => !v)} aria-expanded={showTables}>
            {showTables ? 'Hide' : 'Show'} the {result.tables.length} tables in this file
          </Button>
          {showTables && (
            <Table
              className="mt-2"
              containerProps={{ className: SCROLL_AREA, tabIndex: 0, role: 'region', 'aria-label': 'Tables in this file' }}
            >
              <TableHeader className={STICKY_HEADER}>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead className="text-right">Rows</TableHead>
                  <TableHead className="text-right">Broken rows</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.tables.map((t) => (
                  <TableRow key={t.name}>
                    <TableCell className="font-mono text-xs">{t.name || '(no name)'}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCount(t.rows)}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.broken > 0 ? formatCount(t.broken) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
