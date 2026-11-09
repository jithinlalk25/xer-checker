import { BarChart3 } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type RectangleProps,
} from 'recharts';
import type { CheckSummary, ProjectResult } from '@/core';
import { cn } from '@/lib/utils';
import { CHECKS, type CheckInfo } from './checks';
import { formatPct, verdictLabel } from './format';
import { Button } from './primitives/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './primitives/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './primitives/table';
import { SCROLL_AREA, STICKY_HEADER } from './scroll';
import { SectionTitle } from './SectionParts';
import { CHART_COLORS, type ChartColors } from './chartColors';
import { useTheme } from './themeContext';
import type { LoadedFile } from './useLoadedFiles';

/** One bar per loaded project. */
interface ChartRow {
  key: string;
  file: LoadedFile;
  project: ProjectResult;
  /** The project name, shown only when the file has several projects. */
  projectLabel: string | null;
}

interface Datum {
  key: string;
  value: number;
  summary: CheckSummary;
  row: ChartRow;
}

const ROW_HEIGHT = 44;
const AXIS_HEIGHT = 24;
const LABEL_SPACE = 76;
/** Space left of the bars, so the 0% tick isn't clipped. */
const PLOT_LEFT = 12;
/** On phones each panel has its own label column (7.5rem plus a 12px gap, see the grid below). */
const PHONE_LABEL_COLUMN = 120 + 12;
const PHONE_QUERY = '(max-width: 639px)';

/** True on phone-width screens, where the tooltip starts under the labels so it stays on screen. */
function usePhoneWidth(): boolean {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const onChange = () => setPhone(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return phone;
}

function chartRows(files: LoadedFile[]): ChartRow[] {
  return files.flatMap((file) => {
    const projects = file.result?.projects ?? [];
    return projects.map((project) => ({
      key: `${file.id}:${project.id}`,
      file,
      project,
      projectLabel: projects.length > 1 ? project.name || `Project ${project.id}` : null,
    }));
  });
}

/** Smallest of 10/20/50/100 that fits every bar, so all three panels share one honest scale. */
function scaleMax(rows: ChartRow[]): number {
  const largest = Math.max(0, ...rows.flatMap((r) => CHECKS.map((c) => r.project.checks[c.key].pct ?? 0)));
  return [10, 20, 50].find((m) => largest <= m) ?? 100;
}

export function ResultsChart({ files }: { files: LoadedFile[] }) {
  const { resolved } = useTheme();
  const colors = CHART_COLORS[resolved];
  const rows = chartRows(files);
  const max = scaleMax(rows);
  const [showTable, setShowTable] = useState(false);
  const tooltipX = usePhoneWidth() ? -PHONE_LABEL_COLUMN : PLOT_LEFT;

  if (rows.length === 0) return null;

  return (
    <Card className="overflow-visible">
      <CardHeader>
        <CardTitle>
          <SectionTitle icon={BarChart3}>Share of checked activities failing each check</SectionTitle>
        </CardTitle>
        <CardDescription>One bar per project. Hover a bar for the count behind it.</CardDescription>
        <Legend colors={colors} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-[10rem_repeat(3,minmax(0,1fr))]">
          <RowLabels rows={rows} className="hidden lg:block" />
          {CHECKS.map((check) => (
            <div key={check.key} className="min-w-0">
              <PanelHeader check={check} />
              <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[10rem_minmax(0,1fr)] lg:block">
                <RowLabels rows={rows} className="lg:hidden" withHeader={false} />
                <Panel check={check} rows={rows} max={max} colors={colors} tooltipX={tooltipX} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
            {showTable ? 'Hide the numbers' : 'Show the numbers as a table'}
          </Button>
          {showTable && <ChartTable rows={rows} />}
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ colors }: { colors: ChartColors }) {
  return (
    <ul className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ background: colors.pass }} /> Pass
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm" style={{ background: colors.fail }} /> Fail
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="14" height="12" aria-hidden="true">
          <line x1="7" y1="0" x2="7" y2="12" stroke={colors.ink} strokeWidth="1.5" strokeDasharray="3 2" />
        </svg>
        Pass mark
      </li>
    </ul>
  );
}

function PanelHeader({ check }: { check: CheckInfo }) {
  return (
    <div className="mb-1 flex h-11 flex-col justify-end">
      <h3 className="text-sm font-medium">{check.title}</h3>
      <p className="text-xs text-muted-foreground">Pass mark: {check.passMark}</p>
    </div>
  );
}

function RowLabels({ rows, className, withHeader = true }: { rows: ChartRow[]; className?: string; withHeader?: boolean }) {
  return (
    <div className={className} aria-hidden="true">
      {withHeader && <div className="mb-1 h-11" />}
      {rows.map((row) => (
        <div key={row.key} className="flex flex-col justify-center overflow-hidden" style={{ height: ROW_HEIGHT }}>
          <span className="truncate text-xs font-medium" title={row.file.name}>
            {row.file.name}
          </span>
          {row.projectLabel && (
            <span className="truncate text-[11px] text-muted-foreground" title={row.projectLabel}>
              {row.projectLabel}
            </span>
          )}
        </div>
      ))}
      <div style={{ height: AXIS_HEIGHT }} />
    </div>
  );
}

function barColor(summary: CheckSummary, colors: ChartColors): string {
  return summary.verdict === 'fail' ? colors.fail : summary.verdict === 'pass' ? colors.pass : colors.none;
}

function Panel({
  check,
  rows,
  max,
  colors,
  tooltipX,
}: {
  check: CheckInfo;
  rows: ChartRow[];
  max: number;
  colors: ChartColors;
  tooltipX: number;
}) {
  const data: Datum[] = rows.map((row) => {
    const summary = row.project.checks[check.key];
    return { key: row.key, value: summary.pct ?? 0, summary, row };
  });
  const byKey = new Map(data.map((d) => [d.key, d]));

  return (
    <ResponsiveContainer width="100%" height={rows.length * ROW_HEIGHT + AXIS_HEIGHT}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: LABEL_SPACE, bottom: 0, left: PLOT_LEFT }}>
        <CartesianGrid horizontal={false} stroke={colors.grid} />
        <XAxis
          type="number"
          domain={[0, max]}
          ticks={[0, max / 2, max]}
          interval={0}
          tickFormatter={(v: number) => `${v}%`}
          height={AXIS_HEIGHT}
          tickLine={false}
          axisLine={{ stroke: colors.axis }}
          tick={{ fill: colors.muted, fontSize: 11 }}
        />
        <YAxis type="category" dataKey="key" hide />
        {/* The tooltip is pinned to the hovered row, not the cursor: below it for the top half of the
            rows and above it for the bottom half, so it never covers the bar being read. */}
        <Tooltip
          cursor={{ fill: colors.hover }}
          isAnimationActive={false}
          position={{ x: tooltipX, y: 0 }}
          allowEscapeViewBox={{ x: true, y: true }}
          wrapperStyle={{ zIndex: 30, pointerEvents: 'none' }}
          content={({ active, payload }) => {
            const datum = payload?.[0]?.payload as Datum | undefined;
            if (!active || !datum) return null;
            const index = data.findIndex((d) => d.key === datum.key);
            const below = index < data.length / 2;
            const style = below
              ? { marginTop: (index + 1) * ROW_HEIGHT + 2 }
              : { marginTop: index * ROW_HEIGHT - 2, transform: 'translateY(-100%)' };
            return <ChartTooltip check={check} datum={datum} style={style} />;
          }}
        />
        {/* minPointSize keeps 0% rows in the bar and label layers (Recharts drops zero-width bars and
            renumbers the rest); the shape then draws nothing for them, and labels are looked up by key. */}
        <Bar
          dataKey="value"
          barSize={20}
          minPointSize={1}
          isAnimationActive={false}
          shape={(props: unknown) => {
            const p = props as RectangleProps & { payload?: Datum };
            return p.payload && p.payload.value > 0 ? <Rectangle {...p} radius={[0, 4, 4, 0]} /> : <g />;
          }}
        >
          {data.map((d) => (
            <Cell key={d.key} fill={barColor(d.summary, colors)} />
          ))}
          <LabelList
            dataKey="key"
            content={(props) => {
              const datum = byKey.get(String(props.value));
              if (!datum) return null;
              const x = Number(props.x) + (datum.value > 0 ? Number(props.width) : 0) + 6;
              const y = Number(props.y) + Number(props.height) / 2;
              const { pct, verdict } = datum.summary;
              return (
                <text x={x} y={y} dominantBaseline="central" fontSize={12}>
                  <tspan fill={colors.ink} fontWeight={600}>
                    {pct === null ? 'n/a' : formatPct(pct)}
                  </tspan>
                  {verdict !== 'n/a' && <tspan fill={colors.secondary}>{` ${verdict}`}</tspan>}
                </text>
              );
            }}
          />
        </Bar>
        <ReferenceLine x={check.passMarkPct} stroke={colors.ink} strokeWidth={1.5} strokeDasharray="4 3" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartTooltip({ check, datum, style }: { check: CheckInfo; datum: Datum; style: CSSProperties }) {
  const { summary, row } = datum;
  return (
    <div className="w-64 max-w-72 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md" style={style}>
      <p className="text-sm font-semibold">
        {summary.pct === null ? 'n/a' : formatPct(summary.pct)}{' '}
        <span className="font-normal text-muted-foreground">{check.title.toLowerCase()}</span>
      </p>
      <p className="mt-0.5">
        {summary.count} of {summary.base} {check.baseLabel}
      </p>
      <p className="mt-1.5 font-medium break-all">{row.file.name}</p>
      <p className="text-muted-foreground">
        Project {row.project.name || row.project.id}
        {row.project.name ? ` (ID ${row.project.id})` : ''}
      </p>
      <p className="mt-1.5">
        <span className="font-medium">{verdictLabel(summary.verdict)}</span>
        <span className="text-muted-foreground"> · pass mark {check.passMark}</span>
      </p>
    </div>
  );
}

function ChartTable({ rows }: { rows: ChartRow[] }) {
  return (
    <Table
      className="mt-2"
      containerProps={{ className: SCROLL_AREA, tabIndex: 0, role: 'region', 'aria-label': 'Chart numbers' }}
    >
      <TableHeader className={STICKY_HEADER}>
        <TableRow>
          <TableHead>File</TableHead>
          {CHECKS.map((c) => (
            <TableHead key={c.key}>
              {c.title} <span className="font-normal text-muted-foreground">({c.passMark})</span>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell>
              <span className="font-medium">{row.file.name}</span>
              {row.projectLabel && <span className="text-muted-foreground"> · {row.projectLabel}</span>}
            </TableCell>
            {CHECKS.map((c) => {
              const s = row.project.checks[c.key];
              return (
                <TableCell key={c.key} className="tabular-nums">
                  {s.count} / {s.base} = {formatPct(s.pct)}{' '}
                  <span className={cn('font-medium', s.verdict === 'fail' && 'text-destructive')}>
                    {verdictLabel(s.verdict)}
                  </span>
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
