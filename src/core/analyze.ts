import { checkProject, indexLinks } from './checks.ts';
import { decodeXer, startsWithErmhdr } from './decode.ts';
import { findLoops } from './loops.ts';
import { NotXerError, readXer, type ReadResult } from './reader.ts';
import { buildModel } from './records.ts';
import type { Activity, BrokenRow, Encoding, FileResult, ProjectResult, XerWarning } from './types.ts';

const KIND_ORDER = ['L2', 'L3', 'L4', 'L5', 'V1', 'V3', 'V2', 'V4', 'F1', 'F2', 'F3', 'S1', 'S2'];

export interface ReadStage {
  name: string;
  size: number;
  encoding: Encoding;
  read: ReadResult;
}

/** Stage 1: decode the bytes and read the lines. Throws NotXerError if line 1 isn't ERMHDR. */
export function readStage(name: string, bytes: Uint8Array): ReadStage {
  if (!startsWithErmhdr(bytes)) throw new NotXerError();
  const { text, encoding } = decodeXer(bytes);
  return { name, size: bytes.byteLength, encoding, read: readXer(text) };
}

/** Stage 2: build the records, apply the rules and run the checks. */
export function checkStage({ name, size, encoding, read }: ReadStage): FileResult {
  const model = buildModel(read.rows);

  const broken: BrokenRow[] = [...read.broken, ...model.broken].sort(
    (x, y) => x.line - y.line || KIND_ORDER.indexOf(x.kind) - KIND_ORDER.indexOf(y.kind),
  );

  const brokenLinesByTable = new Map<string | null, Set<number>>();
  for (const row of broken) {
    const lines = brokenLinesByTable.get(row.table) ?? new Set<number>();
    lines.add(row.line);
    brokenLinesByTable.set(row.table, lines);
  }
  const tables = read.tables.map((t) => ({ ...t, broken: brokenLinesByTable.get(t.name)?.size ?? 0 }));
  const brokenRowCount = new Set(broken.map((b) => b.line)).size;

  const byProject = new Map<string, Activity[]>();
  for (const activity of model.activities.values()) {
    const list = byProject.get(activity.projectId);
    if (list) list.push(activity);
    else byProject.set(activity.projectId, [activity]);
  }

  const index = indexLinks(model.links);
  const projects: ProjectResult[] = [];
  for (const project of model.projects.values()) {
    const activities = byProject.get(project.id);
    if (!activities || activities.length === 0) continue;
    projects.push(checkProject(project, activities, model.links, index));
  }

  const warnings: XerWarning[] = [];
  if (!read.hasEndMarker) {
    warnings.push({
      kind: 'no-end-marker',
      message: 'The file has no closing %E line, so it may be cut off.',
      line: null,
      projectId: null,
      activity: null,
    });
  }
  const activityWarnings: XerWarning[] = [];
  for (const project of projects) {
    for (const a of project.noFloat) {
      activityWarnings.push({
        kind: 'no-float',
        message: `${a.code} has no float, so it's left out of the float checks.`,
        line: a.line,
        projectId: project.id,
        activity: a.code,
      });
    }
    for (const a of project.assumedHours) {
      activityWarnings.push({
        kind: 'assumed-hours',
        message: `${a.code}: 8 hours a day assumed, because ${a.hoursNote ?? 'its calendar has no hours per day'}.`,
        line: a.line,
        projectId: project.id,
        activity: a.code,
      });
    }
  }
  warnings.push(...activityWarnings.sort((x, y) => (x.line ?? 0) - (y.line ?? 0)));

  return {
    name,
    size,
    encoding,
    header: read.header,
    tables,
    brokenRowCount,
    broken,
    warnings,
    loops: findLoops(model.activities, model.links),
    projectsInFile: model.projects.size,
    activityCount: model.activities.size,
    linkCount: model.links.length,
    projects,
  };
}

/** Reads and checks one XER file. Throws NotXerError if it isn't one. */
export function analyzeXer(name: string, bytes: Uint8Array): FileResult {
  return checkStage(readStage(name, bytes));
}
