import { makeBrokenRow } from './rules.ts';
import type { BrokenEffect, BrokenKind, BrokenRow, TableSummary, XerHeader } from './types.ts';

/** The tables that get typed records and value checks. Every other table only gets layout checks. */
export const TYPED_TABLES = ['PROJECT', 'CALENDAR', 'TASK', 'TASKPRED'] as const;
export type TypedTable = (typeof TYPED_TABLES)[number];

export const NOT_XER_MESSAGE = "This isn't a P6 XER file: its first line should start with ERMHDR.";

export class NotXerError extends Error {
  constructor() {
    super(NOT_XER_MESSAGE);
    this.name = 'NotXerError';
  }
}

/** A %R row that passed the layout checks, from one of the typed tables. */
export interface RawRow {
  line: number;
  values: readonly string[];
  fieldIndex: ReadonlyMap<string, number>;
}

export interface ReadResult {
  header: XerHeader;
  /** Every table in the file, in order. Broken counts are filled in later. */
  tables: TableSummary[];
  rows: Record<TypedTable, RawRow[]>;
  broken: BrokenRow[];
  /** True if the last non-empty line is %E. */
  hasEndMarker: boolean;
}

interface Section {
  name: string;
  fieldCount: number | null;
  fieldIndex: ReadonlyMap<string, number> | null;
  summary: TableSummary;
  typedRows: RawRow[] | null;
}

/**
 * LF or CRLF ends a line. A lone CR is part of a value (P6 writes them inside notes and names).
 * Nothing else is trimmed: trailing tabs are real empty fields.
 */
const LINE_BREAK = /\r?\n/;

/** A line that starts a new record. A quoted value never runs on past one of these. */
const RECORD_START = /^(?:ERMHDR|%T|%F|%R|%E)(?:\t|$)/;

function isTypedTable(name: string): name is TypedTable {
  return (TYPED_TABLES as readonly string[]).includes(name);
}

interface SplitRow {
  values: string[];
  /** How many lines after the first the row used. */
  extra: number;
  /** False if a quoted value was still open when the next record (or the end of the file) came. */
  closed: boolean;
}

/**
 * Splits the %R row starting at lines[start] into its values.
 *
 * A value that starts with a single " is quoted: it may hold tabs and line breaks, "" stands for ",
 * and it ends at the next lone ". Newer P6 versions write calendar data this way, over many lines.
 * A value that starts with "" isn't quoted and is read as plain text.
 */
function splitRow(lines: readonly string[], start: number): SplitRow {
  let text = lines[start] ?? '';
  // Fast path: no quotes, so the row is one line of tab-separated values.
  if (!text.includes('"')) return { values: text.split('\t').slice(1), extra: 0, closed: true };

  const values: string[] = [];
  let lineIdx = start;
  let pos = text.indexOf('\t');
  if (pos === -1) return { values, extra: 0, closed: true };
  pos++;
  let value = '';
  let quoted = false;
  let atValueStart = true;

  for (;;) {
    if (pos >= text.length) {
      if (!quoted) {
        values.push(value);
        return { values, extra: lineIdx - start, closed: true };
      }
      const next = lines[lineIdx + 1];
      if (next === undefined || RECORD_START.test(next)) {
        values.push(value);
        return { values, extra: lineIdx - start, closed: false };
      }
      // The quoted value carries on onto the next line.
      lineIdx++;
      text = next;
      pos = 0;
      value += '\n';
      continue;
    }

    const c = text.charAt(pos);
    if (atValueStart) {
      atValueStart = false;
      if (c === '"' && text[pos + 1] !== '"') {
        quoted = true;
        pos++;
        continue;
      }
    }
    if (quoted && c === '"') {
      if (text[pos + 1] === '"') {
        value += '"';
        pos += 2;
      } else {
        quoted = false;
        pos++;
      }
      continue;
    }
    if (!quoted && c === '\t') {
      values.push(value);
      value = '';
      atValueStart = true;
      pos++;
      continue;
    }
    value += c;
    pos++;
  }
}

/** Reads the XER line by line and applies the layout rules (L1–L5). */
export function readXer(text: string): ReadResult {
  const lines = text.split(LINE_BREAK);
  const first = lines[0] ?? '';
  if (!first.startsWith('ERMHDR')) throw new NotXerError();

  const headerFields = first.split('\t');
  const header: XerHeader = { version: headerFields[1] ?? '', exportDate: headerFields[2] ?? '' };

  const tables = new Map<string, TableSummary>();
  const rows: Record<TypedTable, RawRow[]> = { PROJECT: [], CALENDAR: [], TASK: [], TASKPRED: [] };
  const broken: BrokenRow[] = [];
  let section: Section | null = null;
  let lastTag = 'ERMHDR';

  for (let i = 1; i < lines.length; i++) {
    const text = lines[i] ?? '';
    if (text === '') continue;
    const lineNo = i + 1;
    const tabAt = text.indexOf('\t');
    const tag = tabAt === -1 ? text : text.slice(0, tabAt);
    lastTag = tag;

    const report = (kind: BrokenKind, reason: string, effect: BrokenEffect, raw = text) => {
      broken.push(makeBrokenRow(section?.name ?? null, lineNo, kind, reason, effect, raw));
    };

    switch (tag) {
      case '%T': {
        const name = text.split('\t')[1] ?? '';
        let summary = tables.get(name);
        if (!summary) {
          summary = { name, line: lineNo, rows: 0, broken: 0 };
          tables.set(name, summary);
        }
        section = {
          name,
          fieldCount: null,
          fieldIndex: null,
          summary,
          typedRows: isTypedTable(name) ? rows[name] : null,
        };
        break;
      }
      case '%F': {
        if (!section) {
          report('L2', 'Field list (%F) before any table (%T)', 'Row skipped');
        } else if (section.fieldIndex) {
          report('L5', `A second field list (%F) for table ${section.name}`, 'Line skipped');
        } else {
          const fields = text.split('\t').slice(1);
          section.fieldCount = fields.length;
          section.fieldIndex = new Map(fields.map((f, idx) => [f, idx]));
        }
        break;
      }
      case '%R': {
        if (!section) {
          report('L2', 'Row (%R) before any table (%T)', 'Row skipped');
          break;
        }
        section.summary.rows++;
        // A row with a multi-line quoted value uses several lines. It's reported at its first line,
        // and the lines it used are skipped by the loop.
        const { values, extra, closed } = splitRow(lines, i);
        const raw = extra > 0 ? lines.slice(i, i + extra + 1).join('\n') : text;
        i += extra;
        if (section.fieldIndex === null || section.fieldCount === null) {
          report('L3', `Row before the field list (%F) of table ${section.name}`, 'Row skipped', raw);
          break;
        }
        if (!closed) {
          report('L4', 'A quoted value (starting with ") is never closed', 'Row skipped', raw);
          break;
        }
        if (values.length !== section.fieldCount) {
          report('L4', `${values.length} fields instead of ${section.fieldCount}`, 'Row skipped', raw);
          break;
        }
        section.typedRows?.push({ line: lineNo, values, fieldIndex: section.fieldIndex });
        break;
      }
      case '%E':
        break;
      default:
        report(
          'L5',
          tag === 'ERMHDR'
            ? 'A second ERMHDR header line'
            : "Unrecognised line: it doesn't start with ERMHDR, %T, %F, %R or %E",
          'Line skipped',
        );
    }
  }

  return { header, tables: [...tables.values()], rows, broken, hasEndMarker: lastTag === '%E' };
}
