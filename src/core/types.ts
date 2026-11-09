export type Encoding = 'UTF-8' | 'Windows-1252';

/** Broken-row kinds. L1 (not an XER file) refuses the whole file, so it never appears on a row. */
export type BrokenKind =
  | 'L2'
  | 'L3'
  | 'L4'
  | 'L5'
  | 'V1'
  | 'V2'
  | 'V3'
  | 'V4'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'S1'
  | 'S2';

export type RuleId = 'L1' | BrokenKind;

export type BrokenCategory = 'Layout' | 'Values' | 'References' | 'Logic slip';

/** What the checker did with a broken row. */
export type BrokenEffect =
  | 'Row skipped'
  | 'Line skipped'
  | 'Field treated as empty'
  | 'Activity skipped'
  | 'Activity kept, 8 h a day assumed'
  | 'Link skipped';

export interface BrokenRow {
  /** The table the line sits in, or null if it comes before any %T. */
  table: string | null;
  /** 1-based line number in the file. */
  line: number;
  kind: BrokenKind;
  category: BrokenCategory;
  /** What is wrong, in plain words. */
  reason: string;
  effect: BrokenEffect;
  /** The start of the raw line, tabs included. */
  excerpt: string;
}

export type WarningKind = 'no-end-marker' | 'no-float' | 'assumed-hours';

export interface XerWarning {
  kind: WarningKind;
  message: string;
  line: number | null;
  projectId: string | null;
  /** The activity's task_code, when the warning is about one activity. */
  activity: string | null;
}

export interface XerHeader {
  version: string;
  exportDate: string;
}

export interface TableSummary {
  name: string;
  /** Line of the table's first %T. */
  line: number;
  /** Number of %R lines in the table, broken ones included. */
  rows: number;
  /** Number of distinct lines in the table with at least one broken-row entry. */
  broken: number;
}

export interface Activity {
  taskId: string;
  projectId: string;
  /** task_code: the activity ID people see in P6. */
  code: string;
  name: string;
  /** task_type code, e.g. TT_Task. */
  type: string;
  /** status_code, e.g. TK_NotStart. */
  status: string;
  calendarId: string;
  calendarName: string | null;
  /** P6's stored total float in hours, or null when empty or unreadable. */
  floatHours: number | null;
  hoursPerDay: number;
  /** True when hours per day fell back to the default. */
  assumedHours: boolean;
  /** Why hours per day fell back, in plain words, lower case (e.g. "calendar 7777 isn't in the file"). */
  hoursNote: string | null;
  /** floatHours / hoursPerDay, unrounded. */
  floatDays: number | null;
  line: number;
}

/** A valid link. An end that is null lies outside the file (an external link). */
export interface Link {
  linkId: string;
  line: number;
  /** pred_type, e.g. PR_FS. */
  type: string;
  predId: string;
  succId: string;
  pred: Activity | null;
  succ: Activity | null;
  predProjectId: string;
  succProjectId: string;
}

export interface ExternalLink {
  linkId: string;
  line: number;
  type: string;
  /** The end of the link inside this project. */
  activity: Activity;
  /** Which end lies outside the file. */
  outsideEnd: 'predecessor' | 'successor';
  outsideTaskId: string;
  outsideProjectId: string;
}

export type Verdict = 'pass' | 'fail' | 'n/a';

export interface CheckSummary {
  count: number;
  /** The number of activities the % is worked out on. */
  base: number;
  /** count / base × 100, unrounded; null when base is 0. */
  pct: number | null;
  verdict: Verdict;
}

export type MissingBucket = 'neither' | 'noPredOnly' | 'noSuccOnly';

export interface MissingLinkItem {
  activity: Activity;
  bucket: MissingBucket;
}

export interface MissingLinksCheck extends CheckSummary {
  buckets: Record<MissingBucket, number>;
  /** Worst first: neither, then no predecessor only, then no successor only. */
  items: MissingLinkItem[];
}

export interface FloatCheck extends CheckSummary {
  /** Worst first. */
  items: Activity[];
}

export type ExemptReason = 'start-milestone-no-predecessor' | 'finish-milestone-no-successor';

export interface ExemptItem {
  activity: Activity;
  reason: ExemptReason;
}

export type DataDate =
  | { state: 'ok'; value: string }
  | { state: 'unreadable'; raw: string }
  | { state: 'empty' };

export interface ActivityCounts {
  total: number;
  checked: number;
  finished: number;
  levelOfEffort: number;
  wbsSummary: number;
}

export interface ProjectResult {
  id: string;
  name: string;
  line: number;
  dataDate: DataDate;
  counts: ActivityCounts;
  checks: {
    missingLinks: MissingLinksCheck;
    negativeFloat: FloatCheck;
    highFloat: FloatCheck;
  };
  exempt: ExemptItem[];
  /** Unfinished activities with no float. */
  noFloat: Activity[];
  /** Activities whose hours per day fell back to the default. */
  assumedHours: Activity[];
  externalLinks: ExternalLink[];
}

export interface Loop {
  /** In file order. */
  activities: Activity[];
}

export interface FileResult {
  name: string;
  size: number;
  encoding: Encoding;
  header: XerHeader;
  tables: TableSummary[];
  /** Number of distinct lines with at least one broken-row entry. */
  brokenRowCount: number;
  /** Every problem found, in line order. A line can have more than one. */
  broken: BrokenRow[];
  warnings: XerWarning[];
  loops: Loop[];
  /** Valid PROJECT rows, whether or not they have activities. */
  projectsInFile: number;
  activityCount: number;
  linkCount: number;
  /** Projects with at least one activity, in file order. */
  projects: ProjectResult[];
}
