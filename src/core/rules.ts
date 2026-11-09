import { EXCERPT_MAX_CHARS } from './constants.ts';
import type { BrokenCategory, BrokenEffect, BrokenKind, BrokenRow, RuleId } from './types.ts';

export interface RuleInfo {
  category: BrokenCategory;
  rule: string;
  outcome: string;
}

/** The broken-row rules in plain words, in the order they are listed. */
export const RULES: Record<RuleId, RuleInfo> = {
  L1: {
    category: 'Layout',
    rule: "Line 1 doesn't start with ERMHDR",
    outcome: 'The whole file is refused',
  },
  L2: {
    category: 'Layout',
    rule: 'A field list (%F) or row (%R) comes before any table (%T)',
    outcome: 'Row skipped',
  },
  L3: {
    category: 'Layout',
    rule: "A row (%R) comes before its table's field list (%F)",
    outcome: 'Row skipped',
  },
  L4: {
    category: 'Layout',
    rule: 'A row has a different number of fields from its field list, or a quoted value is never closed',
    outcome: 'Row skipped',
  },
  L5: {
    category: 'Layout',
    rule: "A non-empty line that isn't ERMHDR, %T, %F, %R or %E",
    outcome: 'Line skipped',
  },
  V1: {
    category: 'Values',
    rule: 'A key is empty (proj_id, clndr_id, task_id, task_pred_id)',
    outcome: 'Row skipped',
  },
  V2: {
    category: 'Values',
    rule: 'The same key appears twice in a table',
    outcome: 'The first row is kept, later ones skipped',
  },
  V3: {
    category: 'Values',
    rule: "A number field isn't a number (the *_id fields, day_hr_cnt, total_float_hr_cnt)",
    outcome: 'Bad *_id field: row skipped. Otherwise the field is treated as empty and the row kept',
  },
  V4: {
    category: 'Values',
    rule: "A date field can't be read (last_recalc_date)",
    outcome: 'Field treated as empty; the data date shows "unreadable"',
  },
  F1: {
    category: 'References',
    rule: "The activity's project isn't in the file",
    outcome: "Activity skipped, since it can't be placed",
  },
  F2: {
    category: 'References',
    rule: "The activity's calendar is empty or isn't in CALENDAR",
    outcome: 'Activity kept, using 8 hours a day',
  },
  F3: {
    category: 'References',
    rule: "A link's activity isn't in TASK, but its project is in the file",
    outcome: 'Link skipped',
  },
  S1: {
    category: 'Logic slip',
    rule: 'An activity is linked to itself',
    outcome: 'Link skipped',
  },
  S2: {
    category: 'Logic slip',
    rule: 'The same link (predecessor, successor and link type) appears more than once',
    outcome: 'The first is kept, later ones skipped',
  },
};

export function excerpt(text: string): string {
  return text.length > EXCERPT_MAX_CHARS ? `${text.slice(0, EXCERPT_MAX_CHARS)}…` : text;
}

export function makeBrokenRow(
  table: string | null,
  line: number,
  kind: BrokenKind,
  reason: string,
  effect: BrokenEffect,
  rawLine: string,
): BrokenRow {
  return { table, line, kind, category: RULES[kind].category, reason, effect, excerpt: excerpt(rawLine) };
}
