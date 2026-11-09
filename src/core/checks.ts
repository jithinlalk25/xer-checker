import {
  HIGH_FLOAT_DAYS,
  HIGH_FLOAT_MAX_PCT,
  MISSING_LINKS_MAX_PCT,
  NEGATIVE_FLOAT_MAX_COUNT,
  STATUS_COMPLETE,
  TYPE_FINISH_MILESTONE,
  TYPE_LEVEL_OF_EFFORT,
  TYPE_START_MILESTONE,
  TYPE_WBS_SUMMARY,
} from './constants.ts';
import type { ProjectRecord } from './records.ts';
import type {
  Activity,
  ActivityCounts,
  ExemptItem,
  ExternalLink,
  FloatCheck,
  Link,
  MissingBucket,
  MissingLinkItem,
  MissingLinksCheck,
  ProjectResult,
  Verdict,
} from './types.ts';

/** Which activities have a predecessor and which have a successor, over all valid links. */
export interface LinkIndex {
  hasPred: ReadonlySet<string>;
  hasSucc: ReadonlySet<string>;
}

export function indexLinks(links: readonly Link[]): LinkIndex {
  const hasPred = new Set<string>();
  const hasSucc = new Set<string>();
  for (const link of links) {
    if (link.succ) hasPred.add(link.succ.taskId);
    if (link.pred) hasSucc.add(link.pred.taskId);
  }
  return { hasPred, hasSucc };
}

function pct(count: number, base: number): number | null {
  return base === 0 ? null : (count * 100) / base;
}

/** Pass if count / base × 100 ≤ maxPct, compared exactly in whole numbers. */
function pctVerdict(count: number, base: number, maxPct: number): Verdict {
  if (base === 0) return 'n/a';
  return count * 100 <= maxPct * base ? 'pass' : 'fail';
}

const BUCKET_ORDER: Record<MissingBucket, number> = { neither: 0, noPredOnly: 1, noSuccOnly: 2 };

/** Splits a project's activities into the ones checked and the ones left out, counted by reason. */
function selectChecked(activities: readonly Activity[]): { checked: Activity[]; counts: ActivityCounts } {
  const counts: ActivityCounts = { total: activities.length, checked: 0, finished: 0, levelOfEffort: 0, wbsSummary: 0 };
  const checked: Activity[] = [];
  for (const a of activities) {
    if (a.status === STATUS_COMPLETE) counts.finished++;
    else if (a.type === TYPE_LEVEL_OF_EFFORT) counts.levelOfEffort++;
    else if (a.type === TYPE_WBS_SUMMARY) counts.wbsSummary++;
    else checked.push(a);
  }
  counts.checked = checked.length;
  return { checked, counts };
}

function checkMissingLinks(
  checked: readonly Activity[],
  index: LinkIndex,
): { check: MissingLinksCheck; exempt: ExemptItem[] } {
  const items: MissingLinkItem[] = [];
  const exempt: ExemptItem[] = [];
  const buckets: Record<MissingBucket, number> = { neither: 0, noPredOnly: 0, noSuccOnly: 0 };

  for (const a of checked) {
    const noPred = !index.hasPred.has(a.taskId);
    const noSucc = !index.hasSucc.has(a.taskId);
    if (noPred && a.type === TYPE_START_MILESTONE) {
      exempt.push({ activity: a, reason: 'start-milestone-no-predecessor' });
    }
    if (noSucc && a.type === TYPE_FINISH_MILESTONE) {
      exempt.push({ activity: a, reason: 'finish-milestone-no-successor' });
    }
    const missingPred = noPred && a.type !== TYPE_START_MILESTONE;
    const missingSucc = noSucc && a.type !== TYPE_FINISH_MILESTONE;
    const bucket: MissingBucket | null =
      missingPred && missingSucc ? 'neither' : missingPred ? 'noPredOnly' : missingSucc ? 'noSuccOnly' : null;
    if (bucket) {
      buckets[bucket]++;
      items.push({ activity: a, bucket });
    }
  }
  items.sort((x, y) => BUCKET_ORDER[x.bucket] - BUCKET_ORDER[y.bucket] || x.activity.line - y.activity.line);

  const count = items.length;
  const base = checked.length;
  return {
    check: { count, base, pct: pct(count, base), verdict: pctVerdict(count, base, MISSING_LINKS_MAX_PCT), buckets, items },
    exempt,
  };
}

function checkFloat(checked: readonly Activity[]): { negative: FloatCheck; high: FloatCheck } {
  const withFloat = checked.filter((a) => a.floatDays !== null);
  const base = withFloat.length;
  const days = (a: Activity) => a.floatDays ?? 0;

  const negativeItems = withFloat.filter((a) => days(a) < 0).sort((x, y) => days(x) - days(y) || x.line - y.line);
  const highItems = withFloat
    .filter((a) => days(a) > HIGH_FLOAT_DAYS)
    .sort((x, y) => days(y) - days(x) || x.line - y.line);

  const negativeVerdict: Verdict =
    base === 0 ? 'n/a' : negativeItems.length <= NEGATIVE_FLOAT_MAX_COUNT ? 'pass' : 'fail';

  return {
    negative: {
      count: negativeItems.length,
      base,
      pct: pct(negativeItems.length, base),
      verdict: negativeVerdict,
      items: negativeItems,
    },
    high: {
      count: highItems.length,
      base,
      pct: pct(highItems.length, base),
      verdict: pctVerdict(highItems.length, base, HIGH_FLOAT_MAX_PCT),
      items: highItems,
    },
  };
}

function externalLinksFor(projectId: string, links: readonly Link[]): ExternalLink[] {
  const result: ExternalLink[] = [];
  for (const link of links) {
    if (link.pred === null && link.succ?.projectId === projectId) {
      result.push({
        linkId: link.linkId,
        line: link.line,
        type: link.type,
        activity: link.succ,
        outsideEnd: 'predecessor',
        outsideTaskId: link.predId,
        outsideProjectId: link.predProjectId,
      });
    } else if (link.succ === null && link.pred?.projectId === projectId) {
      result.push({
        linkId: link.linkId,
        line: link.line,
        type: link.type,
        activity: link.pred,
        outsideEnd: 'successor',
        outsideTaskId: link.succId,
        outsideProjectId: link.succProjectId,
      });
    }
  }
  return result;
}

/** Runs the 3 checks on one project. */
export function checkProject(
  project: ProjectRecord,
  activities: readonly Activity[],
  links: readonly Link[],
  index: LinkIndex,
): ProjectResult {
  const { checked, counts } = selectChecked(activities);
  const missing = checkMissingLinks(checked, index);
  const float = checkFloat(checked);

  return {
    id: project.id,
    name: project.name,
    line: project.line,
    dataDate: project.dataDate,
    counts,
    checks: { missingLinks: missing.check, negativeFloat: float.negative, highFloat: float.high },
    exempt: missing.exempt,
    noFloat: activities.filter((a) => a.status !== STATUS_COMPLETE && a.floatHours === null),
    assumedHours: activities.filter((a) => a.assumedHours),
    externalLinks: externalLinksFor(project.id, links),
  };
}
