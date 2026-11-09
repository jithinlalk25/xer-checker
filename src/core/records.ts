import { DEFAULT_HOURS_PER_DAY } from './constants.ts';
import type { RawRow, TypedTable } from './reader.ts';
import { makeBrokenRow } from './rules.ts';
import type { Activity, BrokenEffect, BrokenKind, BrokenRow, DataDate, Link } from './types.ts';
import { isId, isValidDate, parseNumber, quote } from './values.ts';

export interface ProjectRecord {
  id: string;
  name: string;
  line: number;
  dataDate: DataDate;
}

export interface CalendarRecord {
  id: string;
  name: string;
  /** day_hr_cnt, or null when empty or unreadable. */
  hoursPerDay: number | null;
}

export interface Model {
  /** In file order. */
  projects: Map<string, ProjectRecord>;
  calendars: Map<string, CalendarRecord>;
  /** Kept activities, in file order. */
  activities: Map<string, Activity>;
  /** Valid links (not skipped), external ones included, in file order. */
  links: Link[];
  broken: BrokenRow[];
}

function field(row: RawRow, name: string): string {
  const idx = row.fieldIndex.get(name);
  return idx === undefined ? '' : (row.values[idx] ?? '');
}

/**
 * Builds typed records for PROJECT, CALENDAR, TASK and TASKPRED and applies the value (V),
 * reference (F) and logic-slip (S) rules. Rows are checked in this order, and a skipped row
 * gets one entry: V1 empty key, V3 bad *_id, V2 duplicate key, then F and S rules.
 * A kept row can also get V3/V4/F2 entries for fields treated as empty or defaulted.
 */
export function buildModel(rows: Record<TypedTable, RawRow[]>): Model {
  const broken: BrokenRow[] = [];

  const report = (table: TypedTable, row: RawRow, kind: BrokenKind, reason: string, effect: BrokenEffect) => {
    broken.push(makeBrokenRow(table, row.line, kind, reason, effect, `%R\t${row.values.join('\t')}`));
  };

  /** V1, V3 (for *_id fields) and V2. Returns the key, or null if the row is skipped. */
  const checkKey = (
    table: TypedTable,
    row: RawRow,
    keyField: string,
    otherIdFields: readonly string[],
    seen: Map<string, number>,
  ): string | null => {
    const key = field(row, keyField);
    if (key === '') {
      report(table, row, 'V1', `Empty key ${keyField}`, 'Row skipped');
      return null;
    }
    for (const name of [keyField, ...otherIdFields]) {
      const value = field(row, name);
      if (value !== '' && !isId(value)) {
        report(table, row, 'V3', `${name} ${quote(value)} isn't a number`, 'Row skipped');
        return null;
      }
    }
    const firstLine = seen.get(key);
    if (firstLine !== undefined) {
      report(table, row, 'V2', `Duplicate ${keyField} ${key} (first on line ${firstLine})`, 'Row skipped');
      return null;
    }
    seen.set(key, row.line);
    return key;
  };

  // PROJECT
  const projects = new Map<string, ProjectRecord>();
  const projectKeys = new Map<string, number>();
  for (const row of rows.PROJECT) {
    const id = checkKey('PROJECT', row, 'proj_id', [], projectKeys);
    if (id === null) continue;
    const rawDate = field(row, 'last_recalc_date');
    let dataDate: DataDate;
    if (rawDate === '') {
      dataDate = { state: 'empty' };
    } else if (isValidDate(rawDate)) {
      dataDate = { state: 'ok', value: rawDate };
    } else {
      report('PROJECT', row, 'V4', `last_recalc_date ${quote(rawDate)} isn't a valid date`, 'Field treated as empty');
      dataDate = { state: 'unreadable', raw: rawDate };
    }
    projects.set(id, { id, name: field(row, 'proj_short_name'), line: row.line, dataDate });
  }

  // CALENDAR
  const calendars = new Map<string, CalendarRecord>();
  const calendarKeys = new Map<string, number>();
  for (const row of rows.CALENDAR) {
    const id = checkKey('CALENDAR', row, 'clndr_id', [], calendarKeys);
    if (id === null) continue;
    const rawHours = field(row, 'day_hr_cnt');
    let hoursPerDay: number | null = null;
    if (rawHours !== '') {
      hoursPerDay = parseNumber(rawHours);
      if (hoursPerDay === null) {
        report('CALENDAR', row, 'V3', `day_hr_cnt ${quote(rawHours)} isn't a number`, 'Field treated as empty');
      }
    }
    calendars.set(id, { id, name: field(row, 'clndr_name'), hoursPerDay });
  }

  // TASK
  const activities = new Map<string, Activity>();
  const taskKeys = new Map<string, number>();
  for (const row of rows.TASK) {
    const id = checkKey('TASK', row, 'task_id', ['proj_id', 'clndr_id'], taskKeys);
    if (id === null) continue;

    const projectId = field(row, 'proj_id');
    if (!projects.has(projectId)) {
      const reason = projectId === '' ? 'proj_id is empty' : `Project ${projectId} isn't in this file`;
      report('TASK', row, 'F1', reason, 'Activity skipped');
      continue;
    }

    const rawFloat = field(row, 'total_float_hr_cnt');
    let floatHours: number | null = null;
    if (rawFloat !== '') {
      floatHours = parseNumber(rawFloat);
      if (floatHours === null) {
        report('TASK', row, 'V3', `total_float_hr_cnt ${quote(rawFloat)} isn't a number`, 'Field treated as empty');
      }
    }

    const calendarId = field(row, 'clndr_id');
    const calendar = calendarId === '' ? undefined : calendars.get(calendarId);
    let hoursNote: string | null = null;
    if (!calendar) {
      const reason = calendarId === '' ? 'clndr_id is empty' : `Calendar ${calendarId} isn't in CALENDAR`;
      report('TASK', row, 'F2', reason, 'Activity kept, 8 h a day assumed');
      hoursNote = calendarId === '' ? 'it has no calendar' : `calendar ${calendarId} isn't in the file`;
    } else if (calendar.hoursPerDay === null || calendar.hoursPerDay <= 0) {
      hoursNote = `calendar ${calendarId} has no hours per day`;
    }
    const hoursPerDay =
      calendar && calendar.hoursPerDay !== null && calendar.hoursPerDay > 0
        ? calendar.hoursPerDay
        : DEFAULT_HOURS_PER_DAY;

    activities.set(id, {
      taskId: id,
      projectId,
      code: field(row, 'task_code'),
      name: field(row, 'task_name'),
      type: field(row, 'task_type'),
      status: field(row, 'status_code'),
      calendarId,
      calendarName: calendar?.name ?? null,
      floatHours,
      hoursPerDay,
      assumedHours: hoursNote !== null,
      hoursNote,
      floatDays: floatHours === null ? null : floatHours / hoursPerDay,
      line: row.line,
    });
  }

  // TASKPRED
  const links: Link[] = [];
  const linkKeys = new Map<string, number>();
  const pairs = new Map<string, number>();
  const isOutside = (projectId: string) => projectId !== '' && !projects.has(projectId);
  for (const row of rows.TASKPRED) {
    const id = checkKey('TASKPRED', row, 'task_pred_id', ['task_id', 'pred_task_id', 'proj_id', 'pred_proj_id'], linkKeys);
    if (id === null) continue;

    const succId = field(row, 'task_id');
    const predId = field(row, 'pred_task_id');
    const succ = activities.get(succId) ?? null;
    const pred = activities.get(predId) ?? null;
    const succProjectField = field(row, 'proj_id');
    const predProjectField = field(row, 'pred_proj_id');
    const succOutside = succ === null && isOutside(succProjectField);
    const predOutside = pred === null && isOutside(predProjectField);

    if (succ === null && !succOutside) {
      const reason = succId === '' ? 'Successor task_id is empty' : `Successor activity ${succId} isn't in TASK`;
      report('TASKPRED', row, 'F3', reason, 'Link skipped');
      continue;
    }
    if (pred === null && !predOutside) {
      const reason = predId === '' ? 'pred_task_id is empty' : `Predecessor activity ${predId} isn't in TASK`;
      report('TASKPRED', row, 'F3', reason, 'Link skipped');
      continue;
    }
    if (succOutside && predOutside) {
      report('TASKPRED', row, 'F3', 'Neither activity is in this file', 'Link skipped');
      continue;
    }
    const predLabel = pred?.code || predId;
    const succLabel = succ?.code || succId;
    if (succId === predId) {
      report('TASKPRED', row, 'S1', `${succLabel} is linked to itself`, 'Link skipped');
      continue;
    }
    // A duplicate is the same pair with the same link type. Start-to-start plus finish-to-finish
    // between the same two activities is normal P6 logic, not a duplicate.
    const linkType = field(row, 'pred_type');
    const pairKey = `${predId}>${succId}>${linkType}`;
    const firstLine = pairs.get(pairKey);
    if (firstLine !== undefined) {
      const typeNote = linkType === '' ? '' : ` (${linkType})`;
      report('TASKPRED', row, 'S2', `Repeats the link ${predLabel} → ${succLabel}${typeNote} on line ${firstLine}`, 'Link skipped');
      continue;
    }
    pairs.set(pairKey, row.line);

    links.push({
      linkId: id,
      line: row.line,
      type: field(row, 'pred_type'),
      predId,
      succId,
      pred,
      succ,
      predProjectId: pred?.projectId ?? predProjectField,
      succProjectId: succ?.projectId ?? succProjectField,
    });
  }

  return { projects, calendars, activities, links, broken };
}
