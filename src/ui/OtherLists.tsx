import { AlertTriangle, CheckCircle2, ExternalLink, Repeat } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FileResult, ProjectResult } from '@/core';
import { cn } from '@/lib/utils';
import { formatCount } from './format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './primitives/table';
import { SCROLL_AREA, STICKY_HEADER } from './scroll';
import { SectionTitle } from './SectionParts';

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground">
      <CheckCircle2 className="size-4" /> {children}
    </p>
  );
}

export function ExternalLinks({ project }: { project: ProjectResult | null }) {
  const links = project?.externalLinks ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <SectionTitle icon={ExternalLink} count={links.length}>
            External links
          </SectionTitle>
        </CardTitle>
        <CardDescription>
          Links to an activity in a project that isn't in this file. They aren't broken, and they count as links for the
          missing-links check.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <Empty>No external links{project ? ' in this project' : ''}.</Empty>
        ) : (
          <Table containerProps={{ className: SCROLL_AREA, tabIndex: 0, role: 'region', 'aria-label': 'External links' }}>
            <TableHeader className={STICKY_HEADER}>
              <TableRow>
                <TableHead>Activity in this file</TableHead>
                <TableHead>Linked to</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Line</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((l) => (
                <TableRow key={l.linkId}>
                  <TableCell className="whitespace-normal">
                    <span className="font-mono text-xs">{l.activity.code}</span> {l.activity.name}
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    {l.outsideEnd === 'predecessor' ? 'Predecessor' : 'Successor'}{' '}
                    <span className="font-mono text-xs">{l.outsideTaskId}</span> in project{' '}
                    <span className="font-mono text-xs">{l.outsideProjectId}</span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.type || '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">{l.line}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function Loops({ result }: { result: FileResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <SectionTitle icon={Repeat} tone="rose" count={result.loops.length}>
            Loops
          </SectionTitle>
        </CardTitle>
        <CardDescription>
          Groups of activities that can each reach every other through links, so none of them can start first. Listed
          for the whole file; they don't change the 3 checks.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.loops.length === 0 ? (
          <Empty>No loops.</Empty>
        ) : (
          <ol className={cn(SCROLL_AREA, 'space-y-3 pr-1')} tabIndex={0} aria-label="Loops">
            {result.loops.map((loop, i) => (
              <li key={i} className="flex gap-2">
                <Repeat className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    Loop {i + 1}: {formatCount(loop.activities.length)} activities
                  </p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {loop.activities.map((a) => (
                      <li key={a.taskId}>
                        <span className="font-mono text-xs text-foreground">{a.code}</span> {a.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function Warnings({ result }: { result: FileResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <SectionTitle icon={AlertTriangle} tone="amber" count={result.warnings.length}>
            Warnings
          </SectionTitle>
        </CardTitle>
        <CardDescription>Worth knowing, but not broken rows.</CardDescription>
      </CardHeader>
      <CardContent>
        {result.warnings.length === 0 ? (
          <Empty>No warnings.</Empty>
        ) : (
          <ul className={cn(SCROLL_AREA, 'space-y-2 pr-1')} tabIndex={0} aria-label="Warnings">
            {result.warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span>
                  {w.message}
                  {w.line !== null && <span className="text-muted-foreground"> (line {w.line})</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
